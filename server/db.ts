import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export interface Meeting {
  id: string;
  title: string;
  description: string;
  dates: string[];
  startHour: number;
  endHour: number;
  createdAt: string;
}

export interface UserAvailability {
  userName: string;
  userAvatar?: string;
  slots: string[];
  updatedAt: string;
}

// inicjalne dane demonstracyjne
const demoMeeting: Meeting = {
  id: 'bit-web-2026',
  title: 'Rekrutacja BIT Web — Ustalenie terminu spotkania',
  description: 'Projekt kołowy: Aplikacja do koordynacji czasu mit.mi. Wybierz dogodne godziny.',
  dates: ['2026-10-23', '2026-10-24', '2026-10-25', '2026-10-26', '2026-10-27'],
  startHour: 9,
  endHour: 19,
  createdAt: new Date().toISOString()
};

const demoAvailabilities: Record<string, UserAvailability[]> = {
  'bit-web-2026': [
    {
      userName: 'Aisha',
      userAvatar: '👑',
      slots: [
        '2026-10-23T10:00', '2026-10-23T10:30', '2026-10-23T11:00', '2026-10-23T11:30',
        '2026-10-24T14:00', '2026-10-24T14:30', '2026-10-24T15:00', '2026-10-24T15:30', '2026-10-24T16:00',
        '2026-10-25T15:00', '2026-10-25T15:30', '2026-10-25T16:00'
      ],
      updatedAt: new Date().toISOString()
    },
    {
      userName: 'Tymek',
      userAvatar: '⚡',
      slots: [
        '2026-10-23T10:00', '2026-10-23T10:30',
        '2026-10-24T13:30', '2026-10-24T14:00', '2026-10-24T14:30', '2026-10-24T15:00', '2026-10-24T15:30', '2026-10-24T16:00',
        '2026-10-25T14:30', '2026-10-25T15:00', '2026-10-25T15:30'
      ],
      updatedAt: new Date().toISOString()
    },
    {
      userName: 'Ola',
      userAvatar: '🚀',
      slots: [
        '2026-10-24T14:00', '2026-10-24T14:30', '2026-10-24T15:00', '2026-10-24T15:30', '2026-10-24T16:00',
        '2026-10-25T11:00', '2026-10-25T11:30', '2026-10-25T15:00', '2026-10-25T15:30'
      ],
      updatedAt: new Date().toISOString()
    },
    {
      userName: 'Michal',
      userAvatar: '🎨',
      slots: [
        '2026-10-24T14:00', '2026-10-24T14:30', '2026-10-24T15:00', '2026-10-24T15:30',
        '2026-10-26T12:00', '2026-10-26T12:30', '2026-10-26T13:00'
      ],
      updatedAt: new Date().toISOString()
    }
  ]
};

// magazyn w pamieci jako fallback
const memoryMeetings = new Map<string, Meeting>([['bit-web-2026', demoMeeting]]);
const memoryAvailabilities = new Map<string, UserAvailability[]>(Object.entries(demoAvailabilities));

let isPgReady = false;
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/mitmi',
  connectionTimeoutMillis: 2000
});

// inicjalizacja tabel w bazie postgresql
export async function initDb(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query(`
      create table if not exists meetings (
        id varchar(64) primary key,
        title text not null,
        description text default '',
        dates jsonb not null,
        start_hour integer not null default 8,
        end_hour integer not null default 20,
        created_at timestamp default now()
      );
      create table if not exists availabilities (
        id serial primary key,
        meeting_id varchar(64) references meetings(id) on delete cascade,
        user_name text not null,
        user_avatar text default '',
        slots jsonb not null default '[]'::jsonb,
        updated_at timestamp default now(),
        constraint unq_meeting_user unique (meeting_id, user_name)
      );
    `);
    
    // wstawienie przykladowego spotkania jesli puste
    const check = await client.query('select count(*) from meetings');
    if (parseInt(check.rows[0].count) === 0) {
      await client.query(
        'insert into meetings (id, title, description, dates, start_hour, end_hour) values ($1, $2, $3, $4, $5, $6)',
        [demoMeeting.id, demoMeeting.title, demoMeeting.description, JSON.stringify(demoMeeting.dates), demoMeeting.startHour, demoMeeting.endHour]
      );
      for (const item of demoAvailabilities['bit-web-2026']) {
        await client.query(
          'insert into availabilities (meeting_id, user_name, user_avatar, slots) values ($1, $2, $3, $4)',
          [demoMeeting.id, item.userName, item.userAvatar || '', JSON.stringify(item.slots)]
        );
      }
    }
    client.release();
    isPgReady = true;
    console.log('[mit.mi] postgresql polaczony pomyslnie');
    return true;
  } catch (err) {
    isPgReady = false;
    console.log('[mit.mi] brak aktywnego postgresql, dzialam w trybie pamieci');
    return false;
  }
}

