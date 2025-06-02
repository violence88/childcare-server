import React, { useState, useEffect } from 'react';
import Calendar from './components/Calendar';
import Chat from './components/Chat';
import Stats from './components/Stats';
import io from 'socket.io-client';

const socket = io('http://localhost:4000');

function App() {
  const [events, setEvents] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeTab, setActiveTab] = useState('calendar');
  const [background, setBackground] = useState('');
  const [user, setUser] = useState('');

  // Hintergrundbilder laden
  useEffect(() => {
    const images = [
      'https://nextcloud.marti88.com/s/k3zmE8AmF9PQxaD/download/image1.jpg',
      'https://nextcloud.marti88.com/s/k3zmE8AmF9PQxaD/download/image2.jpg',
      'https://nextcloud.marti88.com/s/k3zmE8AmF9PQxaD/download/image3.jpg',
      // ... weitere Bilder
    ];
    setBackground(images[Math.floor(Math.random() * images.length)]);
  }, []);

  // Termine laden
  useEffect(() => {
    fetch('/api/events')
      .then(res => res.json())
      .then(setEvents);
    
    socket.on('events-updated', () => {
      fetch('/api/events')
        .then(res => res.json())
        .then(setEvents);
    });
  }, []);

  // Nachrichten laden
  useEffect(() => {
    fetch('/api/chat')
      .then(res => res.json())
      .then(setMessages);
    
    socket.on('new-message', (message) => {
      setMessages(prev => [...prev, message]);
    });
  }, []);

  // Benutzeridentifikation (vereinfacht)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const userParam = urlParams.get('user');
    setUser(userParam || 'Gast');
  }, []);

  return (
    <div className="app">
      {/* Hintergrund mit Blur-Effekt */}
      <div className="background" style={{ 
        backgroundImage: `url(${background})`,
        filter: 'blur(8px)',
        position: 'fixed',
        width: '100%',
        height: '100%',
        zIndex: -1
      }} />
      
      <div className="content">
        <header>
          <h1>Familienkalender Marti</h1>
          <nav>
            <button 
              className={activeTab === 'calendar' ? 'active' : ''}
              onClick={() => setActiveTab('calendar')}
            >
              Kalender
            </button>
            <button 
              className={activeTab === 'chat' ? 'active' : ''}
              onClick={() => setActiveTab('chat')}
            >
              Chat
            </button>
            <button 
              className={activeTab === 'stats' ? 'active' : ''}
              onClick={() => setActiveTab('stats')}
            >
              Statistik
            </button>
          </nav>
          <div className="user-info">Eingeloggt als: {user}</div>
        </header>
        
        <main>
          {activeTab === 'calendar' && <Calendar events={events} user={user} />}
          {activeTab === 'chat' && <Chat messages={messages} user={user} />}
          {activeTab === 'stats' && <Stats events={events} />}
        </main>
        
        <footer>
          <p>© {new Date().getFullYear()} Familienkalender Marti</p>
        </footer>
      </div>
    </div>
  );
}

export default App;