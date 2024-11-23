const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Aumenta il timeout a livello di schema
const options = {
  bufferCommands: false, // Disabilita il buffering
  maxTimeMS: 20000      // Timeout massimo per le operazioni
};

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email obbligatoria'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password obbligatoria'],
    minlength: [6, 'La password deve essere di almeno 6 caratteri']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, options);

// Hash della password prima del salvataggio
userSchema.pre('save', async function(next) {
  console.log('📋 Pre-save hook utente...');
  if (!this.isModified('password')) {
    console.log('Password non modificata, skip hash');
    return next();
  }
  
  try {
    console.log('🔒 Hashing password...');
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    console.log('✅ Password hashata con successo');
    next();
  } catch (error) {
    console.error('❌ Errore durante l\'hashing della password:', error);
    next(error);
  }
});

// Metodo per verificare la password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Aggiungi middleware per il logging delle operazioni
userSchema.pre('findOne', function() {
  console.log('🔍 Esecuzione findOne su User...');
  this.setOptions({ maxTimeMS: 20000 });
});

const User = mongoose.model('User', userSchema);

module.exports = User;