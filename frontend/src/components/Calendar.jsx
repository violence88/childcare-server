import React, { useState, useEffect } from 'react';
import { format, addWeeks, subWeeks, startOfWeek, addDays } from 'date-fns';
import { de } from 'date-fns/locale';

const Calendar = ({ events, user }) => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [timeBlocks] = useState([
    { id: 'morning', name: 'Morgen', start: 8, end: 12 },
    { id: 'lunch', name: 'Mittag', start: 12, end: 13 },
    { id: 'afternoon', name: 'Nachmittag', start: 13, end: 15 },
    { id: 'late', name: 'Später Nachmittag', start: 15, end: 17 },
    { id: 'evening', name: 'Abend/Nacht', start: 17, end: 8 }
  ]);

  // Woche ändern
  const nextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));
  const prevWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));

  // Wochenansicht generieren
  const weekDays = [];
  const startDate = startOfWeek(currentWeek, { locale: de });
  
  for (let i = 0; i < 7; i++) {
    weekDays.push(addDays(startDate, i));
  }

  // Termine für einen bestimmten Tag und Zeitblock filtern
  const getEventsForBlock = (date, blockName) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear() &&
        event.timeBlock === blockName
      );
    });
  };

  return (
    <div className="calendar">
      <div className="week-selector">
        <button onClick={prevWeek}>← Vorherige Woche</button>
        <h2>KW {format(currentWeek, 'w')} - {format(currentWeek, 'MMMM yyyy', { locale: de })}</h2>
        <button onClick={nextWeek}>Nächste Woche →</button>
      </div>
      
      <div className="week-view">
        {weekDays.map((day, index) => (
          <div key={index} className="day-column">
            <h3>{format(day, 'EEEEEE dd.MM', { locale: de })}</h3>
            
            {timeBlocks.map(block => (
              <div key={block.id} className="time-block">
                <h4>{block.name}</h4>
                
                {getEventsForBlock(day, block.name).map(event => (
                  <div key={event._id} className={`event ${event.caregiver.toLowerCase()}`}>
                    <div className="event-header">
                      <span className="child">{event.child}</span>
                      <span className="activity">{event.activityType && getEmoji(event.activityType)}</span>
                    </div>
                    <div className="event-title">{event.title}</div>
                    <div className="event-caregiver">{event.caregiver}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

// Emoji für Aktivitätstypen
const getEmoji = (type) => {
  const emojiMap = {
    'Ferien': '🏖️',
    'Arbeit': '💼',
    'Schule': '🏫',
    'Sport': '⚽',
    'Arzt': '🏥',
    'Geburtstag': '🎂'
  };
  
  return emojiMap[type] || '';
};

export default Calendar;