import React from 'react';
import { ArrowUpRight, Clock, Users, Zap } from 'lucide-react';
import { UserAvailability } from '../types.js';

interface StatCardsProps {
  participants: UserAvailability[];
  bestSlot: { date: string; time: string; count: number } | null;
}

export const StatCards: React.FC<StatCardsProps> = ({ participants, bestSlot }) => {
  const totalSlotsSubmitted = participants.reduce((acc, p) => acc + p.slots.length, 0);

  const bestSlotDisplay = bestSlot
    ? `${bestSlot.date.slice(5)} ${bestSlot.time}`
    : 'Brak danych';

  const bestPercentage = bestSlot && participants.length > 0
    ? Math.round((bestSlot.count / participants.length) * 100)
    : 0;

  return (
    <div className="stats-cards-row">
      <div className="metric-card">
        <div className="metric-card-top">
          <span className="metric-label">Uczestnicy</span>
          <Users size={16} color="#64748b" />
        </div>
        <div className="metric-value-wrap">
          <span className="metric-value">{participants.length}</span>
          <span className="metric-tag">
            <ArrowUpRight size={12} />
            {totalSlotsSubmitted} slotów
          </span>
        </div>
        <span className="metric-caption">Zgłoszenia w ostatnich 24h</span>
        <div className="mini-equalizer">
          {[40, 65, 80, 50, 95, 70, 85, 45, 100, 60, 75, 90, 55, 80].map((h, i) => (
            <div
              key={i}
              className={`eq-bar ${i === 8 ? 'highlight' : i % 2 === 0 ? 'active' : ''}`}
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-card-top">
          <span className="metric-label">Najlepszy termin</span>
          <Zap size={16} color="#10b981" />
        </div>
        <div className="metric-value-wrap">
          <span className="metric-value" style={{ fontSize: '1.45rem' }}>
            {bestSlotDisplay}
          </span>
          <span className="metric-tag">
            {bestPercentage}%
          </span>
        </div>
        <span className="metric-caption">
          {bestSlot ? `${bestSlot.count} z ${participants.length} członków wolnych` : 'Zaznacz dostępność'}
        </span>
        <div className="mini-equalizer">
          {[20, 25, 30, 40, 55, 70, 85, 95, 100, 80, 60, 40, 30, 20].map((h, i) => (
            <div
              key={i}
              className={`eq-bar ${h > 70 ? 'active' : ''}`}
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-card-top">
          <span className="metric-label">Rekomendowany czas</span>
          <Clock size={16} color="#64748b" />
        </div>
        <div className="metric-value-wrap">
          <span className="metric-value">1.5h</span>
          <span className="metric-tag">Optymalny</span>
        </div>
        <span className="metric-caption">Długość sesji roboczej koła</span>
        <div className="mini-equalizer">
          {[50, 50, 70, 70, 90, 90, 80, 80, 60, 60, 40, 40, 30, 30].map((h, i) => (
            <div
              key={i}
              className="eq-bar active"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
