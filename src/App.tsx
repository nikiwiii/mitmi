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
import { MitmiLogo } from './components/MitmiLogo.js';
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

  // obliczanie najlepszego slotu o najwyzszej frekwencji i ciaglosci czasowej
  const bestSlot = useMemo(() => {
    if (!details || details.participants.length === 0) return null;
    const map = new Map<string, number>();
    details.participants.forEach(p => {
      p.slots.forEach(slot => {
        map.set(slot, (map.get(slot) || 0) + 1);
      });
    });

    if (map.size === 0) return null;

    // Funkcja wyznaczajaca nastepny slot o 30 minut
    const getNextSlotKey = (date: string, time: string): string => {
      const [h, m] = time.split(':').map(Number);
      let nextM = m + 30;
      let nextH = h;
      if (nextM >= 60) {
        nextM = 0;
        nextH += 1;
      }
      return `${date}T${nextH.toString().padStart(2, '0')}:${nextM.toString().padStart(2, '0')}`;
    };

    // Dlugosc ciaglego bloku o co najmniej tej samej frekwencji
    const getBlockLength = (date: string, time: string, minCount: number): number => {
      let len = 1;
      let currTime = time;
      while (true) {
        const nextKey = getNextSlotKey(date, currTime);
        const nextCount = map.get(nextKey) || 0;
        if (nextCount >= minCount && minCount > 0) {
          len++;
          currTime = nextKey.split('T')[1];
        } else {
          break;
        }
      }
      return len;
    };

    const sortedSlots = Array.from(map.entries())
      .filter(([_, count]) => count > 0)
      .map(([slot, count]) => {
        const [date, time] = slot.split('T');
        return {
          slot,
          date,
          time,
          count,
          blockLength: getBlockLength(date, time, count)
        };
      })
      .sort((a, b) => {
        // 1. Najwyzsza frekwencja
        if (b.count !== a.count) return b.count - a.count;
        // 2. Dluzszy ciagly blok spotkania (np. 4 kolejne sloty wygrywaja z 1 pojedynczym slotem)
        if (b.blockLength !== a.blockLength) return b.blockLength - a.blockLength;
        // 3. Wczesniejsza data
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        // 4. Wczesniejsza godzina
        return a.time.localeCompare(b.time);
      });

    if (sortedSlots.length === 0) return null;
    const top = sortedSlots[0];
    return { date: top.date, time: top.time, count: top.count };
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
    const created = await createNewMeeting(data);
    openMeeting(created.id);
    showToast(`Utworzono spotkanie: ${created.title}`);
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, justifyContent: 'center', alignItems: 'center', minHeight: '80vh', color: '#475569' }}>
        <MitmiLogo size={48} />
        <span style={{ fontWeight: 600, fontSize: '1rem', letterSpacing: '-0.01em' }}>Wczytywanie mit.mi...</span>
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
        {activeTab === 'grid' && (
          <div className="top-row">
            <OverviewCard
              participants={details.participants}
              currentUserName={user.username}
              onRemoveUser={handleRemoveMyAvailability}
            />

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
          </div>
        )}

        <StatCards
          meeting={details.meeting}
          participants={details.participants}
          bestSlot={bestSlot}
          currentUserName={user?.username}
        />

        <BestSlotsCard
          meeting={details.meeting}
          participants={details.participants}
          bestSlot={bestSlot}
        />
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
        showButtons={activeTab !== 'meetings'}
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
