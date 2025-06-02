import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const Stats = ({ events }) => {
  const [stats, setStats] = useState({
    saraDays: 0,
    fabioDays: 0,
    jointDays: 0,
    imbalance: 0,
    imbalanceWarning: false
  });

  // Statistiken berechnen
  useEffect(() => {
    if (events.length === 0) return;
    
    const saraDays = events.filter(e => e.overnightCaregiver === 'Sara').length;
    const fabioDays = events.filter(e => e.overnightCaregiver === 'Fabio').length;
    const jointDays = events.filter(e => e.overnightCaregiver === 'Gemeinsam').length;
    const totalDays = saraDays + fabioDays + jointDays;
    
    const imbalance = Math.abs(saraDays - fabioDays) / totalDays;
    const imbalanceWarning = imbalance > 0.1;
    
    setStats({
      saraDays,
      fabioDays,
      jointDays,
      imbalance,
      imbalanceWarning
    });
  }, [events]);

  // Daten für Diagramm
  const data = [
    { name: 'Sara', value: stats.saraDays },
    { name: 'Fabio', value: stats.fabioDays },
    { name: 'Gemeinsam', value: stats.jointDays }
  ];
  
  const COLORS = ['#FF6384', '#36A2EB', '#FFCE56'];

  return (
    <div className="stats-container">
      <h2>Betreuungsstatistik</h2>
      
      {stats.imbalanceWarning && (
        <div className="warning-banner">
          ⚠️ Achtung: Ungleichgewicht größer als 10% (Differenz: {Math.round(stats.imbalance * 100)}%)
        </div>
      )}
      
      <div className="stats-grid">
        <div className="pie-chart">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="numbers">
          <div className="stat-item sara">
            <span className="stat-value">{stats.saraDays}</span>
            <span className="stat-label">Sara Tage</span>
          </div>
          <div className="stat-item fabio">
            <span className="stat-value">{stats.fabioDays}</span>
            <span className="stat-label">Fabio Tage</span>
          </div>
          <div className="stat-item joint">
            <span className="stat-value">{stats.jointDays}</span>
            <span className="stat-label">Gemeinsame Tage</span>
          </div>
          <div className="stat-item difference">
            <span className="stat-value">{Math.abs(stats.saraDays - stats.fabioDays)}</span>
            <span className="stat-label">Differenz</span>
          </div>
        </div>
      </div>
      
      <div className="print-button">
        <button onClick={() => window.print()}>Statistik drucken</button>
      </div>
    </div>
  );
};

export default Stats;