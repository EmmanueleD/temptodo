require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { startNotificationService } = require('./src/services/notificationService'); // Aggiungi questa riga

// Importa le rotte
const authRoutes = require('./src/routes/authRoutes');
const todoRoutes = require('./src/routes/todoRoutes');

// Inizializza express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Flag per lo stato della connessione
let isDbConnected = false;

// Middleware per verificare la connessione al DB
const checkDbConnection = (req, res, next) => {
  if (!isDbConnected) {
    return res.status(503).json({
      status: 'error',
      message: 'Database non disponibile, riprova tra qualche secondo'
    });
  }
  next();
};

// Middleware di logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check route con info env
app.get('/', (req, res) => {
  res.json({ 
    app: 'TempTodo API',
    status: isDbConnected ? 'fully_operational' : 'database_connecting',
    version: '1.0.0',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    envCheck: {
      mongodbUri: !!process.env.MONGODB_URI,
      jwtSecret: !!process.env.JWT_SECRET,
      emailConfig: !!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD)
    }
  });
});

// Usa le rotte con check della connessione
app.use('/api/auth', checkDbConnection, authRoutes);
app.use('/api/todos', checkDbConnection, todoRoutes);

// Gestione errori
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    status: 'error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Si è verificato un errore interno',
    timestamp: new Date().toISOString()
  });
});

// Configurazione porta
const PORT = process.env.PORT || 3000;

// Funzione per gestire la connessione MongoDB
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('⚠️ MONGODB_URI non è definito nelle variabili d\'ambiente');
    }

    console.log('🔌 Tentativo di connessione a MongoDB...');
    
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 20000,
      socketTimeoutMS: 45000,
      family: 4,
      maxPoolSize: 10,
      minPoolSize: 1,
      bufferCommands: true
    });

    isDbConnected = true;
    console.log('📦 Connesso con successo a MongoDB');
    return true;
  } catch (error) {
    console.error('❌ Errore connessione MongoDB:', error.message);
    isDbConnected = false;
    return false;
  }
};

// Gestione riconnessione MongoDB
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnesso!');
  isDbConnected = false;
});

mongoose.connection.on('connected', () => {
  console.log('MongoDB riconnesso!');
  isDbConnected = true;
});

// Avvio server
const startServer = async () => {
  // Avvia comunque il server HTTP
  app.listen(PORT, () => {
    console.log(`🚀 Server TempTodo attivo sulla porta ${PORT}`);
    console.log(`📝 Ambiente: ${process.env.NODE_ENV}`);
  });

  // Tenta la connessione al database con retry
  let retryCount = 0;
  const maxRetries = 5;
  
  const tryConnect = async () => {
    if (retryCount < maxRetries) {
      const connected = await connectDB();
      if (!connected) {
        retryCount++;
        console.log(`Tentativo ${retryCount} di ${maxRetries} - Riprovo tra 5 secondi...`);
        setTimeout(tryConnect, 5000);
      } else {
        // Avvia il servizio di notifiche solo dopo una connessione riuscita
        console.log('🔔 Avvio servizio notifiche...');
        try {
          await startNotificationService();
          console.log('✅ Servizio notifiche avviato con successo');
        } catch (error) {
          console.error('❌ Errore avvio servizio notifiche:', error);
        }
      }
    } else {
      console.error('Impossibile connettersi al database dopo 5 tentativi');
    }
  };

  tryConnect();
};

startServer();

// Gestione graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM ricevuto. Chiusura applicazione...');
  await mongoose.connection.close();
  process.exit(0);
});