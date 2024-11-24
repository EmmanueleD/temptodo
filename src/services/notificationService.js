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

// Funzione per controllare e inviare notifiche con più logging
const checkAndSendNotifications = async () => {
  try {
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60000);
    
    console.log('\n🔍 Controllo Notifiche:');
    console.log('- Ora corrente:', now.toISOString());
    console.log('- Cerco notifiche fino a:', fiveMinutesFromNow.toISOString());

    // Trova todos da notificare
    const todosToNotify = await Todo.find({
      notifyAt: {
        $gte: now,
        $lte: fiveMinutesFromNow
      },
      notified: { $ne: true }
    }).populate('user');

    console.log('📊 Stato ricerca:');
    console.log('- Todos trovati:', todosToNotify.length);

    // Log dettagliato di ogni todo trovato
    if (todosToNotify.length > 0) {
      console.log('\n📝 Dettaglio todos da notificare:');
      todosToNotify.forEach(todo => {
        console.log(`\nTodo ID: ${todo._id}`);
        console.log(`- Titolo: ${todo.title}`);
        console.log(`- Notifica programmata per: ${todo.notifyAt}`);
        console.log(`- Email utente: ${todo.user.email}`);
      });
    } else {
      console.log('ℹ️ Nessun todo da notificare in questo momento');
    }

    // Invia notifiche
    for (const todo of todosToNotify) {
      console.log(`\n📨 Invio notifica per todo: ${todo._id}`);
      
      try {
        const info = await transporter.sendMail({
          from: `"TempTodo Reminder" <${process.env.EMAIL_USER}>`,
          to: todo.user.email,
          subject: "🔔 Promemoria TempTodo",
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; background: #f8f9fa; border-radius: 5px;">
              <h2>⏰ Promemoria Todo</h2>
              <p>Ciao! Un tuo todo sta per scadere:</p>
              <div style="background: #fff; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="margin: 0; color: #2c3e50;">${todo.title}</h3>
                <p style="color: #666; margin: 10px 0 0 0;">
                  Questo todo verrà eliminato automaticamente tra poco.
                </p>
              </div>
              <hr style="border: 1px solid #eee; margin: 20px 0;">
              <p style="color: #666; font-size: 12px;">
                TempTodo - I tuoi promemoria temporanei
              </p>
            </div>
          `
        });

        console.log('✅ Email inviata con successo');
        console.log('- Message ID:', info.messageId);
        
        // Aggiorna lo stato del todo
        todo.notified = true;
        await todo.save();
        console.log('✅ Todo marcato come notificato');
      } catch (error) {
        console.error('❌ Errore invio email:', error);
      }
    }

  } catch (error) {
    console.error('❌ Errore durante il controllo notifiche:', error);
    console.error('Stack:', error.stack);
  }
};

// Avvia il servizio notifiche con più logging
const startNotificationService = async () => {
  console.log('\n🚀 Avvio servizio notifiche');
  
  try {
    // Verifica iniziale trasportatore
    console.log('🔍 Verifica configurazione email...');
    await transporter.verify();
    console.log('✅ Configurazione email verificata');

    // Schedula il job
    console.log('⏰ Configurazione job di notifica (ogni minuto)...');
    cron.schedule('* * * * *', () => {
      console.log('\n⏰ Esecuzione job notifiche:', new Date().toISOString());
      checkAndSendNotifications();
    });

    console.log('✅ Servizio notifiche avviato con successo');
    
    // Esegui primo controllo
    console.log('\n🔄 Esecuzione controllo iniziale...');
    await checkAndSendNotifications();
  } catch (error) {
    console.error('❌ Errore avvio servizio notifiche:', error);
    console.error('Stack:', error.stack);
  }
};

module.exports = {
  startNotificationService,
  checkAndSendNotifications
};