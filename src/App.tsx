import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header.js';
import { OverviewCard } from './components/OverviewCard.js';
import { StatCards } from './components/StatCards.js';
import { AvailabilityGrid } from './components/AvailabilityGrid.js';
import { BestSlotsCard } from './components/BestSlotsCard.js';
import { CreateMeetingModal } from './components/CreateMeetingModal.js';
import { UserProfileModal } from './components/UserProfileModal.js';
import { AuthScreen } from './components/AuthScreen.js';
import { MeetingsPanel } from './components/MeetingsPanel.js';
import { MeetingDetails, MeetingSummary, Tab, User } from './types.js';
import {
  fetchMeeting,
  fetchMyMeetings,
  fetchCurrentUser,
  saveUserAvailability,
  removeUserAvailability,
  createNewMeeting,
  deleteMeetingById,
  leaveMeetingById,
  updateAvatar,
  getToken,
  setToken,
  setUnauthorizedHandler
} from './api.js';
import { Check } from 'lucide-react';

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState<boolean>(() => !getToken());

  const [meetingId, setMeetingId] = useState<string>(() => {
    const hash = window.location.hash.replace('#', '').trim();
    return hash || 'bit-web-2026';
  });

  const [details, setDetails] = useState<MeetingDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [myMeetings, setMyMeetings] = useState<MeetingSummary[]>([]);
  const [meetingsLoading, setMeetingsLoading] = useState(false);

  const [mySlots, setMySlots] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('grid');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setDetails(null);
    setMyMeetings([]);
    setMySlots([]);
    setActiveTab('grid');
  }, []);

  // przywrocenie sesji po odswiezeniu strony
  useEffect(() => {
    setUnauthorizedHandler(logout);
    if (!getToken()) return;
    fetchCurrentUser()
      .then(setUser)
      .catch(() => setToken(null))
      .finally(() => setAuthChecked(true));
  }, [logout]);

  const loadMyMeetings = useCallback(async () => {
    setMeetingsLoading(true);
    try {
      setMyMeetings(await fetchMyMeetings());
    } catch {
      // lista zostaje pusta
    } finally {
      setMeetingsLoading(false);
    }
  }, []);

  // ladowanie danych spotkania, otwarcie dodaje uzytkownika do czlonkow
  const loadMeetingData = async (id: string) => {
    if (!id) {
      setDetails(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMeeting(id);
      setDetails(data);
      loadMyMeetings();
    } catch (err: any) {
      setDetails(null);
      setError(err?.message || 'blad wczytywania spotkania');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    loadMeetingData(meetingId);
  }, [meetingId, user?.id]);

  useEffect(() => {
    const handleHashChange = () => {
      setMeetingId(window.location.hash.replace('#', '').trim());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (user && activeTab === 'meetings') loadMyMeetings();
  }, [user?.id, activeTab, loadMyMeetings]);

  // slot'y zalogowanego uzytkownika z danych spotkania
  useEffect(() => {
    if (!details || !user) {
      setMySlots([]);
      return;
    }
    const found = details.participants.find(
      p => p.userName.toLowerCase() === user.username.toLowerCase()
    );
    setMySlots(found ? found.slots : []);
  }, [user?.username, details]);

  // obliczanie najlepszego slotu o najwyzszej frekwencji
  const bestSlot = useMemo(() => {
    if (!details || details.participants.length === 0) return null;
    const map = new Map<string, number>();
    details.participants.forEach(p => {
      p.slots.forEach(slot => {
        map.set(slot, (map.get(slot) || 0) + 1);
      });
    });

    let maxSlot = '';
    let maxCount = -1;
    for (const [slot, count] of map.entries()) {
      if (count > maxCount) {
        maxCount = count;
        maxSlot = slot;
      }
    }

    if (!maxSlot || maxCount <= 0) return null;
    const [date, time] = maxSlot.split('T');
    return { date, time, count: maxCount };
  }, [details]);

  const handleAuthenticated = (token: string, authedUser: User) => {
    setToken(token);
    setUser(authedUser);
    setAuthChecked(true);
    showToast(`Zalogowano jako ${authedUser.username}`);
  };

  const handleSaveMySlots = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const updated = await saveUserAvailability(meetingId, mySlots);

      // aktualizacja stanu lokalnego
      if (details) {
        const others = details.participants.filter(
          p => p.userName.toLowerCase() !== user.username.toLowerCase()
        );
        setDetails({
          ...details,
          participants: [updated, ...others]
        });
      }
      showToast('Zapisano Twoją dostępność!');
    } catch {
      showToast('Błąd zapisu dostępności.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearMySlots = () => {
    setMySlots([]);
    showToast('Wyczyszczono Twoje zaznaczone godziny.');
  };

  const handleRemoveMyAvailability = async () => {
    if (!user) return;
    try {
      await removeUserAvailability(meetingId);
      if (details) {
        setDetails({
          ...details,
          participants: details.participants.filter(
            p => p.userName.toLowerCase() !== user.username.toLowerCase()
          )
        });
      }
      setMySlots([]);
      showToast('Usunięto Twoje zgłoszenie.');
    } catch {
      showToast('Błąd usuwania zgłoszenia.');
    }
  };

  const handleSaveProfile = async (avatar: string) => {
    try {
      const updated = await updateAvatar(avatar);
      setUser(updated);
      if (details) {
        setDetails({
          ...details,
          participants: details.participants.map(p =>
            p.userName.toLowerCase() === updated.username.toLowerCase()
              ? { ...p, userAvatar: avatar }
              : p
          )
        });
      }
      showToast('Ikona profilu zaktualizowana');
    } catch {
      showToast('Błąd zapisu profilu.');
    }
  };

  const openMeeting = (id: string) => {
    window.location.hash = id;
    setMeetingId(id);
    setActiveTab('grid');
  };

  const handleCreateMeeting = async (data: {
    title: string;
    description: string;
    dates: string[];
    startHour: number;
    endHour: number;
  }) => {
    try {
      const created = await createNewMeeting(data);
      openMeeting(created.id);
      showToast(`Utworzono spotkanie: ${created.title}`);
    } catch {
      showToast('Błąd tworzenia spotkania.');
    }
  };

  // po usunieciu lub opuszczeniu otwartego spotkania wracamy do listy
  const afterMeetingRemoved = (id: string) => {
    if (id === meetingId) {
      window.location.hash = '';
      setMeetingId('');
      setDetails(null);
    }
    loadMyMeetings();
  };

  const handleDeleteMeeting = async (meeting: MeetingSummary) => {
    if (!window.confirm(`usunac spotkanie "${meeting.title}" dla wszystkich uczestnikow?`)) return;
    try {
      await deleteMeetingById(meeting.id);
      afterMeetingRemoved(meeting.id);
      showToast(`Usunięto spotkanie: ${meeting.title}`);
    } catch (err: any) {
      showToast(err?.message || 'Błąd usuwania spotkania.');
    }
  };

  const handleLeaveMeeting = async (meeting: MeetingSummary) => {
    if (!window.confirm(`opuscic spotkanie "${meeting.title}"?`)) return;
    try {
      await leaveMeetingById(meeting.id);
      afterMeetingRemoved(meeting.id);
      showToast(`Opuszczono spotkanie: ${meeting.title}`);
    } catch (err: any) {
      showToast(err?.message || 'Błąd opuszczania spotkania.');
    }
  };

  const handleShareLink = () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        showToast('Skopiowano unikalny link do schowka!');
      });
    } else {
      showToast(`Link do spotkania: ${url}`);
    }
  };

  if (!authChecked) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', color: '#475569' }}>
        <span>Wczytywanie mit.mi...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <AuthScreen onAuthenticated={handleAuthenticated} />
        {toastMessage && (
          <div className="toast-notification">
            <Check size={16} color="#2f9e57" />
            <span>{toastMessage}</span>
          </div>
        )}
      </>
    );
  }

  const renderBody = () => {
    if (activeTab === 'meetings') {
      return (
        <MeetingsPanel
          meetings={myMeetings}
          loading={meetingsLoading}
          currentMeetingId={meetingId}
          onOpen={openMeeting}
          onDelete={handleDeleteMeeting}
          onLeave={handleLeaveMeeting}
          onCreate={() => setIsCreateModalOpen(true)}
        />
      );
    }

    if (loading && !details) {
      return <p className="side-card-desc">Wczytywanie spotkania mit.mi...</p>;
    }

    if (error || !details) {
      return (
        <section className="grid-section-card" style={{ alignItems: 'flex-start' }}>
          <h3 className="side-card-title">Nie znaleziono spotkania</h3>
          <p className="side-card-desc">
            {error || 'Nie wybrano spotkania. Otwórz jedno z listy lub utwórz nowe.'}
          </p>
          <button type="button" className="action-btn-primary" onClick={() => setActiveTab('meetings')}>
            Moje spotkania
          </button>
        </section>
      );
    }

    return (
      <main className="dashboard-main">
        <div className={`top-row ${activeTab === 'recommendations' ? 'top-row-single' : ''}`}>
          <OverviewCard
            participants={details.participants}
            currentUserName={user.username}
            onRemoveUser={handleRemoveMyAvailability}
          />

          {(activeTab === 'grid' || activeTab === 'participants') && (
            <AvailabilityGrid
              meeting={details.meeting}
              participants={details.participants}
              currentUserName={user.username}
              mySlots={mySlots}
              setMySlots={setMySlots}
              onSaveMySlots={handleSaveMySlots}
              onClearMySlots={handleClearMySlots}
              isSaving={isSaving}
            />
          )}
        </div>

        <StatCards
          participants={details.participants}
          bestSlot={bestSlot}
        />

        {(activeTab === 'grid' || activeTab === 'recommendations') && (
          <BestSlotsCard
            participants={details.participants}
            bestSlot={bestSlot}
          />
        )}
      </main>
    );
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      <Header
        meeting={details?.meeting ?? null}
        currentUserName={user.username}
        currentUserAvatar={user.avatar}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onOpenUserModal={() => setIsUserModalOpen(true)}
        onShareLink={handleShareLink}
      >
        {renderBody()}
      </Header>

      <CreateMeetingModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateMeeting}
      />

      <UserProfileModal
        key={`${user.id}-${user.avatar}`}
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        currentName={user.username}
        currentAvatar={user.avatar}
        onSaveProfile={handleSaveProfile}
        onLogout={logout}
      />

      {toastMessage && (
        <div className="toast-notification">
          <Check size={16} color="#2f9e57" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
