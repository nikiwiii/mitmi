import React, { useMemo, useState } from 'react';
import { AlertCircle, CalendarCheck, CheckCircle2, Clock, Sparkles, Users, Zap } from 'lucide-react';
import { Meeting, UserAvailability } from '../types.js';
import { UserIcon } from './UserIcon.js';

interface BestSlotsCardProps {
  meeting?: Meeting | null;
  participants: UserAvailability[];
  bestSlot: { date: string; time: string; count: number } | null;
  onSelectSlot?: (slot: string) => void;
}

export const BestSlotsCard: React.FC<BestSlotsCardProps> = ({
  meeting,
  participants,
  bestSlot,
  onSelectSlot
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'full' | 'partial' | 'empty'>('all');
  const total = participants.length;

  // Mapa awatarów użytkowników
  const avatarMap = useMemo(() => {
    const map = new Map<string, string>();
    participants.forEach(p => {
      if (p.userAvatar) map.set(p.userName, p.userAvatar);
    });
    return map;
  }, [participants]);

  // Mapa dostępności dla każdego slotu
  const slotDataMap = useMemo(() => {
    const map = new Map<string, { count: number; users: string[] }>();
    participants.forEach(p => {
      p.slots.forEach(slot => {
        const item = map.get(slot) || { count: 0, users: [] };
        item.count += 1;
        item.users.push(p.userName);
        map.set(slot, item);
      });
    });
    return map;
  }, [participants]);

  // Wszystkie możliwe sloty w ramach spotkania
  const allMeetingSlots = useMemo(() => {
    if (!meeting) return [];
    const times: string[] = [];
    for (let h = meeting.startHour; h <= meeting.endHour; h++) {
      const hh = h.toString().padStart(2, '0');
      times.push(`${hh}:00`);
      if (h < meeting.endHour) {
        times.push(`${hh}:30`);
      }
    }

    const slotsList: {
      slotKey: string;
      date: string;
      time: string;
      count: number;
      availableUsers: string[];
      missingUsers: string[];
    }[] = [];

    meeting.dates.forEach(date => {
      times.forEach(time => {
        const slotKey = `${date}T${time}`;
        const data = slotDataMap.get(slotKey) || { count: 0, users: [] };
        const missingUsers = participants
          .map(p => p.userName)
          .filter(name => !data.users.includes(name));

        slotsList.push({
          slotKey,
          date,
          time,
          count: data.count,
          availableUsers: data.users,
          missingUsers
        });
      });
    });

    return slotsList;
  }, [meeting, slotDataMap, participants]);

  // Podział slotów na kategorie
  const { fullSlots, partialSlots, emptySlots, totalSlots } = useMemo(() => {
    const totalSlots = allMeetingSlots.length;
    const full = allMeetingSlots.filter(s => total > 0 && s.count === total);
    const partial = allMeetingSlots.filter(s => s.count > 0 && s.count < total);
    const empty = allMeetingSlots.filter(s => s.count === 0);

    return {
      fullSlots: full,
      partialSlots: partial,
      emptySlots: empty,
      totalSlots
    };
  }, [allMeetingSlots, total]);

  // Realne procenty
  const fullPct = totalSlots > 0 ? Math.round((fullSlots.length / totalSlots) * 100) : 0;
  const partialPct = totalSlots > 0 ? Math.round((partialSlots.length / totalSlots) * 100) : 0;
  const emptyPct = totalSlots > 0 ? Math.max(0, 100 - fullPct - partialPct) : 100;

  // Top 3 najlepsze unikalne terminy
  const topSlots = useMemo(() => {
    return [...allMeetingSlots]
      .filter(s => s.count > 0)
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.time.localeCompare(b.time);
      })
      .slice(0, 3);
  }, [allMeetingSlots]);

  // Formatowanie pełnej daty
  const formatDateFull = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const days = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
      const months = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];
      return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
    } catch {
      return dateStr;
    }
  };

  // Formatowanie skróconego dnia dla kart
  const formatDayName = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const days = ['Niedz.', 'Pon.', 'Wt.', 'Śr.', 'Czw.', 'Pt.', 'Sob.'];
      const dayName = days[d.getDay()] || dateStr;
      const day = d.getDate();
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      return `${dayName}, ${day}.${month}`;
    } catch {
      return dateStr;
    }
  };

  const count = bestSlot ? bestSlot.count : 0;
  const percentage = total > 0 && bestSlot ? Math.round((count / total) * 100) : 0;
  const formattedDate = bestSlot ? formatDateFull(bestSlot.date) : 'Wybierz sloty w ankiecie';
  const timeRange = bestSlot ? `${bestSlot.time} (optymalny start)` : 'Brak danych';

  // Obliczenie wskaźnika konsensusu
  const consensusText = useMemo(() => {
    if (total === 0) return 'Oczekiwanie na pierwsze deklaracje uczestników spotkania.';
    if (!bestSlot || count === 0) return 'Nikt z uczestników nie wskazał jeszcze wspólnego terminu.';
    if (percentage === 100) return 'Pełna jednomyślność - 100% członków zespołu potwierdziło ten termin.';
    if (percentage >= 75) return `Wysoki konsensus - ${percentage}% obecności zespołu, najlepsza z możliwych opcji.`;
    return `Kompromisowy termin - ${percentage}% obecności członków zespołu.`;
  }, [total, bestSlot, count, percentage]);

  return (
    <div className="forecast-card">
      <div className="forecast-header">
        <div>
          <span className="forecast-title">Rekomendowany termin spotkania</span>
          <div className="forecast-best-slot">
            <span>{formattedDate}, {timeRange}</span>
          </div>
        </div>
      </div>

      {/* Rzeczywisty wykres podziału dostępności */}
      <div className="breakdown-bar-container">
        <div className="breakdown-strip">
          {/* Pełny skład */}
          <div
            className={`seg-col seg-reserved ${selectedFilter === 'full' ? 'active-filter' : ''}`}
            style={{ flex: Math.max(1, fullPct) }}
            onClick={() => setSelectedFilter(prev => prev === 'full' ? 'all' : 'full')}
            title={`Pełny skład: ${fullSlots.length} z ${totalSlots} slotów (${fullPct}%)`}
          >
            <div className="seg-label">
              <span style={{ fontWeight: 700, color: '#16a34a' }}>{fullPct}%</span>
              <span style={{ fontSize: '0.72rem', color: '#64748b', marginLeft: '6px' }}>({fullSlots.length} slotów)</span>
            </div>
            <div className="strip-segment-reserved">
              {Array.from({ length: Math.min(12, Math.max(1, fullSlots.length)) }).map((_, i) => (
                <div key={i} className="strip-block-green" />
              ))}
            </div>
          </div>

          {/* Częściowa obecność */}
          <div
            className={`seg-col seg-used ${selectedFilter === 'partial' ? 'active-filter' : ''}`}
            style={{ flex: Math.max(1, partialPct) }}
            onClick={() => setSelectedFilter(prev => prev === 'partial' ? 'all' : 'partial')}
            title={`Częściowa obecność: ${partialSlots.length} z ${totalSlots} slotów (${partialPct}%)`}
          >
            <div className="seg-label">
              <span style={{ fontWeight: 700, color: '#ea580c' }}>{partialPct}%</span>
              <span style={{ fontSize: '0.72rem', color: '#64748b', marginLeft: '6px' }}>({partialSlots.length} slotów)</span>
            </div>
            <div className="strip-segment-used" style={{ width: '100%' }} />
          </div>

          {/* Puste / niezagospodarowane */}
          <div
            className={`seg-col seg-unused ${selectedFilter === 'empty' ? 'active-filter' : ''}`}
            style={{ flex: Math.max(1, emptyPct) }}
            onClick={() => setSelectedFilter(prev => prev === 'empty' ? 'all' : 'empty')}
            title={`Brak dostępności: ${emptySlots.length} z ${totalSlots} slotów (${emptyPct}%)`}
          >
            <div className="seg-label">
              <span style={{ fontWeight: 700, color: '#0284c7' }}>{emptyPct}%</span>
              <span style={{ fontSize: '0.72rem', color: '#64748b', marginLeft: '6px' }}>({emptySlots.length} slotów)</span>
            </div>
            <div className="strip-segment-unused">
              {Array.from({ length: Math.min(24, Math.max(2, Math.round(emptyPct / 4))) }).map((_, i) => (
                <div key={i} className="strip-dot" />
              ))}
            </div>
          </div>
        </div>

        <div className="breakdown-legend">
          <div
            className="legend-item"
            style={{ cursor: 'pointer' }}
            onClick={() => setSelectedFilter(prev => prev === 'full' ? 'all' : 'full')}
          >
            <div className="legend-item-dot" style={{ background: '#2f9e45' }} />
            <span>Pełny skład ({fullSlots.length})</span>
          </div>
          <div
            className="legend-item"
            style={{ cursor: 'pointer' }}
            onClick={() => setSelectedFilter(prev => prev === 'partial' ? 'all' : 'partial')}
          >
            <div className="legend-item-dot" style={{ background: '#f07a12' }} />
            <span>Częściowa obecność ({partialSlots.length})</span>
          </div>
          <div
            className="legend-item"
            style={{ cursor: 'pointer' }}
            onClick={() => setSelectedFilter(prev => prev === 'empty' ? 'all' : 'empty')}
          >
            <div className="legend-item-dot" style={{ background: '#3fb0e6' }} />
            <span>Puste sloty ({emptySlots.length})</span>
          </div>
        </div>
      </div>

      {/* Ranking Najlepiej Dopasowanych Terminów */}
      {topSlots.length > 0 && (
        <div className="forecast-ranking-section">
          <div className="forecast-ranking-header">
            <div className="forecast-ranking-title-group">
              <span className="forecast-ranking-title">
                <Clock size={16} color="#2f9e57" />
                Najlepiej dopasowane terminy spotkania
              </span>
            </div>
          </div>

          <div className="forecast-ranking-grid">
            {topSlots.map((slot, index) => {
              const slotPct = total > 0 ? Math.round((slot.count / total) * 100) : 0;
              const isFirst = index === 0;
              const isFull = slotPct === 100;

              return (
                <div
                  key={slot.slotKey}
                  className={`ranking-slot-card ${isFirst ? 'best-choice' : ''}`}
                  onClick={() => onSelectSlot?.(slot.slotKey)}
                >
                  <div className="ranking-card-top">
                    <span>#{index + 1} {isFirst ? 'Najlepszy termin' : isFull ? 'Pełny skład' : 'Alternatywa'}</span>

                    <span className={`ranking-tag ${isFull ? 'tag-green' : 'tag-amber'}`}>
                      <Users size={11} />
                      {slot.count}/{total} ({slotPct}%)
                    </span>
                  </div>

                  <div className="ranking-slot-main">
                    <span className="ranking-slot-time">{slot.time}</span>
                    <span className="ranking-slot-date">{formatDayName(slot.date)}</span>
                  </div>

                  <div className="ranking-users-section">
                    <span className="ranking-users-label">Dostępni:</span>
                    <div className="ranking-users-list">
                      {slot.availableUsers.map(name => (
                        <span key={name} className="ranking-user-chip">
                          <span className="user-avatar-mini">
                            <UserIcon name={avatarMap.get(name)} size={11} />
                          </span>
                          <span>{name}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Wskaźnik konsensusu zespołu */}
      {/* <div className="forecast-confidence-bar">
        <div className="confidence-left">
          <AlertCircle size={15} color="#92400e" />
          <span>Wskaźnik konsensusu terminu</span>
        </div>
        <div className="confidence-right">
          <span>{percentage > 0 ? `${percentage}%` : '0%'}</span> - {consensusText}
        </div>
      </div> */}
    </div>
  );
};