export async function getMeeting(id: string): Promise<{ meeting: Meeting; participants: UserAvailability[] } | null> {
  if (isPgReady) {
    try {
      const mRes = await pool.query('select * from meetings where id = $1', [id]);
      if (mRes.rows.length === 0) return null;
      const row = mRes.rows[0];
      const meeting: Meeting = {
        id: row.id,
        title: row.title,
        description: row.description || '',
        dates: typeof row.dates === 'string' ? JSON.parse(row.dates) : row.dates,
        startHour: row.start_hour,
        endHour: row.end_hour,
        createdAt: row.created_at
      };
      const aRes = await pool.query('select * from availabilities where meeting_id = $1 order by updated_at desc', [id]);
      const participants: UserAvailability[] = aRes.rows.map(r => ({
        userName: r.user_name,
        userAvatar: r.user_avatar,
        slots: typeof r.slots === 'string' ? JSON.parse(r.slots) : r.slots,
        updatedAt: r.updated_at
      }));
      return { meeting, participants };
    } catch {
      // fallback
    }
  }

  const meeting = memoryMeetings.get(id);
  if (!meeting) return null;
  const participants = memoryAvailabilities.get(id) || [];
  return { meeting, participants };
}

export async function createMeeting(m: Meeting): Promise<Meeting> {
  if (isPgReady) {
    try {
      await pool.query(
        'insert into meetings (id, title, description, dates, start_hour, end_hour) values ($1, $2, $3, $4, $5, $6)',
        [m.id, m.title, m.description, JSON.stringify(m.dates), m.startHour, m.endHour]
      );
      return m;
    } catch {
      // fallback
    }
  }
  memoryMeetings.set(m.id, m);
  if (!memoryAvailabilities.has(m.id)) {
    memoryAvailabilities.set(m.id, []);
  }
  return m;
}

export async function setAvailability(meetingId: string, userName: string, userAvatar: string, slots: string[]): Promise<UserAvailability> {
  const item: UserAvailability = {
    userName,
    userAvatar: userAvatar || '👤',
    slots,
    updatedAt: new Date().toISOString()
  };

  if (isPgReady) {
    try {
      await pool.query(`
        insert into availabilities (meeting_id, user_name, user_avatar, slots, updated_at)
        values ($1, $2, $3, $4, now())
        on conflict (meeting_id, user_name)
        do update set slots = excluded.slots, user_avatar = excluded.user_avatar, updated_at = now()
      `, [meetingId, userName, item.userAvatar, JSON.stringify(slots)]);
      return item;
    } catch {
      // fallback
    }
  }

  const list = memoryAvailabilities.get(meetingId) || [];
  const idx = list.findIndex(p => p.userName.toLowerCase() === userName.toLowerCase());
  if (idx >= 0) {
    list[idx] = item;
  } else {
    list.push(item);
  }
  memoryAvailabilities.set(meetingId, list);
  return item;
}

export async function deleteAvailability(meetingId: string, userName: string): Promise<boolean> {
  if (isPgReady) {
    try {
      await pool.query('delete from availabilities where meeting_id = $1 and lower(user_name) = lower($2)', [meetingId, userName]);
      return true;
    } catch {
      // fallback
    }
  }

  const list = memoryAvailabilities.get(meetingId) || [];
  const filtered = list.filter(p => p.userName.toLowerCase() !== userName.toLowerCase());
  memoryAvailabilities.set(meetingId, filtered);
  return true;
}

export function isPostgresActive(): boolean {
  return isPgReady;
}
