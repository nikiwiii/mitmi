import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header.js';
import { OverviewCard } from './components/OverviewCard.js';
import { StatCards } from './components/StatCards.js';
import { AvailabilityGrid } from './components/AvailabilityGrid.js';
import { BestSlotsCard } from './components/BestSlotsCard.js';
import { CreateMeetingModal } from './components/CreateMeetingModal.js';
import { UserProfileModal } from './components/UserProfileModal.js';
import { MeetingDetails, Meeting, UserAvailability } from './types.js';
import {
  fetchMeeting,
  saveUserAvailability,
  removeUserAvailability,
  createNewMeeting,
  fetchHealth
} from './api.js';
import { Check } from 'lucide-react';

export const App: React.FC = () => {
  const [meetingId, setMeetingId] = useState<string>(() => {
    const hash = window.location.hash.replace('#', '').trim();
    return hash || 'bit-web-2026';
  });

  const [details, setDetails] = useState<MeetingDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [currentUserName, setCurrentUserName] = useState<string>(() => {
    return localStorage.getItem('mitmi_user_name') || 'Aisha';
  });
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string>(() => {
    return localStorage.getItem('mitmi_user_avatar') || '👑';
  });

  const [mySlots, setMySlots] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'grid' | 'recommendations' | 'participants'>('grid');
  const [dbStatus, setDbStatus] = useState<string>('checking');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // ladowanie danych spotkania
  const loadMeetingData = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMeeting(id);
      setDetails(data);

      // synchronizacja slotow aktualnego uzytkownika
      const found = data.participants.find(
        p => p.userName.toLowerCase() === currentUserName.toLowerCase()
      );
      if (found) {
        setMySlots(found.slots);
      } else {
        setMySlots([]);
      }
    } catch (err: any) {
      setError(err?.message || 'blad wczytywania spotkania');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeetingData(meetingId);
    fetchHealth().then(h => setDbStatus(h.database));

    const handleHashChange = () => {
      const newId = window.location.hash.replace('#', '').trim() || 'bit-web-2026';
      setMeetingId(newId);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [meetingId]);

  // aktualizacja slotow gdy zmienia sie uzytkownik
  useEffect(() => {
    if (!details) return;
    const found = details.participants.find(
      p => p.userName.toLowerCase() === currentUserName.toLowerCase()
    );
    if (found) {
      setMySlots(found.slots);
      if (found.userAvatar) setCurrentUserAvatar(found.userAvatar);
    } else {
      setMySlots([]);
    }
  }, [currentUserName, details]);

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

  const handleSaveMySlots = async () => {
    if (!currentUserName.trim()) {
      setIsUserModalOpen(true);
      return;
    }
    setIsSaving(true);
    try {
      const updated = await saveUserAvailability(
        meetingId,
        currentUserName.trim(),
        currentUserAvatar,
        mySlots
      );

      // aktualizacja stanu lokalnego
      if (details) {
        const others = details.participants.filter(
          p => p.userName.toLowerCase() !== currentUserName.toLowerCase()
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

  const handleRemoveUser = async (name: string) => {
    try {
      await removeUserAvailability(meetingId, name);
      if (details) {
        setDetails({
          ...details,
          participants: details.participants.filter(
            p => p.userName.toLowerCase() !== name.toLowerCase()
          )
        });
      }
      if (name.toLowerCase() === currentUserName.toLowerCase()) {
        setMySlots([]);
      }
      showToast(`Usunięto zgłoszenie: ${name}`);
    } catch {
      showToast('Błąd usuwania zgłoszenia.');
    }
  };

  const handleSaveProfile = (name: string, avatar: string) => {
    setCurrentUserName(name);
    setCurrentUserAvatar(avatar);
    localStorage.setItem('mitmi_user_name', name);
    localStorage.setItem('mitmi_user_avatar', avatar);
    showToast(`Profil zaktualizowany: ${name}`);
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
      window.location.hash = created.id;
      setMeetingId(created.id);
      showToast(`Utworzono spotkanie: ${created.title}`);
    } catch {
      showToast('Błąd tworzenia spotkania.');
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

  if (loading && !details) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', color: '#475569' }}>
        <span>Wczytywanie spotkania mit.mi...</span>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="dashboard-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h2>Nie znaleziono spotkania</h2>
        <p style={{ margin: '12px 0 24px 0', color: '#64748b' }}>
          {error || 'Podany identyfikator spotkania nie istnieje.'}
        </p>
        <button
          type="button"
          className="action-btn-primary"
          style={{ margin: '0 auto' }}
          onClick={() => {
            window.location.hash = 'bit-web-2026';
            setMeetingId('bit-web-2026');
          }}
        >
          Powrót do głównego spotkania koła
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <Header
        meeting={details.meeting}
        currentUserName={currentUserName}
        currentUserAvatar={currentUserAvatar}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onOpenUserModal={() => setIsUserModalOpen(true)}
        onShareLink={handleShareLink}
        dbStatus={dbStatus}
      >
        <main className="dashboard-main">
          <div className={`top-row ${activeTab === 'recommendations' ? 'top-row-single' : ''}`}>
            <OverviewCard
              participants={details.participants}
              currentUserName={currentUserName}
              onSelectUser={(name) => {
                setCurrentUserName(name);
                showToast(`Przełączono profil na: ${name}`);
              }}
              onRemoveUser={handleRemoveUser}
              onOpenUserModal={() => setIsUserModalOpen(true)}
            />

            {(activeTab === 'grid' || activeTab === 'participants') && (
              <AvailabilityGrid
                meeting={details.meeting}
                participants={details.participants}
                currentUserName={currentUserName}
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
      </Header>

      <CreateMeetingModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateMeeting}
      />

      <UserProfileModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        currentName={currentUserName}
        currentAvatar={currentUserAvatar}
        onSaveProfile={handleSaveProfile}
      />

      {toastMessage && (
        <div className="toast-notification">
          <Check size={16} color="#10b981" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
