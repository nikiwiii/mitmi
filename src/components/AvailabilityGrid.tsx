import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Check, Users, UserCheck, Trash2, Save, Sparkles } from 'lucide-react';
import { Meeting, UserAvailability, SlotHoverInfo } from '../types.js';

interface AvailabilityGridProps {
  meeting: Meeting;
  participants: UserAvailability[];
  currentUserName: string;
  mySlots: string[];
  setMySlots: React.Dispatch<React.SetStateAction<string[]>>;
  onSaveMySlots: () => void;
  onClearMySlots: () => void;
  isSaving: boolean;
}

export const AvailabilityGrid: React.FC<AvailabilityGridProps> = ({
  meeting,
  participants,
  currentUserName,
  mySlots,
  setMySlots,
  onSaveMySlots,
  onClearMySlots,
  isSaving
}) => {
  const [viewMode, setViewMode] = useState<'heatmap' | 'edit'>('heatmap');
  const [hoverInfo, setHoverInfo] = useState<SlotHoverInfo | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragSelectMode, setDragSelectMode] = useState<boolean>(true);

  // generowanie godzin w przedziale co 30 minut
  const timeSlots: string[] = [];
  for (let h = meeting.startHour; h <= meeting.endHour; h++) {
    const hh = h.toString().padStart(2, '0');
    timeSlots.push(`${hh}:00`);
    if (h < meeting.endHour) {
      timeSlots.push(`${hh}:30`);
    }
  }

  // mapa zagregowanej dostepnosci
  const slotCountMap = new Map<string, string[]>();
  participants.forEach(p => {
    p.slots.forEach(slot => {
      const arr = slotCountMap.get(slot) || [];
      arr.push(p.userName);
      slotCountMap.set(slot, arr);
    });
  });

  const totalParticipants = participants.length;

  const handleMouseDown = (slotKey: string) => {
    if (viewMode !== 'edit') return;
    setIsDragging(true);
    const alreadySelected = mySlots.includes(slotKey);
    const shouldSelect = !alreadySelected;
    setDragSelectMode(shouldSelect);

    setMySlots(prev =>
      shouldSelect
        ? Array.from(new Set([...prev, slotKey]))
        : prev.filter(s => s !== slotKey)
    );
  };

  const handleMouseEnterCell = (slotKey: string, date: string, time: string, e: React.MouseEvent) => {
    if (isDragging && viewMode === 'edit') {
      setMySlots(prev =>
        dragSelectMode
          ? Array.from(new Set([...prev, slotKey]))
          : prev.filter(s => s !== slotKey)
      );
    }

    if (viewMode === 'heatmap') {
      const availableUsers = slotCountMap.get(slotKey) || [];
      const missingUsers = participants
        .map(p => p.userName)
        .filter(name => !availableUsers.includes(name));

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const showBelow = rect.top < 150;
      const centerX = rect.left + rect.width / 2;
      const clampedX = Math.max(130, Math.min(window.innerWidth - 130, centerX));

      setHoverInfo({
        date,
        time,
        slotKey,
        count: availableUsers.length,
        total: totalParticipants,
        availableUsers,
        missingUsers,
        x: clampedX,
        y: showBelow ? rect.bottom + 8 : rect.top - 8,
        placement: showBelow ? 'bottom' : 'top'
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const onGlobalMouseUp = () => setIsDragging(false);
    const onScroll = () => setHoverInfo(null);
    window.addEventListener('mouseup', onGlobalMouseUp);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      window.removeEventListener('mouseup', onGlobalMouseUp);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, []);

  const formatDateLabel = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const days = ['Niedz.', 'Pon.', 'Wt.', 'Śr.', 'Czw.', 'Pt.', 'Sob.'];
      const dayName = days[d.getDay()] || dateStr;
      return {
        dayName,
        dateFormatted: dateStr.slice(5)
      };
    } catch {
      return { dayName: dateStr, dateFormatted: '' };
    }
  };

  const getHeatmapClass = (count: number, total: number) => {
    if (count === 0) return 'slot-level-0';
    if (total <= 1) return 'slot-level-max';
    const ratio = count / total;
    if (ratio === 1) return 'slot-level-max';
    if (ratio >= 0.75) return 'slot-level-4';
    if (ratio >= 0.5) return 'slot-level-3';
    if (ratio >= 0.25) return 'slot-level-2';
    return 'slot-level-1';
  };

  return (
    <section className="grid-section-card">
      <div className="grid-section-header">
        <div className="grid-mode-selector">
          <button
            type="button"
            className={`mode-btn ${viewMode === 'heatmap' ? 'active' : ''}`}
            onClick={() => setViewMode('heatmap')}
          >
            <Users size={15} />
            <span>Siatka zespołu (Heatmapa)</span>
          </button>
          <button
            type="button"
            className={`mode-btn ${viewMode === 'edit' ? 'active' : ''}`}
            onClick={() => setViewMode('edit')}
          >
            <UserCheck size={15} />
            <span>Moja dostępność ({currentUserName})</span>
          </button>
        </div>

        {viewMode === 'heatmap' ? (
          <div className="heatmap-legend">
            <span>Dostępność:</span>
            <div className="legend-bar">
              <div className="legend-block slot-level-0" title="0 osób" />
              <div className="legend-block slot-level-1" title="1 osoba" />
              <div className="legend-block slot-level-2" title="kilka osób" />
              <div className="legend-block slot-level-4" title="większość" />
              <div className="legend-block slot-level-max" title="wszyscy wolni" />
            </div>
            <span style={{ color: '#15803d' }}>Wszyscy wolni</span>
          </div>
        ) : (
          <div className="grid-toolbar-actions">
            <button
              type="button"
              className="btn-pill-small"
              onClick={() => {
                // zaznacz wszystkie sloty
                const all: string[] = [];
                meeting.dates.forEach(d => {
                  timeSlots.forEach(t => all.push(`${d}T${t}`));
                });
                setMySlots(all);
              }}
            >
              <Check size={12} />
              Zaznacz wszystkie
            </button>
            <button
              type="button"
              className="btn-pill-small"
              onClick={onClearMySlots}
            >
              <Trash2 size={12} />
              Wyczyść
            </button>
            <button
              type="button"
              className="btn-pill-small save-btn"
              onClick={onSaveMySlots}
              disabled={isSaving}
            >
              <Save size={12} />
              {isSaving ? 'Zapisywanie...' : 'Zapisz dostępność'}
            </button>
          </div>
        )}
      </div>

      <div
        className="grid-scroll-wrapper"
        onMouseLeave={() => setHoverInfo(null)}
      >
        <div className="availability-grid-table">
          <div
            className="grid-header-row"
            style={{
              gridTemplateColumns: `70px repeat(${meeting.dates.length}, minmax(100px, 1fr))`
            }}
          >
            <div className="grid-time-header">Godzina</div>
            {meeting.dates.map(dateStr => {
              const { dayName, dateFormatted } = formatDateLabel(dateStr);
              return (
                <div key={dateStr} className="grid-day-header">
                  <span className="day-header-dayname">{dayName}</span>
                  <span className="day-header-date">{dateFormatted}</span>
                </div>
              );
            })}
          </div>

          {timeSlots.map(time => (
            <div
              key={time}
              className="grid-time-row"
              style={{
                gridTemplateColumns: `70px repeat(${meeting.dates.length}, minmax(100px, 1fr))`
              }}
            >
              <span className="time-row-label">{time}</span>
              {meeting.dates.map(date => {
                const slotKey = `${date}T${time}`;
                const available = slotCountMap.get(slotKey) || [];
                const isMineSelected = mySlots.includes(slotKey);

                let cellClass = 'grid-slot-cell ';
                if (viewMode === 'edit') {
                  cellClass += isMineSelected ? 'slot-selected-mine' : 'slot-level-0';
                } else {
                  cellClass += getHeatmapClass(available.length, totalParticipants);
                }

                return (
                  <div
                    key={slotKey}
                    className={cellClass}
                    onMouseDown={() => handleMouseDown(slotKey)}
                    onMouseEnter={(e) => handleMouseEnterCell(slotKey, date, time, e)}
                  >
                    {viewMode === 'edit' && isMineSelected && (
                      <Check size={13} strokeWidth={3} />
                    )}
                    {viewMode === 'heatmap' && available.length > 0 && (
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: available.length === totalParticipants ? '#ffffff' : '#1e293b' }}>
                        {available.length}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {hoverInfo && viewMode === 'heatmap' && createPortal(
        <div
          className={`slot-hover-tooltip placement-${hoverInfo.placement || 'top'}`}
          style={{
            left: `${hoverInfo.x}px`,
            top: `${hoverInfo.y}px`
          }}
        >
          <div className="tooltip-time">
            {hoverInfo.date} • {hoverInfo.time}
          </div>
          <div className="tooltip-count">
            {hoverInfo.count} z {hoverInfo.total} osób dostępnych (
            {hoverInfo.total > 0
              ? Math.round((hoverInfo.count / hoverInfo.total) * 100)
              : 0}
            %)
          </div>

          {hoverInfo.availableUsers.length > 0 && (
            <div style={{ marginBottom: '4px' }}>
              <div style={{ fontSize: '0.7rem', opacity: 0.8, marginBottom: '2px' }}>
                Dostępni:
              </div>
              <div className="tooltip-users">
                {hoverInfo.availableUsers.map(name => (
                  <span key={name} className="tooltip-user-badge">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {hoverInfo.missingUsers.length > 0 && (
            <div>
              <div style={{ fontSize: '0.7rem', opacity: 0.8, marginBottom: '2px' }}>
                Zajęci:
              </div>
              <div className="tooltip-users">
                {hoverInfo.missingUsers.map(name => (
                  <span key={name} className="tooltip-user-badge tooltip-user-missing">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>,
        document.body
      )}
    </section>
  );
};
