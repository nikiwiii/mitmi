import React, { useState } from 'react';
import { X, User, LogOut } from 'lucide-react';
import { IconPicker } from './UserIcon.js';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  currentAvatar: string;
  onSaveProfile: (avatar: string) => void;
  onLogout: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentName,
  currentAvatar,
  onSaveProfile,
  onLogout
}) => {
  const [avatar, setAvatar] = useState(currentAvatar || 'Crown');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(avatar);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={18} color="#2f9e57" />
            <h3 className="modal-title">Konto: {currentName}</h3>
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
            <label className="form-label">Ikona profilu</label>
            <IconPicker value={avatar} onChange={setAvatar} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              className="action-btn-secondary"
              onClick={() => {
                onClose();
                onLogout();
              }}
            >
              <LogOut size={14} />
              Wyloguj
            </button>
            <div style={{ display: 'flex', gap: '10px' }}>
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
                Zapisz
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
