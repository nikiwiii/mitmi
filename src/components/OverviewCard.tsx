import React from 'react';
import { Check, Clock, Trash2, UserPlus, Sparkles } from 'lucide-react';
import { UserAvailability } from '../types.js';

interface OverviewCardProps {
  participants: UserAvailability[];
  currentUserName: string;
  onSelectUser: (name: string) => void;
  onRemoveUser: (name: string) => void;
  onOpenUserModal: () => void;
}

export const OverviewCard: React.FC<OverviewCardProps> = ({
  participants,
  currentUserName,
  onSelectUser,
  onRemoveUser,
  onOpenUserModal
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
              <div
                className="checklist-meta"
                style={{ cursor: 'pointer' }}
                onClick={() => onSelectUser(p.userName)}
                title="przelacz sie na tego uzytkownika"
              >
                <div className="checklist-name">
                  <span>{p.userAvatar || '👤'}</span>
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
              <div className="participant-actions">
                <button
                  type="button"
                  className="btn-icon-tiny"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`usunac dostepnosc dla: ${p.userName}?`)) {
                      onRemoveUser(p.userName);
                    }
                  }}
                  title="usun zgloszenie"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          );
        })}

        <div
          className="checklist-item"
          style={{ borderStyle: 'dashed', cursor: 'pointer' }}
          onClick={onOpenUserModal}
        >
          <div className="checklist-icon-empty">
            <UserPlus size={11} color="#64748b" />
          </div>
          <div className="checklist-meta">
            <span className="checklist-name" style={{ color: '#475569' }}>
              Dołącz lub zmień imię
            </span>
            <span className="checklist-slots-count">Wpisz swój nick i zaznacz godziny</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
