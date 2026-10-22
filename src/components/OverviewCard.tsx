import React from 'react';
import { Check, Trash2 } from 'lucide-react';
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
  const targetCount = Math.max(5, participants.length);
  const percentage = Math.round((participants.length / targetCount) * 100);

  return (
    <aside className="side-card">
      <div>
        <h3 className="side-card-title">Status zespołu</h3>
        <p className="side-card-desc">
          Monitorowanie zadeklarowanej dostępności członków projektu koła BIT Web.
        </p>
      </div>

      <div className="progress-header" title="Postęp odpowiedzi">
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${percentage}%` }} />
        </div>
        <span>{percentage}%</span>
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
