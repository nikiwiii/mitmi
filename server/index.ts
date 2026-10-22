import express from 'express';
import cors from 'cors';
import { initDb, getMeeting, createMeeting, setAvailability, deleteAvailability, isPostgresActive, Meeting } from './db.js';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// status polaczenia z baza
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: isPostgresActive() ? 'postgresql' : 'memory-fallback'
  });
});

// pobieranie spotkania z uczestnikami
app.get('/api/meetings/:id', async (req, res) => {
  try {
    const data = await getMeeting(req.params.id);
    if (!data) {
      return res.status(404).json({ error: 'spotkanie nie istnieje' });
    }
    res.json(data);
  } catch {
    res.status(500).json({ error: 'blad serwera' });
  }
});

// tworzenie nowego spotkania
app.post('/api/meetings', async (req, res) => {
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
      createdAt: new Date().toISOString()
    };

    const saved = await createMeeting(newMeeting);
    res.status(201).json(saved);
  } catch {
    res.status(500).json({ error: 'blad tworzenia spotkania' });
  }
});

// zapisywanie lub aktualizacja dostepnosci
app.post('/api/meetings/:id/availability', async (req, res) => {
  try {
    const { userName, userAvatar, slots } = req.body;
    if (!userName || !userName.trim()) {
      return res.status(400).json({ error: 'nazwa uzytkownika jest wymagana' });
    }
    const updated = await setAvailability(
      req.params.id,
      userName.trim(),
      userAvatar || '👤',
      Array.isArray(slots) ? slots : []
    );
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'blad zapisu dostepnosci' });
  }
});

// usuniecie dostepnosci uzytkownika
app.delete('/api/meetings/:id/availability', async (req, res) => {
  try {
    const { userName } = req.body;
    if (!userName) {
      return res.status(400).json({ error: 'brak nazwy uzytkownika' });
    }
    await deleteAvailability(req.params.id, userName);
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
