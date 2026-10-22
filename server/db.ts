import pg from 'pg';
import dotenv from 'dotenv';
import crypto from 'node:crypto';

dotenv.config();

export interface Meeting {
  id: string;
  title: string;
  description: string;
  dates: string[];
  startHour: number;
  endHour: number;
  createdAt: string;
  ownerId?: string | null;
}

export interface MeetingSummary extends Meeting {
  participantCount: number;
  isOwner: boolean;
}

export interface UserAvailability {
  userName: string;
  userAvatar?: string;
  slots: string[];
  updatedAt: string;
}

export interface User {
  id: string;
  username: string;
  avatar: string;
  createdAt: string;
}

export interface UserRecord extends User {
  passwordHash: string;
}

// inicjalne dane demonstracyjne
const demoMeeting: Meeting = {
  id: 'bit-web-2026',
  title: 'Rekrutacja BIT Web — Ustalenie terminu spotkania',
  description: 'Projekt kołowy: Aplikacja do koordynacji czasu mit.mi. Wybierz dogodne godziny.',
  dates: ['2026-10-23', '2026-10-24', '2026-10-25', '2026-10-26', '2026-10-27'],
  startHour: 9,
  endHour: 19,
  createdAt: new Date().toISOString(),
  ownerId: null
};

const demoAvailabilities: Record<string, UserAvailability[]> = {
  'bit-web-2026': [
    {
      userName: 'Aisha',
      userAvatar: 'Crown',
      slots: [
        '2026-10-23T10:00', '2026-10-23T10:30', '2026-10-23T11:00', '2026-10-23T11:30',
        '2026-10-24T14:00', '2026-10-24T14:30', '2026-10-24T15:00', '2026-10-24T15:30', '2026-10-24T16:00',
        '2026-10-25T15:00', '2026-10-25T15:30', '2026-10-25T16:00'
      ],
      updatedAt: new Date().toISOString()
    },
    {
      userName: 'Tymek',
      userAvatar: 'Zap',
      slots: [
        '2026-10-23T10:00', '2026-10-23T10:30',
        '2026-10-24T13:30', '2026-10-24T14:00', '2026-10-24T14:30', '2026-10-24T15:00', '2026-10-24T15:30', '2026-10-24T16:00',
        '2026-10-25T14:30', '2026-10-25T15:00', '2026-10-25T15:30'
      ],
      updatedAt: new Date().toISOString()
    },
    {
      userName: 'Ola',
      userAvatar: 'Rocket',
      slots: [
        '2026-10-24T14:00', '2026-10-24T14:30', '2026-10-24T15:00', '2026-10-24T15:30', '2026-10-24T16:00',
        '2026-10-25T11:00', '2026-10-25T11:30', '2026-10-25T15:00', '2026-10-25T15:30'
      ],
      updatedAt: new Date().toISOString()
    },
    {
      userName: 'Michal',
      userAvatar: 'Palette',
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
const memoryUsers = new Map<string, UserRecord>();
const memoryMembers = new Map<string, Map<string, number>>();

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
      create table if not exists users (
        id varchar(64) primary key,
        username text not null,
        password_hash text not null,
        avatar text default 'User',
        created_at timestamp default now()
      );
      create unique index if not exists unq_users_username on users (lower(username));
      create table if not exists meetings (
        id varchar(64) primary key,
        title text not null,
        description text default '',
        dates jsonb not null,
        start_hour integer not null default 8,
        end_hour integer not null default 20,
        created_at timestamp default now()
      );
      alter table meetings add column if not exists owner_id varchar(64);
      create table if not exists availabilities (
        id serial primary key,
        meeting_id varchar(64) references meetings(id) on delete cascade,
        user_name text not null,
        user_avatar text default '',
        slots jsonb not null default '[]'::jsonb,
        updated_at timestamp default now(),
        constraint unq_meeting_user unique (meeting_id, user_name)
      );
      create table if not exists meeting_members (
        meeting_id varchar(64) references meetings(id) on delete cascade,
        user_id varchar(64) references users(id) on delete cascade,
        joined_at timestamp default now(),
        primary key (meeting_id, user_id)
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

const parseJson = (v: any) => (typeof v === 'string' ? JSON.parse(v) : v);

function rowToMeeting(row: any): Meeting {
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    dates: parseJson(row.dates),
    startHour: row.start_hour,
    endHour: row.end_hour,
    createdAt: row.created_at,
    ownerId: row.owner_id || null
  };
}

function rowToUser(row: any): UserRecord {
  return {
    id: row.id,
    username: row.username,
    avatar: row.avatar || 'User',
    createdAt: row.created_at,
    passwordHash: row.password_hash
  };
}

export const toPublicUser = (u: UserRecord): User => ({
  id: u.id,
  username: u.username,
  avatar: u.avatar,
  createdAt: u.createdAt
});

// konta uzytkownikow, zwraca null gdy nazwa jest zajeta
export async function createUser(username: string, passwordHash: string, avatar: string): Promise<UserRecord | null> {
  const user: UserRecord = {
    id: crypto.randomUUID(),
    username,
    avatar,
    createdAt: new Date().toISOString(),
    passwordHash
  };

  if (isPgReady) {
    try {
      await pool.query(
        'insert into users (id, username, password_hash, avatar) values ($1, $2, $3, $4)',
        [user.id, username, passwordHash, avatar]
      );
      return user;
    } catch (err: any) {
      if (err?.code === '23505') return null;
      // fallback
    }
  }

  const taken = [...memoryUsers.values()].some(u => u.username.toLowerCase() === username.toLowerCase());
  if (taken) return null;
  memoryUsers.set(user.id, user);
  return user;
}

export async function findUserByName(username: string): Promise<UserRecord | null> {
  if (isPgReady) {
    try {
      const res = await pool.query('select * from users where lower(username) = lower($1)', [username]);
      if (res.rows.length) return rowToUser(res.rows[0]);
    } catch {
      // fallback
    }
  }
  return [...memoryUsers.values()].find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
}

export async function findUserById(id: string): Promise<User | null> {
  if (isPgReady) {
    try {
      const res = await pool.query('select * from users where id = $1', [id]);
      if (res.rows.length) return toPublicUser(rowToUser(res.rows[0]));
    } catch {
      // fallback
    }
  }
  const u = memoryUsers.get(id);
  return u ? toPublicUser(u) : null;
}

export async function updateUserAvatar(id: string, avatar: string): Promise<User | null> {
  if (isPgReady) {
    try {
      const res = await pool.query('update users set avatar = $2 where id = $1 returning *', [id, avatar]);
      if (!res.rows.length) return null;
      const user = rowToUser(res.rows[0]);
      await pool.query('update availabilities set user_avatar = $2 where lower(user_name) = lower($1)', [user.username, avatar]);
      return toPublicUser(user);
    } catch {
      // fallback
    }
  }

  const u = memoryUsers.get(id);
  if (!u) return null;
  u.avatar = avatar;
  for (const list of memoryAvailabilities.values()) {
    list.forEach(p => {
      if (p.userName.toLowerCase() === u.username.toLowerCase()) p.userAvatar = avatar;
    });
  }
  return toPublicUser(u);
}

export async function getMeeting(id: string): Promise<{ meeting: Meeting; participants: UserAvailability[] } | null> {
  if (isPgReady) {
    try {
      const mRes = await pool.query('select * from meetings where id = $1', [id]);
      if (mRes.rows.length === 0) return null;
      const meeting = rowToMeeting(mRes.rows[0]);
      const aRes = await pool.query('select * from availabilities where meeting_id = $1 order by updated_at desc', [id]);
      const participants: UserAvailability[] = aRes.rows.map(r => ({
        userName: r.user_name,
        userAvatar: r.user_avatar,
        slots: parseJson(r.slots),
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

// czlonkostwo w spotkaniu (tworca, dolaczenie przez link, zapis dostepnosci)
export async function addMember(meetingId: string, userId: string): Promise<void> {
  if (isPgReady) {
    try {
      await pool.query(
        'insert into meeting_members (meeting_id, user_id) values ($1, $2) on conflict do nothing',
        [meetingId, userId]
      );
      return;
    } catch {
      // fallback
    }
  }
  const members = memoryMembers.get(meetingId) || new Map<string, number>();
  if (!members.has(userId)) members.set(userId, Date.now());
  memoryMembers.set(meetingId, members);
}

export async function removeMember(meetingId: string, userId: string, userName: string): Promise<void> {
  if (isPgReady) {
    try {
      await pool.query('delete from meeting_members where meeting_id = $1 and user_id = $2', [meetingId, userId]);
      await pool.query('delete from availabilities where meeting_id = $1 and lower(user_name) = lower($2)', [meetingId, userName]);
      return;
    } catch {
      // fallback
    }
  }
  memoryMembers.get(meetingId)?.delete(userId);
  const list = memoryAvailabilities.get(meetingId) || [];
  memoryAvailabilities.set(meetingId, list.filter(p => p.userName.toLowerCase() !== userName.toLowerCase()));
}

export async function listMeetingsForUser(userId: string): Promise<MeetingSummary[]> {
  if (isPgReady) {
    try {
      const res = await pool.query(`
        select m.*, (select count(*) from availabilities a where a.meeting_id = m.id) as participant_count
        from meetings m
        join meeting_members mm on mm.meeting_id = m.id
        where mm.user_id = $1
        order by mm.joined_at desc
      `, [userId]);
      return res.rows.map(r => ({
        ...rowToMeeting(r),
        participantCount: parseInt(r.participant_count),
        isOwner: r.owner_id === userId
      }));
    } catch {
      // fallback
    }
  }

  const result: { joinedAt: number; item: MeetingSummary }[] = [];
  for (const [meetingId, members] of memoryMembers.entries()) {
    const joinedAt = members.get(userId);
    const meeting = memoryMeetings.get(meetingId);
    if (joinedAt === undefined || !meeting) continue;
    result.push({
      joinedAt,
      item: {
        ...meeting,
        participantCount: (memoryAvailabilities.get(meetingId) || []).length,
        isOwner: meeting.ownerId === userId
      }
    });
  }
  return result.sort((a, b) => b.joinedAt - a.joinedAt).map(r => r.item);
}

export async function createMeeting(m: Meeting): Promise<Meeting> {
  if (isPgReady) {
    try {
      await pool.query(
        'insert into meetings (id, title, description, dates, start_hour, end_hour, owner_id) values ($1, $2, $3, $4, $5, $6, $7)',
        [m.id, m.title, m.description, JSON.stringify(m.dates), m.startHour, m.endHour, m.ownerId || null]
      );
      if (m.ownerId) await addMember(m.id, m.ownerId);
      return m;
    } catch {
      // fallback
    }
  }
  memoryMeetings.set(m.id, m);
  if (!memoryAvailabilities.has(m.id)) {
    memoryAvailabilities.set(m.id, []);
  }
  if (m.ownerId) await addMember(m.id, m.ownerId);
  return m;
}

export async function deleteMeeting(id: string): Promise<void> {
  if (isPgReady) {
    try {
      await pool.query('delete from meetings where id = $1', [id]);
      return;
    } catch {
      // fallback
    }
  }
  memoryMeetings.delete(id);
  memoryAvailabilities.delete(id);
  memoryMembers.delete(id);
}

export async function setAvailability(meetingId: string, userName: string, userAvatar: string, slots: string[]): Promise<UserAvailability> {
  const item: UserAvailability = {
    userName,
    userAvatar: userAvatar || 'User',
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
