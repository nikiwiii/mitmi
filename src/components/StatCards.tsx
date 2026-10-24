import React from 'react';
import { CalendarCheck, Users, Zap } from 'lucide-react';
import { Meeting, UserAvailability } from '../types.js';

interface StatCardsProps {
  meeting?: Meeting | null;
  participants: UserAvailability[];
  bestSlot: { date: string; time: string; count: number } | null;
  currentUserName?: string;
}

export const StatCards: React.FC<StatCardsProps> = ({
  meeting,
  participants,
  bestSlot,
  currentUserName
}) => {
  // 1. Karta 1: Porownanie ilu userow zaznaczylo dostepnosc a ilu nie
  const usersWithSlots = participants.filter(p => p.slots && p.slots.length > 0);
  const usersWithoutSlots = participants.filter(p => !p.slots || p.slots.length === 0);

  // Jesli zalogowany uzytkownik jeszcze nie zapisał dostępności i nie ma go na liście uczestników
  const isCurrentUserPending = Boolean(
    currentUserName &&
    !participants.some(p => p.userName.toLowerCase() === currentUserName.toLowerCase())
  );

  const markedCount = usersWithSlots.length;
  const notMarkedCount = usersWithoutSlots.length + (isCurrentUserPending ? 1 : 0);
  const totalUsers = markedCount + notMarkedCount;

  const formatPolishDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}.${parts[1]}`;
    return dateStr;
  };

  // 2. Karta 2: Porownanie ilu userow ze wszystkich jest wtedy dostepne
  const bestSlotDisplay = bestSlot
    ? `${formatPolishDate(bestSlot.date)}, ${bestSlot.time}`
    : 'Brak terminu';

  const bestSlotCount = bestSlot ? bestSlot.count : 0;
  const totalForComparison = totalUsers > 0 ? totalUsers : (participants.length > 0 ? participants.length : 1);
  const bestPercentage = Math.round((bestSlotCount / totalForComparison) * 100);

  // 3. Karta 3: W ile dni wszyscy sa dostepni
  const slotCounts = new Map<string, number>();
  participants.forEach(p => {
    p.slots.forEach(slot => {
      slotCounts.set(slot, (slotCounts.get(slot) || 0) + 1);
    });
  });

  // Cel pelnej frekwencji to wszyscy, ktorzy dotad oddali glos (lub totalUsers)
  const fullAttendanceTarget = markedCount > 0 ? markedCount : participants.length;

  const daysWithAllAvailable = new Set<string>();
  if (fullAttendanceTarget > 0) {
    for (const [slot, count] of slotCounts.entries()) {
      if (count === fullAttendanceTarget) {
        const date = slot.split('T')[0];
        daysWithAllAvailable.add(date);
      }
    }
  }

  const fullDaysCount = daysWithAllAvailable.size;
  const totalMeetingDays = meeting?.dates?.length || 5;

  // Formatowanie pierwszego dnia z pelnym skladem (np. Sobota, 24.10)
  const firstFullDay = daysWithAllAvailable.size > 0 ? Array.from(daysWithAllAvailable).sort()[0] : null;
  const formatDayName = (dateStr: string) => {
    try {
      const d = new Date(dateStr + 'T00:00:00');
      const name = d.toLocaleDateString('pl-PL', { weekday: 'long' });
      const dayMonth = formatPolishDate(dateStr);
      return `${name.charAt(0).toUpperCase() + name.slice(1)}, ${dayMonth}`;
    } catch {
      return dateStr;
    }
  };

  // Mini-equalizer dla karty 1: proporcja zaznaczone vs niezaznaczone
  const eqBarsCount = 14;
  const markedRatio = totalUsers > 0 ? markedCount / totalUsers : 0;
  const activeEqBars = Math.round(markedRatio * eqBarsCount);

  // Mini-equalizer dla karty 3: frekwencja w kolejnych dniach spotkania
  const meetingDates = meeting?.dates || [];

  return (
    <div className="stats-cards-row">
      {/* KARTA 1: Porownanie ile osob zaznaczylo dostepnosc a ile nie */}
      <div className="metric-card">
        <div className="metric-card-top">
          <span className="metric-label">Deklaracja dostępności</span>
          <Users size={16} color="#10b981" />
        </div>
        <div className="metric-value-wrap">
          <span className="metric-value">
            <span style={{ color: '#059669' }}>{markedCount}</span>
            <span style={{ fontSize: '1.2rem', color: '#94a3b8', fontWeight: 500, margin: '0 5px' }}>vs</span>
            <span style={{ color: notMarkedCount > 0 ? '#ef4444' : '#64748b' }}>{notMarkedCount}</span>
          </span>
          {notMarkedCount === 0 && (
            <span
              className="metric-tag"
              style={{
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#059669'
              }}
            >
              100% oddanych
            </span>
          )}
        </div>
        <span className="metric-caption">
          {markedCount} {markedCount === 1 ? 'osoba zaznaczyła' : 'osoby zaznaczyły'} dostępność, {notMarkedCount} {notMarkedCount === 1 ? 'jeszcze nie' : 'jeszcze nie'}
        </span>
        <div className="mini-equalizer">
          {Array.from({ length: eqBarsCount }).map((_, i) => {
            const isGreen = i < activeEqBars;
            const isRed = !isGreen && notMarkedCount > 0 && i < activeEqBars + Math.max(1, Math.round((notMarkedCount / totalUsers) * eqBarsCount));
            const barClass = isGreen ? 'active' : isRed ? 'highlight' : '';
            return (
              <div
                key={i}
                className={`eq-bar ${barClass}`}
                style={{ height: isGreen ? '100%' : isRed ? '60%' : '28%' }}
                title={isGreen ? 'Dostępność zaznaczona' : isRed ? 'Oczekiwanie na dostępność' : 'Brak głosu'}
              />
            );
          })}
        </div>
      </div>

      {/* KARTA 2: Porownanie ile userow ze wszystkich jest wtedy dostepne */}
      <div className="metric-card">
        <div className="metric-card-top">
          <span className="metric-label">Dostępność w #1 terminie</span>
          <Zap size={16} color="#10b981" />
        </div>
        <div className="metric-value-wrap">
          <span className="metric-value">
            {bestSlotCount} <span style={{ fontSize: '1.25rem', color: '#94a3b8', fontWeight: 500 }}>z {totalForComparison}</span>
          </span>
          <span className="metric-tag">
            {bestPercentage}%
          </span>
        </div>
        <span className="metric-caption">
          {bestSlot
            ? `${bestSlotCount} z ${totalForComparison} członków wolnych (${bestSlotDisplay})`
            : 'Brak zaznaczonych slotów'}
        </span>
        <div className="mini-equalizer">
          {[
            'gray', 'gray', 'highlight', 'highlight', 'highlight',
            'active', 'active', 'active', 'active',
            'highlight', 'highlight', 'gray', 'gray', 'gray'
          ].map((type, i) => (
            <div
              key={i}
              className={`eq-bar ${type === 'active' ? 'active' : type === 'highlight' ? 'highlight' : ''}`}
              style={{ height: type === 'active' ? '100%' : type === 'highlight' ? '60%' : '28%' }}
              title={type === 'active' ? 'Optymalny slot #1 (najwyższa frekwencja)' : type === 'highlight' ? 'Slot częściowy' : 'Slot wolny'}
            />
          ))}
        </div>
      </div>

      {/* KARTA 3: W ile dni wszyscy sa dostepni */}
      <div className="metric-card">
        <div className="metric-card-top">
          <span className="metric-label">Dni z pełnym składem</span>
          <CalendarCheck size={16} color="#10b981" />
        </div>
        <div className="metric-value-wrap">
          <span className="metric-value">
            {fullDaysCount} <span style={{ fontSize: '1.25rem', color: '#94a3b8', fontWeight: 500 }}>{fullDaysCount === 1 ? 'dzień' : 'dni'}</span>
          </span>
          <span className="metric-tag">
            {totalMeetingDays > 0 ? `z ${totalMeetingDays} dni` : `${fullDaysCount > 0 ? '100% składu' : 'Brak'}`}
          </span>
        </div>
        <span className="metric-caption">
          {fullDaysCount > 0
            ? (firstFullDay ? `${formatDayName(firstFullDay)} — wszyscy są dostępni` : `Wszyscy (${fullAttendanceTarget}/${fullAttendanceTarget}) są dostępni w ${fullDaysCount === 1 ? '1 dniu' : `${fullDaysCount} dniach`}`)
            : 'Brak dnia z obecnością 100% zespołu'}
        </span>
        <div className="mini-equalizer">
          {meetingDates.length > 0 ? (
            meetingDates.map((date, idx) => {
              let maxOnDate = 0;
              for (const [slot, count] of slotCounts.entries()) {
                if (slot.startsWith(date) && count > maxOnDate) {
                  maxOnDate = count;
                }
              }
              const isFull = fullAttendanceTarget > 0 && maxOnDate === fullAttendanceTarget;
              const hasSome = maxOnDate > 0;
              const barClass = isFull ? 'active' : hasSome ? 'highlight' : '';
              return (
                <div
                  key={idx}
                  className={`eq-bar ${barClass}`}
                  style={{ height: isFull ? '100%' : hasSome ? '60%' : '28%' }}
                  title={`${date}: max ${maxOnDate}/${fullAttendanceTarget} osób`}
                />
              );
            })
          ) : (
            ['highlight', 'active', 'highlight', 'gray', 'gray'].map((type, i) => (
              <div
                key={i}
                className={`eq-bar ${type === 'active' ? 'active' : type === 'highlight' ? 'highlight' : ''}`}
                style={{ height: type === 'active' ? '100%' : type === 'highlight' ? '60%' : '28%' }}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};
