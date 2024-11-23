require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { startNotificationService } = require('./src/services/notificationService');

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

// Usa le rotte
app.use('/api/auth', authRoutes);
app.use('/api/todos', todoRoutes);

// Rotta di base
app.get('/', (req, res) => {
  res.json({ 
    app: 'TempTodo API',
    status: 'active',
    version: '1.0.0'
  });
});

// Gestione errori
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    status: 'error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Si è verificato un errore interno'
  });
});

// Configurazione porta
const PORT = process.env.PORT || 3000;

// Avvio server
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 Connesso a MongoDB');

    // Avvia il servizio di notifiche
    startNotificationService();

    app.listen(PORT, () => {
      console.log(`🚀 Server TempTodo attivo sulla porta ${PORT}`);
      console.log(`📝 Ambiente: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Errore durante l\'avvio del server:', error);
    process.exit(1);
  }
};

startServer()