require('dotenv').config();
const nodemailer = require('nodemailer');

// Configurazione del trasportatore
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Funzione di test
async function testEmail() {
  try {
    // Invia email di test
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // inviamo a noi stessi per il test
      subject: 'Test TempTodo Notification',
      text: 'Se ricevi questa email, il sistema di notifiche di TempTodo funziona correttamente! 🎉',
      html: `
        <h2>Test Notifica TempTodo</h2>
        <p>Se ricevi questa email, il sistema di notifiche di TempTodo funziona correttamente! 🎉</p>
        <br>
        <p>Dettagli tecnici:</p>
        <ul>
          <li>Data invio: ${new Date().toLocaleString()}</li>
          <li>Ambiente: ${process.env.NODE_ENV}</li>
        </ul>
      `
    });

    console.log('✅ Email di test inviata con successo!');
    console.log('📧 ID Messaggio:', info.messageId);
  } catch (error) {
    console.error('❌ Errore nell\'invio dell\'email:', error);
    
    if (error.code === 'EAUTH') {
      console.log('\n🔍 Suggerimenti per risolvere il problema:');
      console.log('1. Verifica che EMAIL_USER e EMAIL_PASSWORD siano corretti nel file .env');
      console.log('2. Assicurati di aver generato una "Password per le app" da Google');
      console.log('3. Controlla che la verifica in due passaggi sia attiva sul tuo account Google');
    }
  }
}

// Esegui il test
testEmail()