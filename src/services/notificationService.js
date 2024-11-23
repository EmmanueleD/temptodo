const nodemailer = require('nodemailer');
const cron = require('node-cron');
const Todo = require('../models/Todo');
const User = require('../models/User');

// Debug delle variabili email
console.log('📧 Configurazione Email:');
console.log('- EMAIL_USER configurato:', !!process.env.EMAIL_USER);
console.log('- EMAIL_PASSWORD configurato:', !!process.env.EMAIL_PASSWORD);

// Configurazione del trasportatore email con più debug
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  debug: true, // Abilita debug
  logger: true // Abilita logging
});

// Verifica la configurazione del trasportatore all'avvio
const verifyTransporter = async () => {
  try {
    console.log('🔍 Verifica configurazione email...');
    await transporter.verify();
    console.log('✅ Configurazione email verificata con successo');
    return true;
  } catch (error) {
    console.error('❌ Errore configurazione email:', error);
    return false;
  }
};

// Funzione per inviare email con più logging
const sendEmail = async (to, subject, text) => {
  try {
    console.log('📨 Tentativo invio email:');
    console.log('- To:', to);
    console.log('- Subject:', subject);
    
    const info = await transporter.sendMail({
      from: `"TempTodo Notifiche" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #2c3e50;">⏰ Promemoria TempTodo</h2>
          <p>Ciao! 👋</p>
          <p>Il tuo todo sta per scadere:</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong>${text}</strong>
          </div>
          <p>Questo todo verrà automaticamente eliminato tra poco.</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            Questa è una notifica automatica da TempTodo.
          </p>
        </div>
      `
    });

    console.log('✅ Email inviata con successo!');
    console.log('- Message ID:', info.messageId);
    console.log('- Response:', info.response);
    return true;
  } catch (error) {
    console.error('❌ Errore invio email:', error);
    console.error('Dettagli errore:', JSON.stringify(error, null, 2));
    return false;
  }
};

// Funzione per controllare e inviare notifiche con più logging
const checkAndSendNotifications = async () => {
  try {
    console.log('\n🔍 Inizio controllo notifiche:', new Date().toISOString());
    
    // Trova tutti i todo che devono essere notificati
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60000);
    
    console.log('Ricerca todos da notificare tra:', now.toISOString(), 'e', fiveMinutesFromNow.toISOString());
    
    const todosToNotify = await Todo.find({
      notifyAt: {
        $gte: now,
        $lte: fiveMinutesFromNow
      },
      notified: { $ne: true }
    }).populate('user');

    console.log('Trovati todos da notificare:', todosToNotify.length);

    // Invia notifiche per ogni todo
    for (const todo of todosToNotify) {
      console.log('\n📝 Processo todo:', todo._id);
      console.log('- Titolo:', todo.title);
      console.log('- Utente:', todo.user.email);
      console.log('- Notifica programmata per:', todo.notifyAt);

      const emailSent = await sendEmail(
        todo.user.email,
        'Promemoria TempTodo',
        todo.title
      );

      if (emailSent) {
        console.log('✅ Notifica inviata, aggiorno stato todo');
        todo.notified = true;
        await todo.save();
      }
    }

    console.log('\n✅ Controllo notifiche completato');
  } catch (error) {
    console.error('❌ Errore durante il controllo notifiche:', error);
  }
};

// Avvia il job di notifica
const startNotificationService = async () => {
  console.log('🚀 Avvio servizio notifiche...');
  
  // Verifica configurazione email
  const isEmailConfigured = await verifyTransporter();
  if (!isEmailConfigured) {
    console.error('❌ Servizio email non configurato correttamente');
    return;
  }

  // Schedula il controllo ogni minuto
  console.log('⏰ Configurazione job di notifica...');
  cron.schedule('* * * * *', checkAndSendNotifications);
  console.log('✅ Servizio notifiche avviato con successo');
  
  // Esegui un primo controllo immediato
  await checkAndSendNotifications();
};

module.exports = {
  startNotificationService,
  sendEmail
};