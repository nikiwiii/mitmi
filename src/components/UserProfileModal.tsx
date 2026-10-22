import React, { useState } from 'react';
import { X, User } from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  currentAvatar: string;
  onSaveProfile: (name: string, avatar: string) => void;
}

const AVATAR_OPTIONS = ['👑', '⚡', '🚀', '🎨', '💻', '🧠', '🎯', '🌟', '🦄', '🔥'];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentName,
  currentAvatar,
  onSaveProfile
}) => {
  const [name, setName] = useState(currentName);
  const [avatar, setAvatar] = useState(currentAvatar || '👑');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSaveProfile(name.trim(), avatar);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={18} color="#10b981" />
            <h3 className="modal-title">Twój profil w mit.mi</h3>
          </div>
          <button
            type="button"
            className="btn-icon-tiny"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Twoje imię lub nick</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="np. Tymek, Aisha, Ola..."
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Wybierz swój awatar</label>
            <div className="avatar-picker-row">
              {AVATAR_OPTIONS.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  className={`avatar-choice-btn ${avatar === emoji ? 'selected' : ''}`}
                  onClick={() => setAvatar(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              className="action-btn-secondary"
              onClick={onClose}
            >
              Anuluj
            </button>
            <button
              type="submit"
              className="action-btn-primary"
            >
              Zapisz profil
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
