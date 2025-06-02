require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
const { google } = require('googleapis');
const PDFDocument = require('pdfkit');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// MongoDB Verbindung
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Event Schema
const eventSchema = new mongoose.Schema({
  title: String,
  child: String,
  caregiver: String,
  date: Date,
  startTime: String,
  endTime: String,
  isHoliday: Boolean,
  isRecurring: Boolean,
  activityType: String,
  overnightCaregiver: String
});

const Event = mongoose.model('Event', eventSchema);

// Chat Message Schema
const messageSchema = new mongoose.Schema({
  user: String,
  text: String,
  isBot: Boolean,
  timestamp: Date
});

const Message = mongoose.model('Message', messageSchema);

// E-Mail Setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// REST API Endpoints

// Event Endpoints
app.get('/api/events', async (req, res) => {
  try {
    const events = await Event.find();
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/events', async (req, res) => {
  const event = new Event(req.body);
  
  try {
    const newEvent = await event.save();
    
    // E-Mail Benachrichtigung
    transporter.sendMail({
      from: `"Familienkalender" <${process.env.EMAIL_USER}>`,
      to: process.env.NOTIFICATION_EMAILS,
      subject: 'Neuer Termin angelegt',
      text: `Ein neuer Termin wurde angelegt: ${req.body.title}`
    });
    
    // Chat-Bot Log
    logBotAction(req.body.caregiver, 'Termin erstellt', req.body);
    
    res.status(201).json(newEvent);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/api/events/:id', async (req, res) => {
  try {
    const updatedEvent = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    
    // Chat-Bot Log
    logBotAction(req.body.caregiver, 'Termin aktualisiert', req.body);
    
    res.json(updatedEvent);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/events/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    await event.remove();
    
    // Chat-Bot Log
    logBotAction('System', 'Termin gelöscht', event);
    
    res.json({ message: 'Event gelöscht' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Chat Endpoints
app.get('/api/chat', async (req, res) => {
  try {
    const messages = await Message.find().sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/chat', async (req, res) => {
  const message = new Message({
    user: req.body.user,
    text: req.body.text,
    isBot: false,
    timestamp: new Date()
  });
  
  try {
    const newMessage = await message.save();
    io.emit('new-message', newMessage);
    res.status(201).json(newMessage);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Google Calendar Sync
app.get('/api/google/sync', async (req, res) => {
  try {
    const events = await syncGoogleCalendar('primary');
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Digitale Unterschrift
app.post('/api/sign-handover', async (req, res) => {
  const { parent, child, location } = req.body;
  
  const signature = {
    parent,
    child,
    location,
    timestamp: new Date(),
    device: req.headers['user-agent'],
    ip: req.ip
  };
  
  try {
    // PDF-Erstellung
    const pdfDoc = new PDFDocument();
    const pdfPath = `/app/signatures/${Date.now()}_${parent}_${child}.pdf`;
    pdfDoc.pipe(fs.createWriteStream(pdfPath));
    
    pdfDoc.fontSize(20).text('Übergabeprotokoll', { align: 'center' });
    pdfDoc.moveDown();
    pdfDoc.fontSize(14).text(`Kind: ${child}`);
    pdfDoc.text(`Übergeben von: ${parent}`);
    pdfDoc.text(`Datum: ${signature.timestamp.toLocaleString('de-CH')}`);
    pdfDoc.text(`Standort: ${location.lat}, ${location.lng}`);
    pdfDoc.text(`Gerät: ${signature.device}`);
    pdfDoc.text(`IP-Adresse: ${signature.ip}`);
    
    pdfDoc.end();
    
    // Chat-Bot Log
    logBotAction(parent, 'Übergabe unterschrieben', { child });
    
    res.json({ 
      success: true,
      pdfUrl: `/signatures/${path.basename(pdfPath)}` 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Hilfsfunktionen
async function syncGoogleCalendar(calendarId) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  
  // Hier müssten die OAuth-Tokens aus der DB geladen werden
  // oauth2Client.setCredentials(tokens);
  
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  const res = await calendar.events.list({
    calendarId,
    timeMin: new Date().toISOString(),
    maxResults: 100,
    singleEvents: true,
    orderBy: 'startTime',
  });
  
  return res.data.items;
}

function logBotAction(user, action, event) {
  const emojiMap = {
    'Ferien': '🏖️',
    'Arbeit': '💼',
    'Schule': '🏫',
    'Sport': '⚽',
    'Arzt': '🏥',
    'Geburtstag': '🎂'
  };
  
  const emoji = event.activityType ? emojiMap[event.activityType] || '📅' : '📅';
  const message = {
    user: `${user}_bot`,
    text: `${action}: ${emoji} ${event.title || event.child} - ${new Date(event.date).toLocaleDateString('de-CH')}`,
    isBot: true,
    timestamp: new Date()
  };
  
  const botMessage = new Message(message);
  botMessage.save();
  io.emit('new-message', message);
}

// WebSocket Connection
io.on('connection', (socket) => {
  console.log('Neue Client-Verbindung');
  
  socket.on('event-update', async (updatedEvent) => {
    try {
      await Event.findByIdAndUpdate(updatedEvent._id, updatedEvent);
      io.emit('events-updated');
      logBotAction(updatedEvent.caregiver, 'Termin aktualisiert', updatedEvent);
    } catch (err) {
      console.error('Update fehlgeschlagen:', err);
    }
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));