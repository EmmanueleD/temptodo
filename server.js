// Importa i moduli necessari all'inizio del file
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose'); // Importazione corretta di mongoose
const cors = require('cors');

// Importa le rotte
const authRoutes = require('./src/routes/authRoutes');
const todoRoutes = require('./src/routes/todoRoutes');

mongoose.set('debug', process.env.NODE_ENV === 'development');


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

// Health check route
app.get('/', (req, res) => {
  res.json({ 
    app: 'TempTodo API',
    status: 'healthy',
    version: '1.0.0',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
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

// Gestione 404
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route non trovata',
    path: req.path
  });
});

// Configurazione porta
const PORT = process.env.PORT || 3000;

// Funzione per gestire la connessione MongoDB
const connectDB = async () => {
  try {
    console.log('🔌 Tentativo di connessione a MongoDB...');
    
    mongoose.connection.on('connected', () => {
      console.log('🎉 Mongoose connesso al DB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ Errore connessione Mongoose:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('💔 Mongoose disconnesso');
    });

    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 20000,
      socketTimeoutMS: 45000,
      family: 4,
      maxPoolSize: 10,
      minPoolSize: 1
    });

    return true;
  } catch (error) {
    console.error('❌ Errore connessione MongoDB:', error);
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

// Gestione errori non catturati
process.on('unhandledRejection', (error) => {
  console.error('Errore non gestito:', error);
});

startServer();