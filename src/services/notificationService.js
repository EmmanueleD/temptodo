const nodemailer = require('nodemailer');
const cron = require('node-cron');
const Todo = require('../models/Todo');
const User = require('../models/User');

// Configurazione del trasportatore email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  debug: true,
  logger: true
});

// Debug delle variabili email
console.log('📧 Configurazione Email:');
console.log('- EMAIL_USER configurato:', !!process.env.EMAIL_USER);
console.log('- EMAIL_PASSWORD configurato:', !!process.env.EMAIL_PASSWORD);

// Funzione di test della configurazione email
const testEmailConfiguration = async () => {
  try {
    console.log('\n🔍 Test Configurazione Email:');
    console.log('1. Verifica variabili ambiente:');
    console.log('- EMAIL_USER:', process.env.EMAIL_USER ? '✅ Configurato' : '❌ Mancante');
    console.log('- EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✅ Configurato' : '❌ Mancante');
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      throw new Error('Variabili email mancanti');
    }

    console.log('\n2. Configurazione Nodemailer:');
    console.log('Verifica configurazione del trasportatore...');

    console.log('\n3. Verifica connessione SMTP:');
    await transporter.verify();
    console.log('✅ Connessione SMTP verificata con successo');

    console.log('\n4. Invio email di test:');
    const info = await transporter.sendMail({
      from: `"TempTodo Test" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: "Test Configurazione TempTodo",
      text: "Se ricevi questa email, la configurazione è corretta!",
      html: `
        <div style="padding: 20px; background: #f8f9fa; border-radius: 5px;">
          <h2>🎉 Test Configurazione TempTodo</h2>
          <p>Se ricevi questa email, la configurazione è corretta!</p>
          <hr>
          <p><strong>Dettagli tecnici:</strong></p>
          <ul>
            <li>Data: ${new Date().toISOString()}</li>
            <li>Email: ${process.env.EMAIL_USER}</li>
            <li>Ambiente: ${process.env.NODE_ENV}</li>
          </ul>
        </div>
      `
    });

    console.log('✅ Email di test inviata con successo');
    console.log('- Message ID:', info.messageId);
    console.log('- Response:', info.response);

    return true;
  } catch (error) {
    console.error('\n❌ Errore test configurazione email:', error);
    console.error('Stack trace:', error.stack);
    return false;
  }
};

// Funzione per inviare email
const sendEmail = async (to, subject, text) => {
  try {
    const info = await transporter.sendMail({
      from: `"TempTodo" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html: `
        <div style="padding: 20px; background: #f8f9fa; border-radius: 5px;">
          <h2>⏰ ${subject}</h2>
          <p>${text}</p>
        </div>
      `
    });
    console.log('📧 Email inviata:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Errore invio email:', error);
    return false;
  }
};

// Funzione per controllare e inviare notifiche
const checkAndSendNotifications = async () => {
  try {
    console.log('\n🔍 Controllo notifiche:', new Date().toISOString());
    
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60000);
    
    const todosToNotify = await Todo.find({
      notifyAt: {
        $gte: now,
        $lte: fiveMinutesFromNow
      },
      notified: { $ne: true }
    }).populate('user');

    console.log('Trovati todos da notificare:', todosToNotify.length);

    for (const todo of todosToNotify) {
      console.log('\n📝 Processo todo:', todo._id);
      const emailSent = await sendEmail(
        todo.user.email,
        'Promemoria TempTodo',
        todo.title
      );

      if (emailSent) {
        todo.notified = true;
        await todo.save();
        console.log('✅ Notifica inviata e todo aggiornato');
      }
    }
  } catch (error) {
    console.error('❌ Errore durante il controllo notifiche:', error);
  }
};

// Funzione per avviare il servizio notifiche
const startNotificationService = async () => {
  console.log('🚀 Avvio servizio notifiche...');
  
  try {
    await testEmailConfiguration();
    console.log('⏰ Configurazione job di notifica...');
    cron.schedule('* * * * *', checkAndSendNotifications);
    console.log('✅ Servizio notifiche avviato con successo');
    
    // Esegui un primo controllo immediato
    await checkAndSendNotifications();
  } catch (error) {
    console.error('❌ Errore avvio servizio notifiche:', error);
  }
};

// Esporta tutte le funzioni necessarie
module.exports = {
  startNotificationService,
  sendEmail,
  testEmailConfiguration
};