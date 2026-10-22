import { Meeting, MeetingDetails, MeetingSummary, User, UserAvailability } from './types.js';

const API_BASE = '/api';
const TOKEN_KEY = 'mitmi_token';

let token: string | null = localStorage.getItem(TOKEN_KEY);
let onUnauthorized: (() => void) | null = null;

export const getToken = () => token;

export function setToken(value: string | null) {
  token = value;
  if (value) localStorage.setItem(TOKEN_KEY, value);
  else localStorage.removeItem(TOKEN_KEY);
}

// callback invoked when the server rejects the session
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

async function request(path: string, options: RequestInit = {}): Promise<Response> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (res.status === 401 && token) onUnauthorized?.();
  return res;
}

async function failWith(res: Response, fallback: string): Promise<never> {
  let message = fallback;
  try {
    const data = await res.json();
    if (data?.error) message = data.error;
  } catch {
    // keep fallback
  }
  throw new Error(message);
}

export async function registerAccount(username: string, password: string, avatar: string): Promise<{ token: string; user: User }> {
  const res = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password, avatar })
  });
  if (!res.ok) return failWith(res, 'nie udalo sie zalozyc konta');
  return res.json();
}

export async function loginAccount(username: string, password: string): Promise<{ token: string; user: User }> {
  const res = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) return failWith(res, 'nie udalo sie zalogowac');
  return res.json();
}

export async function fetchCurrentUser(): Promise<User> {
  const res = await request('/auth/me');
  if (!res.ok) return failWith(res, 'sesja wygasla');
  return (await res.json()).user;
}

export async function updateAvatar(avatar: string): Promise<User> {
  const res = await request('/auth/me', {
    method: 'PATCH',
    body: JSON.stringify({ avatar })
  });
  if (!res.ok) return failWith(res, 'nie udalo sie zapisac profilu');
  return (await res.json()).user;
}

export async function fetchMeeting(id: string): Promise<MeetingDetails> {
  const res = await request(`/meetings/${id}`);
  if (!res.ok) {
    return failWith(res, 'nie udalo sie pobrac spotkania');
  }
  return res.json();
}

export async function fetchMyMeetings(): Promise<MeetingSummary[]> {
  const res = await request('/meetings');
  if (!res.ok) return failWith(res, 'nie udalo sie pobrac listy spotkan');
  return res.json();
}

export async function saveUserAvailability(
  meetingId: string,
  slots: string[]
): Promise<UserAvailability> {
  const res = await request(`/meetings/${meetingId}/availability`, {
    method: 'POST',
    body: JSON.stringify({ slots })
  });
  if (!res.ok) {
    return failWith(res, 'nie udalo sie zapisac dostepnosci');
  }
  return res.json();
}

export async function removeUserAvailability(meetingId: string): Promise<boolean> {
  const res = await request(`/meetings/${meetingId}/availability`, { method: 'DELETE' });
  return res.ok;
}

export async function createNewMeeting(data: {
  title: string;
  description: string;
  dates: string[];
  startHour: number;
  endHour: number;
}): Promise<Meeting> {
  const res = await request('/meetings', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    return failWith(res, 'nie udalo sie utworzyc spotkania');
  }
  return res.json();
}

export async function deleteMeetingById(id: string): Promise<void> {
  const res = await request(`/meetings/${id}`, { method: 'DELETE' });
  if (!res.ok) return failWith(res, 'nie udalo sie usunac spotkania');
}

export async function leaveMeetingById(id: string): Promise<void> {
  const res = await request(`/meetings/${id}/leave`, { method: 'POST' });
  if (!res.ok) return failWith(res, 'nie udalo sie opuscic spotkania');
}

export async function fetchHealth(): Promise<{ status: string; database: string }> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    return await res.json();
  } catch {
    return { status: 'offline', database: 'none' };
  }
}
