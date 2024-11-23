const nodemailer = require('nodemailer');
const cron = require('node-cron');
const Todo = require('../models/Todo');
const User = require('../models/User');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Funzione per inviare email
const sendEmail = async (to, subject, todoTitle) => {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #2c3e50;">⏰ Promemoria TempTodo</h2>
      <p>Ciao! 👋</p>
      <p>Il tuo todo sta per scadere:</p>
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <strong>${todoTitle}</strong>
      </div>
      <p>Questo todo verrà automaticamente eliminato tra poco.</p>
      <hr style="border: 1px solid #eee; margin: 20px 0;">
      <p style="color: #666; font-size: 12px;">
        Questa è una notifica automatica da TempTodo. Per favore non rispondere a questa email.
      </p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"TempTodo" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlContent,
      text: `Promemoria TempTodo\n\nIl tuo todo sta per scadere:\n${todoTitle}\n\nQuesto todo verrà automaticamente eliminato tra poco.`
    });
    console.log(`📧 Notifica inviata a ${to}`);
  } catch (error) {
    console.error('Errore nell\'invio email:', error);
  }
};

// Funzione per controllare e inviare notifiche
const checkAndSendNotifications = async () => {
  try {
    // Trova tutti i todo che devono essere notificati nei prossimi 5 minuti
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60000);
    
    const todosToNotify = await Todo.find({
      notifyAt: {
        $gte: now,
        $lte: fiveMinutesFromNow
      },
      notified: { $ne: true } // Aggiungiamo un flag per evitare notifiche duplicate
    }).populate('user');

    // Invia notifiche per ogni todo
    for (const todo of todosToNotify) {
      await sendEmail(
        todo.user.email,
        'Promemoria TempTodo',
        `Non dimenticare: ${todo.title}\nQuesto todo si autodistruggerà tra poco!`
      );

      // Marca il todo come notificato
      todo.notified = true;
      await todo.save();
    }
  } catch (error) {
    console.error('Errore nel controllo notifiche:', error);
  }
};

// Avvia il job di notifica ogni minuto
const startNotificationService = () => {
  console.log('🔔 Servizio notifiche avviato');
  cron.schedule('* * * * *', checkAndSendNotifications);
};

module.exports = {
  startNotificationService,
  sendEmail
};