import React from 'react';
import { Calendar, Plus, Share2, Sparkles, Database, LayoutGrid, Star, Users } from 'lucide-react';
import { Meeting } from '../types.js';

type Tab = 'grid' | 'recommendations' | 'participants';

interface HeaderProps {
  meeting: Meeting;
  currentUserName: string;
  currentUserAvatar: string;
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  onOpenCreateModal: () => void;
  onOpenUserModal: () => void;
  onShareLink: () => void;
  dbStatus: string;
  children?: React.ReactNode;
}

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'grid', label: 'Siatka spotkania', icon: <LayoutGrid size={16} /> },
  { id: 'recommendations', label: 'Rekomendacje', icon: <Star size={16} /> },
  { id: 'participants', label: 'Uczestnicy', icon: <Users size={16} /> }
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
  dbStatus,
  children
}) => {
  return (
    <>

      <div className="dashboard-container">
        <header className="dashboard-header">
          <div className="brand-section">
            <div className="brand-logo-icon">
              <Calendar size={20} />
            </div>
            <div className="brand-title">mit<span>.mi</span></div>
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
        </header>

        <section className="welcome-row">
          <div className="welcome-hero">
            <h1>Welcome Back, {currentUserName}</h1>
            <p>
              {meeting.title} — {meeting.description || 'Wybierz godziny i znajdź wspólny termin z zespołem.'}
            </p>
          </div>

          <div className="header-actions">
            <button type="button" className="action-btn-primary" onClick={onOpenCreateModal}>
              <Plus size={15} />
              <span>Nowe spotkanie</span>
            </button>

            <button type="button" className="action-btn-secondary" onClick={onShareLink}>
              <Share2 size={14} />
              <span>Udostępnij</span>
            </button>

            <div
              className="user-profile-pill"
              onClick={onOpenUserModal}
              title="zmien swoj profil lub imie"
            >
              <div className="user-avatar-circle">{currentUserAvatar}</div>
              <span>{currentUserName}</span>
            </div>
          </div>
        </section>

        {children}
      </div>
    </>
  );
};
