import React, { useState, useEffect, useRef } from 'react';

const Chat = ({ messages, user }) => {
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);

  // Nachrichten automatisch nach unten scrollen
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = () => {
    if (newMessage.trim() === '') return;
    
    fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user: user,
        text: newMessage
      })
    });
    
    setNewMessage('');
    setShowEmojiPicker(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const addEmoji = (emoji) => {
    setNewMessage(prev => prev + emoji);
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`message ${msg.isBot ? 'bot-message' : ''} ${msg.user.includes('_bot') ? 'bot-log' : ''}`}
          >
            <span className={`user ${msg.user.toLowerCase()}`}>{msg.user}:</span>
            <span className="text">{msg.text}</span>
            <span className="time">
              {new Date(msg.timestamp).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="message-input">
        <button 
          className="emoji-toggle" 
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
        >
          😀
        </button>
        
        {showEmojiPicker && (
          <div className="emoji-picker">
            {['🏖️', '💼', '🏫', '⚽', '🏥', '🎂', '❤️', '👍', '👎'].map(emoji => (
              <button 
                key={emoji} 
                className="emoji" 
                onClick={() => addEmoji(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
        
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Nachricht eingeben..."
          rows={1}
        />
        
        <button 
          className="send-button" 
          onClick={sendMessage}
          disabled={newMessage.trim() === ''}
        >
          Senden
        </button>
      </div>
    </div>
  );
};

export default Chat;