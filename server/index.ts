import express from 'express';
import cors from 'cors';
import {
  initDb, getMeeting, createMeeting, deleteMeeting, setAvailability, deleteAvailability,
  isPostgresActive, createUser, findUserByName, updateUserAvatar, addMember, removeMember,
  listMeetingsForUser, toPublicUser, Meeting
} from './db.js';
import { hashPassword, verifyPassword, createToken, requireAuth, AuthedRequest } from './auth.js';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,24}$/;

// status polaczenia z baza
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: isPostgresActive() ? 'postgresql' : 'memory-fallback'
  });
});

// rejestracja konta
app.post('/api/auth/register', async (req, res) => {
  try {
    const username = String(req.body.username || '').trim();
    const password = String(req.body.password || '');
    const avatar = String(req.body.avatar || 'User');
    if (!USERNAME_RE.test(username)) {
      return res.status(400).json({ error: 'nazwa: 3-24 znaki (litery, cyfry, _ . -)' });
    }
    if (password.length < 8 || password.length > 128) {
      return res.status(400).json({ error: 'haslo musi miec co najmniej 8 znakow' });
    }
    const user = await createUser(username, hashPassword(password), avatar);
    if (!user) {
      return res.status(409).json({ error: 'ta nazwa jest juz zajeta' });
    }
    res.status(201).json({ token: createToken(user.id), user: toPublicUser(user) });
  } catch {
    res.status(500).json({ error: 'blad rejestracji' });
  }
});

// logowanie
app.post('/api/auth/login', async (req, res) => {
  try {
    const username = String(req.body.username || '').trim();
    const password = String(req.body.password || '');
    const user = await findUserByName(username);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ error: 'nieprawidlowa nazwa lub haslo' });
    }
    res.json({ token: createToken(user.id), user: toPublicUser(user) });
  } catch {
    res.status(500).json({ error: 'blad logowania' });
  }
});

app.get('/api/auth/me', requireAuth, (req: AuthedRequest, res) => {
  res.json({ user: req.user });
});

// zmiana ikony profilu
app.patch('/api/auth/me', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const avatar = String(req.body.avatar || '').trim();
    if (!avatar || avatar.length > 32) {
      return res.status(400).json({ error: 'nieprawidlowa ikona' });
    }
    const user = await updateUserAvatar(req.user!.id, avatar);
    res.json({ user });
  } catch {
    res.status(500).json({ error: 'blad zapisu profilu' });
  }
});

// lista spotkan uzytkownika
app.get('/api/meetings', requireAuth, async (req: AuthedRequest, res) => {
  try {
    res.json(await listMeetingsForUser(req.user!.id));
  } catch {
    res.status(500).json({ error: 'blad serwera' });
  }
});

// pobieranie spotkania z uczestnikami, otwarcie linku dodaje do czlonkow
app.get('/api/meetings/:id', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const data = await getMeeting(req.params.id as string);
    if (!data) {
      return res.status(404).json({ error: 'spotkanie nie istnieje' });
    }
    await addMember(data.meeting.id, req.user!.id);
    res.json(data);
  } catch {
    res.status(500).json({ error: 'blad serwera' });
  }
});

// tworzenie nowego spotkania
app.post('/api/meetings', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const { title, description, dates, startHour, endHour } = req.body;
    if (!title || !dates || !dates.length) {
      return res.status(400).json({ error: 'brak tytulu lub dat' });
    }

    const id = (req.body.id || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30) + '-' + Math.random().toString(36).substring(2, 6));

    const newMeeting: Meeting = {
      id,
      title: title.trim(),
      description: (description || '').trim(),
      dates,
      startHour: Number(startHour) || 9,
      endHour: Number(endHour) || 18,
      createdAt: new Date().toISOString(),
      ownerId: req.user!.id
    };

    const saved = await createMeeting(newMeeting);
    res.status(201).json(saved);
  } catch {
    res.status(500).json({ error: 'blad tworzenia spotkania' });
  }
});

// usuniecie spotkania, tylko przez tworce
app.delete('/api/meetings/:id', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const data = await getMeeting(req.params.id as string);
    if (!data) {
      return res.status(404).json({ error: 'spotkanie nie istnieje' });
    }
    if (!data.meeting.ownerId || data.meeting.ownerId !== req.user!.id) {
      return res.status(403).json({ error: 'tylko tworca moze usunac spotkanie' });
    }
    await deleteMeeting(data.meeting.id);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'blad usuwania spotkania' });
  }
});

// opuszczenie spotkania przez uczestnika
app.post('/api/meetings/:id/leave', requireAuth, async (req: AuthedRequest, res) => {
  try {
    await removeMember(req.params.id as string, req.user!.id, req.user!.username);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'blad opuszczania spotkania' });
  }
});

// zapisywanie lub aktualizacja dostepnosci zalogowanego uzytkownika
app.post('/api/meetings/:id/availability', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const meetingId = req.params.id as string;
    if (!(await getMeeting(meetingId))) {
      return res.status(404).json({ error: 'spotkanie nie istnieje' });
    }
    const { slots } = req.body;
    const updated = await setAvailability(
      meetingId,
      req.user!.username,
      req.user!.avatar,
      Array.isArray(slots) ? slots : []
    );
    await addMember(meetingId, req.user!.id);
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'blad zapisu dostepnosci' });
  }
});

// usuniecie wlasnej dostepnosci
app.delete('/api/meetings/:id/availability', requireAuth, async (req: AuthedRequest, res) => {
  try {
    await deleteAvailability(req.params.id as string, req.user!.username);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'blad usuwania dostepnosci' });
  }
});

// start serwera i proba polaczenia z baza
initDb().then(() => {
  app.listen(port, () => {
    console.log(`[mit.mi] api dziala na porcie ${port}`);
  });
});
