import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Check,
  Users,
  UserCheck,
  Trash2,
  Save,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
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

  // Wybrany dzien dla widoku mobilnego
  const [selectedDate, setSelectedDate] = useState<string>(() => meeting.dates[0] || '');

  // Wykrywanie widoku mobilnego
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth <= 768;
    }
    return false;
  });

  const pillsListRef = useRef<HTMLDivElement | null>(null);
  const activePillRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Utrzymanie poprawnej wybranej daty w razie zmiany meeting.dates
  useEffect(() => {
    if (meeting.dates.length > 0 && !meeting.dates.includes(selectedDate)) {
      setSelectedDate(meeting.dates[0]);
    }
  }, [meeting.dates, selectedDate]);

  const isPillDraggingRef = useRef(false);
  const pillStartXRef = useRef(0);
  const pillScrollLeftRef = useRef(0);

  // Automatyczne przewijanie aktywnego dnia do srodka paska na urzadzeniach mobilnych
  useEffect(() => {
    if (isMobile && activePillRef.current && pillsListRef.current) {
      const container = pillsListRef.current;
      const pill = activePillRef.current;
      const containerRect = container.getBoundingClientRect();
      const pillRect = pill.getBoundingClientRect();
      const pillCenter = pillRect.left - containerRect.left + container.scrollLeft + (pillRect.width / 2);
      const targetScrollLeft = pillCenter - (containerRect.width / 2);

      container.scrollTo({
        left: targetScrollLeft,
        behavior: 'smooth'
      });
    }
  }, [selectedDate, isMobile]);

  const handlePillsMouseDown = (e: React.MouseEvent) => {
    isPillDraggingRef.current = true;
    pillStartXRef.current = e.pageX - (pillsListRef.current?.offsetLeft || 0);
    pillScrollLeftRef.current = pillsListRef.current?.scrollLeft || 0;
  };

  const handlePillsMouseMove = (e: React.MouseEvent) => {
    if (!isPillDraggingRef.current || !pillsListRef.current) return;
    e.preventDefault();
    const x = e.pageX - (pillsListRef.current.offsetLeft || 0);
    const walk = (x - pillStartXRef.current) * 1.5;
    pillsListRef.current.scrollLeft = pillScrollLeftRef.current - walk;
  };

  const handlePillsMouseUpOrLeave = () => {
    isPillDraggingRef.current = false;
  };

  const activeDate =
    isMobile && selectedDate && meeting.dates.includes(selectedDate)
      ? selectedDate
      : meeting.dates[0] || '';

  const displayedDates = isMobile ? (activeDate ? [activeDate] : []) : meeting.dates;

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

  const handleCellMouseDown = (slotKey: string, e: React.MouseEvent) => {
    if (e.button !== 0) return; // Tylko lewy przycisk myszy
    if (isMobile) return;
    if (viewMode !== 'edit') return;
    e.preventDefault();
    setHoverInfo(null);
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
    if (isMobile) return;

    if (isDragging && viewMode === 'edit') {
      setHoverInfo(null);
      setMySlots(prev =>
        dragSelectMode
          ? Array.from(new Set([...prev, slotKey]))
          : prev.filter(s => s !== slotKey)
      );
      return;
    }

    if (!isDragging) {
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

  const handleCellClick = (slotKey: string, date: string, time: string, e: React.MouseEvent) => {
    if (viewMode === 'edit') {
      // Na desktopie zaznaczanie i przeciąganie obsługuje onMouseDown i onMouseEnter
      // Zapobiegamy ponownemu (podwójnemu) przełączeniu stanu przez zdarzenie click
      if (!isMobile) return;

      const alreadySelected = mySlots.includes(slotKey);
      const shouldSelect = !alreadySelected;
      setMySlots(prev =>
        shouldSelect
          ? Array.from(new Set([...prev, slotKey]))
          : prev.filter(s => s !== slotKey)
      );
    } else if (viewMode === 'heatmap') {
      const availableUsers = slotCountMap.get(slotKey) || [];
      const missingUsers = participants
        .map(p => p.userName)
        .filter(name => !availableUsers.includes(name));

      if (hoverInfo && hoverInfo.slotKey === slotKey) {
        setHoverInfo(null);
      } else {
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
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const onGlobalMouseUp = () => setIsDragging(false);
    const onScroll = () => {
      if (!isMobile) {
        setHoverInfo(null);
      }
    };
    window.addEventListener('mouseup', onGlobalMouseUp);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      window.removeEventListener('mouseup', onGlobalMouseUp);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [isMobile]);

  const formatDateLabel = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const d = parseInt(parts[2], 10);
      const dateObj = new Date(y, (m || 1) - 1, d || 1);
      const days = ['Niedz.', 'Pon.', 'Wt.', 'Śr.', 'Czw.', 'Pt.', 'Sob.'];
      const dayName = days[dateObj.getDay()] || dateStr;
      return {
        dayName,
        dateFormatted: `${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}`
      };
    } catch {
      return { dayName: dateStr, dateFormatted: dateStr.slice(5) };
    }
  };

  const getDetailedDateInfo = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const d = parseInt(parts[2], 10);
      const dateObj = new Date(y, (m || 1) - 1, d || 1);
      const daysShort = ['Niedz.', 'Pon.', 'Wt.', 'Śr.', 'Czw.', 'Pt.', 'Sob.'];
      const daysFull = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
      const months = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'];

      return {
        dayName: daysShort[dateObj.getDay()] || dateStr,
        dayNameFull: daysFull[dateObj.getDay()] || dateStr,
        dayNum: d || dateObj.getDate(),
        monthShort: months[(m || 1) - 1] || '',
        dateFormatted: `${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}`,
        dateFull: `${d} ${months[(m || 1) - 1] || ''}`
      };
    } catch {
      return {
        dayName: dateStr,
        dayNameFull: dateStr,
        dayNum: '',
        monthShort: '',
        dateFormatted: dateStr,
        dateFull: dateStr
      };
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

  const currentIndex = meeting.dates.indexOf(activeDate);

  const handlePrevDay = () => {
    if (currentIndex > 0) {
      setSelectedDate(meeting.dates[currentIndex - 1]);
      setHoverInfo(null);
    }
  };

  const handleNextDay = () => {
    if (currentIndex < meeting.dates.length - 1) {
      setSelectedDate(meeting.dates[currentIndex + 1]);
      setHoverInfo(null);
    }
  };

  const handleSelectDay = (dateStr: string) => {
    const daySlotKeys = timeSlots.map(t => `${dateStr}T${t}`);
    setMySlots(prev => Array.from(new Set([...prev, ...daySlotKeys])));
  };

  const handleClearDay = (dateStr: string) => {
    setMySlots(prev => prev.filter(s => !s.startsWith(dateStr)));
  };

  const activeDateInfo = getDetailedDateInfo(activeDate);
  const activeDateSlotsCount = mySlots.filter(s => s.startsWith(activeDate)).length;

  return (
    <section className={`grid-section-card ${isMobile ? 'is-mobile-view' : ''}`}>
      <div className="grid-section-header">
        <div className="grid-mode-selector">
          <button
            type="button"
            className={`mode-btn ${viewMode === 'heatmap' ? 'active' : ''}`}
            onClick={() => setViewMode('heatmap')}
          >
            <Users size={15} />
            <span>Dostępność zespołu</span>
          </button>
          <button
            type="button"
            className={`mode-btn ${viewMode === 'edit' ? 'active' : ''}`}
            onClick={() => setViewMode('edit')}
          >
            <UserCheck size={15} />
            <span>Zaznacz dostępność</span>
          </button>
        </div>

        {viewMode === 'heatmap' ? (
          !isMobile && <div className="heatmap-legend">
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

      {/* Pozioma lista dni dla urzadzen mobilnych eliminujaca overflow poziomy */}
      {isMobile && meeting.dates.length > 0 && (
        <div className="mobile-day-selector">
          <div className="mobile-day-selector-top">
            <div className="mobile-day-selector-heading">
              <Calendar size={15} className="mobile-day-selector-icon" />
              <span className="mobile-day-selector-title">Wybierz dzień:</span>
            </div>

            {meeting.dates.length > 1 && (
              <div className="mobile-day-nav-arrows">
                <button
                  type="button"
                  className="mobile-nav-arrow-btn"
                  onClick={handlePrevDay}
                  disabled={currentIndex <= 0}
                  title="Poprzedni dzień"
                  aria-label="Poprzedni dzień"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  className="mobile-nav-arrow-btn"
                  onClick={handleNextDay}
                  disabled={currentIndex >= meeting.dates.length - 1}
                  title="Następny dzień"
                  aria-label="Następny dzień"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>

          <div className="mobile-day-pills-wrapper">
            <div
              className="mobile-day-pills-list"
              ref={pillsListRef}
              onMouseDown={handlePillsMouseDown}
              onMouseMove={handlePillsMouseMove}
              onMouseUp={handlePillsMouseUpOrLeave}
              onMouseLeave={handlePillsMouseUpOrLeave}
            >
              {meeting.dates.map(dateStr => {
                const info = getDetailedDateInfo(dateStr);
                const isActive = dateStr === activeDate;
                const daySlotsCount = mySlots.filter(s => s.startsWith(dateStr)).length;

                // Podsumowanie dostepnosci zespolu dla tego dnia
                let maxAvailable = 0;
                timeSlots.forEach(t => {
                  const c = (slotCountMap.get(`${dateStr}T${t}`) || []).length;
                  if (c > maxAvailable) maxAvailable = c;
                });

                return (
                  <button
                    key={dateStr}
                    ref={isActive ? activePillRef : null}
                    type="button"
                    className={`mobile-day-pill ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedDate(dateStr);
                      setHoverInfo(null);
                    }}
                  >
                    <span className="mobile-day-pill-name">{info.dayName}</span>
                    <span className="mobile-day-pill-date">{info.dateFormatted}</span>

                    {viewMode === 'edit' ? (
                      <span
                        className={`mobile-day-pill-badge ${daySlotsCount > 0 ? 'has-slots' : 'no-slots'
                          }`}
                      >
                        {daySlotsCount > 0 && <Check size={10} strokeWidth={3} />}
                        <span>{daySlotsCount > 0 ? `${daySlotsCount}` : '0'}</span>
                      </span>
                    ) : (
                      <span
                        className={`mobile-day-pill-badge ${maxAvailable > 0 ? 'heatmap-active' : 'no-slots'
                          }`}
                      >
                        <Users size={10} />
                        <span>
                          {maxAvailable}/{totalParticipants}
                        </span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {viewMode === 'edit' && (
            <div className="mobile-day-quick-actions">
              <span className="mobile-day-quick-label">
                {activeDateInfo.dayNameFull}, {activeDateInfo.dateFull}
              </span>
              <div className="mobile-day-quick-btns">
                <button
                  type="button"
                  className="mobile-quick-btn"
                  onClick={() => handleSelectDay(activeDate)}
                  title="Zaznacz wszystkie sloty tego dnia"
                >
                  <Check size={12} />
                  Zaznacz dzień
                </button>
                <button
                  type="button"
                  className="mobile-quick-btn danger"
                  onClick={() => handleClearDay(activeDate)}
                  title="Wyczyść sloty tego dnia"
                >
                  <Trash2 size={12} />
                  Wyczyść dzień
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div
        className="grid-scroll-wrapper"
        onMouseLeave={() => {
          if (!isMobile) setHoverInfo(null);
        }}
      >
        <div className="availability-grid-table">
          <div
            className="grid-header-row"
            style={{
              gridTemplateColumns: isMobile
                ? '60px 1fr'
                : `70px repeat(${meeting.dates.length}, minmax(100px, 1fr))`
            }}
          >
            <br />
            {displayedDates.map(dateStr => {
              const { dayName, dateFormatted } = formatDateLabel(dateStr);
              return (
                <div
                  key={dateStr}
                  className={`grid-day-header ${isMobile ? 'mobile-day-selected-header' : ''}`}
                >
                  <span className="day-header-dayname">
                    {isMobile ? activeDateInfo.dayNameFull : dayName}
                  </span>
                  <span className="day-header-date">
                    {isMobile
                      ? `${activeDateInfo.dateFull} (${activeDateSlotsCount} zaznaczonych)`
                      : dateFormatted}
                  </span>
                </div>
              );
            })}
          </div>

          {timeSlots.map(time => (
            <div
              key={time}
              className="grid-time-row"
              style={{
                gridTemplateColumns: isMobile
                  ? '60px 1fr'
                  : `70px repeat(${meeting.dates.length}, minmax(100px, 1fr))`
              }}
            >
              <span className="time-row-label">{time}</span>
              {displayedDates.map(date => {
                const slotKey = `${date}T${time}`;
                const available = slotCountMap.get(slotKey) || [];
                const isMineSelected = mySlots.includes(slotKey);

                // Zawsze zachowujemy zielone zabarwienie frekwencji zespołu
                const heatmapClass = getHeatmapClass(available.length, totalParticipants);
                let cellClass = `grid-slot-cell ${heatmapClass}`;
                if (viewMode === 'edit' && isMineSelected) {
                  cellClass += ' slot-selected-mine';
                }

                return (
                  <div
                    key={slotKey}
                    data-slot-key={slotKey}
                    className={cellClass}
                    onMouseDown={(e) => handleCellMouseDown(slotKey, e)}
                    onMouseEnter={(e) => handleMouseEnterCell(slotKey, date, time, e)}
                    onClick={(e) => handleCellClick(slotKey, date, time, e)}
                  >
                    {isMobile ? (
                      viewMode === 'edit' ? (
                        <div className="mobile-slot-edit-content">
                          {isMineSelected ? (
                            <Check size={14} strokeWidth={3} />
                          ) : null}
                        </div>
                      ) : (
                        <div className="mobile-slot-heatmap-content">
                          <div className="mobile-heatmap-left">
                            <span className="mobile-heatmap-badge">
                              <Users size={12} />
                              <span>{available.length}/{totalParticipants}</span>
                            </span>
                            <span className="mobile-heatmap-status">
                              {available.length === 0
                                ? 'Nikt wolny'
                                : available.length === totalParticipants
                                  ? 'Wszyscy wolni'
                                  : ``}
                            </span>
                          </div>
                          {totalParticipants > 0 && available.length > 0 && (
                            <span className="mobile-heatmap-pct">
                              {Math.round((available.length / totalParticipants) * 100)}%
                            </span>
                          )}
                        </div>
                      )
                    ) : (
                      <>
                        {viewMode === 'edit' ? (
                          isMineSelected ? (
                            <Check size={13} strokeWidth={3} />
                          ) : null
                        ) : available.length > 0 ? (
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              color:
                                available.length === totalParticipants ? '#ffffff' : '#1e293b'
                            }}
                          >
                            {available.length}
                          </span>
                        ) : null}
                      </>
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
          className={`slot-hover-tooltip ${isMobile ? 'mobile-tooltip' : `placement-${hoverInfo.placement || 'top'}`
            }`}
          style={
            isMobile
              ? undefined
              : {
                left: `${hoverInfo.x}px`,
                top: `${hoverInfo.y}px`
              }
          }
        >
          <div className="tooltip-header-row">
            <div className="tooltip-time">
              {hoverInfo.date} • {hoverInfo.time}
            </div>
            {isMobile && (
              <button
                type="button"
                className="tooltip-close-btn"
                onClick={() => setHoverInfo(null)}
                aria-label="Zamknij"
              >
                <X size={14} />
              </button>
            )}
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

