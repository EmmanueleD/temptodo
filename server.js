// Configurazione porta
const PORT = process.env.PORT || 3000;

// Funzione per gestire la connessione MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 Connesso a MongoDB');
    return true;
  } catch (error) {
    console.error('Errore connessione MongoDB:', error);
    return false;
  }
};

// Avvio server con retry
const startServer = async (retryCount = 0) => {
  try {
    const isConnected = await connectDB();
    if (!isConnected && retryCount < 5) {
      console.log(`Tentativo ${retryCount + 1} di 5 - Riprovo tra 5 secondi...`);
      setTimeout(() => startServer(retryCount + 1), 5000);
      return;
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server TempTodo attivo sulla porta ${PORT}`);
      console.log(`📝 Ambiente: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Errore durante l\'avvio del server:', error);
    if (retryCount < 5) {
      console.log(`Tentativo ${retryCount + 1} di 5 - Riprovo tra 5 secondi...`);
      setTimeout(() => startServer(retryCount + 1), 5000);
    } else {
      console.error('Impossibile avviare il server dopo 5 tentativi');
      process.exit(1);
    }
  }
};

// Gestione errori non catturati
process.on('unhandledRejection', (error) => {
  console.error('Errore non gestito:', error);
});

startServer();