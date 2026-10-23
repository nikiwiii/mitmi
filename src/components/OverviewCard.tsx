import React from 'react';
import { Check, Trash2, Users } from 'lucide-react';
import { UserAvailability } from '../types.js';
import { UserIcon } from './UserIcon.js';

interface OverviewCardProps {
  participants: UserAvailability[];
  currentUserName: string;
  onRemoveUser: (name: string) => void;
}

export const OverviewCard: React.FC<OverviewCardProps> = ({
  participants,
  currentUserName,
  onRemoveUser
}) => {
  const totalParticipants = participants.length;
  const isCurrentSubmitted = participants.some(
    p => p.userName.toLowerCase() === currentUserName.toLowerCase()
  );

  const getParticipantsLabel = (n: number) => {
    if (n === 1) return 'uczestnik';
    const last = n % 10;
    const lastTwo = n % 100;
    if (last >= 2 && last <= 4 && (lastTwo < 10 || lastTwo >= 20)) {
      return 'uczestników';
    }
    return 'uczestników';
  };

  return (
    <aside className="side-card">
      <div>
        <h3 className="side-card-title">Status zespołu</h3>
        <p className="side-card-desc">
          Zadeklarowana dostępność uczestników tego spotkania.
        </p>
      </div>

      <div className="overview-stats-banner">
        <div className="overview-stat-pill">
          <Users size={15} className="overview-stat-icon" />
          <span className="overview-stat-val">{totalParticipants}</span>
          <span className="overview-stat-lbl">{getParticipantsLabel(totalParticipants)}</span>
        </div>

        <div className={`overview-user-status-pill ${isCurrentSubmitted ? 'submitted' : 'pending'}`}>
          {isCurrentSubmitted ? (
            <>
              <Check size={12} strokeWidth={3} />
              <span>Twój głos oddany</span>
            </>
          ) : (
            <span>Oczekiwanie na Twój głos</span>
          )}
        </div>
      </div>

      <div className="checklist-group">
        {participants.map((p) => {
          const isCurrent = p.userName.toLowerCase() === currentUserName.toLowerCase();
          return (
            <div
              key={p.userName}
              className={`checklist-item ${isCurrent ? 'current-user' : ''}`}
            >
              <div className="checklist-icon-done">
                <Check size={12} strokeWidth={3} />
              </div>
              <div className="checklist-meta">
                <div className="checklist-name">
                  <UserIcon name={p.userAvatar} size={14} />
                  <span>{p.userName}</span>
                  {isCurrent && (
                    <span style={{ fontSize: '0.7rem', color: '#2f9e57', fontWeight: 600 }}>
                      (Ty)
                    </span>
                  )}
                </div>
                <span className="checklist-slots-count">
                  {p.slots.length} zadeklarowanych slotów
                </span>
              </div>
              {isCurrent && (
                <div className="participant-actions">
                  <button
                    type="button"
                    className="btn-icon-tiny"
                    onClick={() => {
                      if (window.confirm('usunac Twoja dostepnosc w tym spotkaniu?')) {
                        onRemoveUser(p.userName);
                      }
                    }}
                    title="usun swoje zgloszenie"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {participants.length === 0 && (
          <span className="checklist-slots-count" style={{ padding: '8px' }}>
            Nikt jeszcze nie zapisał dostępności.
          </span>
        )}
      </div>
    </aside>
  );
};
