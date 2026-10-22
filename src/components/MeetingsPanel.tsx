import React from 'react';
import { CalendarDays, Crown, ExternalLink, LogOut, Trash2, Users } from 'lucide-react';
import { MeetingSummary } from '../types.js';

interface MeetingsPanelProps {
  meetings: MeetingSummary[];
  loading: boolean;
  currentMeetingId: string;
  onOpen: (id: string) => void;
  onDelete: (meeting: MeetingSummary) => void;
  onLeave: (meeting: MeetingSummary) => void;
  onCreate: () => void;
}

export const MeetingsPanel: React.FC<MeetingsPanelProps> = ({
  meetings,
  loading,
  currentMeetingId,
  onOpen,
  onDelete,
  onLeave,
  onCreate
}) => {
  return (
    <section className="grid-section-card">
      <div className="grid-section-header">
        <div>
          <h3 className="side-card-title">Moje spotkania</h3>
          <p className="side-card-desc">Wszystkie spotkania, w których bierzesz udział.</p>
        </div>
        <button type="button" className="btn-pill-small" onClick={onCreate}>
          <CalendarDays size={12} />
          Nowe spotkanie
        </button>
      </div>

      {loading && meetings.length === 0 ? (
        <p className="side-card-desc">Wczytywanie...</p>
      ) : meetings.length === 0 ? (
        <p className="side-card-desc">Nie należysz jeszcze do żadnego spotkania.</p>
      ) : (
        <div className="meetings-list">
          {meetings.map(m => (
            <article
              key={m.id}
              className={`meeting-row ${m.id === currentMeetingId ? 'current' : ''}`}
            >
              <div className="meeting-row-main">
                <div className="meeting-row-title">
                  <span>{m.title}</span>
                  {m.isOwner && (
                    <span className="metric-tag" title="jestes tworca tego spotkania">
                      <Crown size={11} /> twórca
                    </span>
                  )}
                </div>
                <div className="meeting-row-meta">
                  <span><CalendarDays size={12} /> {m.dates.length} dni</span>
                  <span><Users size={12} /> {m.participantCount} odpowiedzi</span>
                </div>
              </div>

              <div className="meeting-row-actions">
                <button type="button" className="btn-pill-small" onClick={() => onOpen(m.id)}>
                  <ExternalLink size={12} />
                  Otwórz
                </button>
                {m.isOwner ? (
                  <button
                    type="button"
                    className="btn-pill-small danger"
                    onClick={() => onDelete(m)}
                    title="usun spotkanie dla wszystkich"
                  >
                    <Trash2 size={12} />
                    Usuń
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn-pill-small"
                    onClick={() => onLeave(m)}
                    title="opusc spotkanie"
                  >
                    <LogOut size={12} />
                    Opuść
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
