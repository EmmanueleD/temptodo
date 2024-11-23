const express = require('express');
const router = express.Router();
const Todo = require('../models/Todo');
const auth = require('../middleware/auth');

// Ottieni tutti i todos
router.get('/', auth, async (req, res) => {
  try {
    const todos = await Todo.find({ user: req.user._id })
      .sort({ createdAt: -1 });
    
    res.json({
      status: 'success',
      data: todos
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
});

// Crea nuovo todo
router.post('/', auth, async (req, res) => {
  try {
    const todo = new Todo({
      ...req.body,
      user: req.user._id
    });
    
    await todo.save();
    
    res.status(201).json({
      status: 'success',
      data: todo
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
});

router.post('/test-notification', auth, async (req, res) => {
  try {
    const { sendEmail } = require('../services/notificationService');
    
    console.log('🔍 Test invio email...');
    const result = await sendEmail(
      req.user.email,
      'Test TempTodo Notification',
      '🔔 Questa è una email di test da TempTodo!'
    );

    if (result) {
      res.json({
        status: 'success',
        message: 'Email di test inviata con successo'
      });
    } else {
      throw new Error('Invio email fallito');
    }
  } catch (error) {
    console.error('❌ Errore test email:', error);
    res.status(500).json({
      status: 'error',
      message: 'Errore nell\'invio dell\'email di test',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Aggiorna todo
router.patch('/:id', auth, async (req, res) => {
  try {
    const todo = await Todo.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true }
    );

    if (!todo) {
      return res.status(404).json({
        status: 'error',
        message: 'Todo non trovato'
      });
    }

    res.json({
      status: 'success',
      data: todo
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
});

// Elimina todo
router.delete('/:id', auth, async (req, res) => {
  try {
    const todo = await Todo.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!todo) {
      return res.status(404).json({
        status: 'error',
        message: 'Todo non trovato'
      });
    }

    res.json({
      status: 'success',
      message: 'Todo eliminato'
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
});

module.exports = router;