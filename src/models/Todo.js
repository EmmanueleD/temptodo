const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Titolo obbligatorio'],
    trim: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  notifyAt: {
    type: Date,
    required: false
  },
  notified: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // 24 ore in secondi
  }
});

// Indice per la scadenza automatica
todoSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

const Todo = mongoose.model('Todo', todoSchema);

module.exports = Todo;