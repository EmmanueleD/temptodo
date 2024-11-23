require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Debug delle variabili d'ambiente all'avvio
console.log('🔍 Verifica variabili d\'ambiente:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MONGODB_URI presente:', !!process.env.MONGODB_URI);
console.log('JWT_SECRET presente:', !!process.env.JWT_SECRET);
console.log('EMAIL_USER presente:', !!process.env.EMAIL_USER);
console.log('EMAIL_PASSWORD presente:', !!process.env.EMAIL_PASSWORD);

// Verifica formato MONGODB_URI
if (process.env.MONGODB_URI) {
  console.log('MONGODB_URI format check:');
  console.log('- Starts with mongodb+srv://', process.env.MONGODB_URI.startsWith('mongodb+srv://'));
  console.log('- Contains @', process.env.MONGODB_URI.includes('@'));
  console.log('- Contains mongodb.net', process.env.MONGODB_URI.includes('mongodb.net'));
}

// Importa le rotte
const authRoutes = require('./src/routes/authRoutes');
const todoRoutes = require('./src/routes/todoRoutes');

// Inizializza express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Middleware di logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check route con info env
app.get('/', (req, res) => {
  res.json({ 
    app: 'TempTodo API',
    status: 'healthy',
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

// Usa le rotte
app.use('/api/auth', authRoutes);
app.use('/api/todos', todoRoutes);

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
      minPoolSize: 1
    });

    console.log('📦 Connesso con successo a MongoDB');
    return true;
  } catch (error) {
    console.error('❌ Errore connessione MongoDB:', error.message);
    return false;
  }
};

// Avvio server con retry
const startServer = async (retryCount = 0) => {
  try {
    const isConnected = await connectDB();
    if (!isConnected && retryCount < 5) {
      console.log(`Tentativo ${retryCount + 1} di 5 - Riprovo tra 5 secondi...`);
      setTimeout(() => startServer(retryCount + 1), 5000);
      return;
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server TempTodo attivo sulla porta ${PORT}`);
      console.log(`📝 Ambiente: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Errore durante l\'avvio del server:', error);
    if (retryCount < 5) {
      console.log(`Tentativo ${retryCount + 1} di 5 - Riprovo tra 5 secondi...`);
      setTimeout(() => startServer(retryCount + 1), 5000);
    } else {
      console.error('Impossibile avviare il server dopo 5 tentativi');
      process.exit(1);
    }
  }
};

startServer();