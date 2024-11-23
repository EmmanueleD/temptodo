# TempTodo

TempTodo è un'applicazione per gestire todo che si autodistruggono dopo 24 ore, con sistema di notifiche via email.

## Funzionalità

- ✨ Creazione todo con scadenza automatica 24 ore
- 🔐 Autenticazione utenti
- 📧 Sistema di notifiche email
- 🔄 API RESTful
- ⏰ Promemoria automatici prima della scadenza

## Prerequisiti

- Node.js >= 18
- MongoDB (utilizziamo MongoDB Atlas)
- Account Gmail per l'invio delle notifiche

## Installazione

1. Clona il repository
```bash
git clone [url-repository]
cd temptodo
```

2. Installa le dipendenze
```bash
npm install
```

3. Configura le variabili d'ambiente
```bash
cp config/production.env.example config/production.env
```

4. Modifica `config/production.env` con i tuoi valori:
```env
PORT=3000
NODE_ENV=production
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email
EMAIL_PASSWORD=your_app_specific_password
```

## Sviluppo

Avvia il server in modalità sviluppo:
```bash
npm run dev
```

## API Endpoints

### Autenticazione
- `POST /api/auth/register` - Registrazione utente
- `POST /api/auth/login` - Login utente

### Todos
- `GET /api/todos` - Lista todos
- `POST /api/todos` - Crea nuovo todo
- `PATCH /api/todos/:id` - Aggiorna todo
- `DELETE /api/todos/:id` - Elimina todo

## Configurazione Email

1. Vai su https://myaccount.google.com/security
2. Attiva "Verifica in due passaggi"
3. Genera una "Password per le app"
4. Usa questa password nel file di configurazione

## Deploy

Il progetto include:
- Dockerfile per containerizzazione
- Configurazione PM2 per process management
- File di configurazione per diversi ambienti

## Note di Sicurezza

⚠️ IMPORTANTE:
- Non committare mai `config/production.env`
- Mantieni sempre private le credenziali
- Usa HTTPS in produzione

## Struttura Progetto

```
temptodo-backend/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/