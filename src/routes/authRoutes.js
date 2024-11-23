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
    // Imposta timeout esplicito per findOne
    const existingUser = await User.findOne({ email })
      .maxTimeMS(20000)
      .exec();
    
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
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Il resto del codice rimane invariato...

module.exports = router;