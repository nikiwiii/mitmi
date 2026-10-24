import React from 'react';
import { Plus, Share2, LayoutGrid, Star, FolderOpen } from 'lucide-react';
import { Meeting, Tab } from '../types.js';
import { UserIcon } from './UserIcon.js';
import { MitmiLogo } from './MitmiLogo.js';

interface HeaderProps {
  meeting: Meeting | null;
  currentUserName: string;
  currentUserAvatar: string;
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  onOpenCreateModal: () => void;
  onOpenUserModal: () => void;
  onShareLink: () => void;
  showButtons: boolean;
  children?: React.ReactNode;
}

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'grid', label: 'Spotkanie', icon: <LayoutGrid size={16} /> },
  { id: 'recommendations', label: 'Rekomendacje', icon: <Star size={16} /> },
  { id: 'meetings', label: 'Moje spotkania', icon: <FolderOpen size={16} /> }
];

export const Header: React.FC<HeaderProps> = ({
  meeting,
  currentUserName,
  currentUserAvatar,
  activeTab,
  setActiveTab,
  onOpenCreateModal,
  onOpenUserModal,
  onShareLink,
  showButtons,
  children
}) => {
  return (
    <>
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div className="brand-section">
            <MitmiLogo size={36} />
            <div className="brand-title">mit<span>.</span>mi</div>
          </div>

          <nav className="header-center-nav">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                title={tab.label}
                className={`nav-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon}
                {activeTab === tab.id && <span>{tab.label}</span>}
              </button>
            ))}
          </nav>

          <div
            className="user-profile-pill"
            onClick={onOpenUserModal}
            title="konto i ikona profilu"
          >
            <div className="user-avatar-circle"><UserIcon name={currentUserAvatar} size={15} /></div>
            <span>{currentUserName}</span>
          </div>
        </header>

        <section className="welcome-row">
          {showButtons && <div className="welcome-hero">
            <h1>{meeting ? meeting.title : 'Wybierz spotkanie'}</h1>
            <p>
              {meeting
                ? (meeting.description || 'Wybierz godziny i znajdź wspólny termin z zespołem.')
                : 'Wybierz spotkanie z listy lub utwórz nowe.'}
            </p>
          </div>}

          <div className="header-actions">
            <button type="button" className="action-btn-primary" onClick={onOpenCreateModal}>
              <Plus size={15} />
              <span>Nowe spotkanie</span>
            </button>

            {showButtons && <button type="button" className="action-btn-secondary" onClick={onShareLink}>
              <Share2 size={14} />
              <span>Kopiuj link</span>
            </button>}
          </div>
        </section>

        {children}
      </div>
    </>
  );
};
