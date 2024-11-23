const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Registrazione
router.post('/register', async (req, res) => {
  try {
    console.log('📝 Inizio registrazione nuovo utente...');
    const { email, password } = req.body;
    
    console.log('🔍 Verifica email esistente:', email);
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      console.log('❌ Email già registrata');
      return res.status(400).json({
        status: 'error',
        message: 'Email già registrata'
      });
    }

    console.log('👤 Creazione nuovo utente...');
    const user = new User({ email, password });
    await user.save();

    console.log('🔑 Generazione token...');
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('✅ Registrazione completata con successo');
    res.status(201).json({
      status: 'success',
      data: {
        userId: user._id,
        email: user.email,
        token
      }
    });
  } catch (error) {
    console.error('❌ Errore durante la registrazione:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    console.log('🔑 Tentativo di login...');
    const { email, password } = req.body;

    // Trova l'utente
    console.log('🔍 Ricerca utente...');
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ Utente non trovato');
      return res.status(401).json({
        status: 'error',
        message: 'Credenziali non valide'
      });
    }

    // Verifica password
    console.log('🔐 Verifica password...');
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('❌ Password non valida');
      return res.status(401).json({
        status: 'error',
        message: 'Credenziali non valide'
      });
    }

    // Genera token
    console.log('🎟️ Generazione nuovo token...');
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('✅ Login completato con successo');
    res.json({
      status: 'success',
      data: {
        userId: user._id,
        email: user.email,
        token
      }
    });
  } catch (error) {
    console.error('❌ Errore durante il login:', error);
    res.status(500).json({
      status: 'error',
      message: 'Errore durante il login'
    });
  }
});

// Verifica token (endpoint opzionale per test)
router.get('/verify', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Token non fornito'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Utente non trovato'
      });
    }

    res.json({
      status: 'success',
      data: {
        userId: user._id,
        email: user.email
      }
    });
  } catch (error) {
    res.status(401).json({
      status: 'error',
      message: 'Token non valido'
    });
  }
});

module.exports = router