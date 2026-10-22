import { Meeting, MeetingDetails, UserAvailability } from './types.js';

const API_BASE = '/api';

export async function fetchMeeting(id: string): Promise<MeetingDetails> {
  const res = await fetch(`${API_BASE}/meetings/${id}`);
  if (!res.ok) {
    throw new Error('nie udalo sie pobrac spotkania');
  }
  return res.json();
}

export async function saveUserAvailability(
  meetingId: string,
  userName: string,
  userAvatar: string,
  slots: string[]
): Promise<UserAvailability> {
  const res = await fetch(`${API_BASE}/meetings/${meetingId}/availability`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userName, userAvatar, slots })
  });
  if (!res.ok) {
    throw new Error('nie udalo sie zapisac dostepnosci');
  }
  return res.json();
}

export async function removeUserAvailability(
  meetingId: string,
  userName: string
): Promise<boolean> {
  const res = await fetch(`${API_BASE}/meetings/${meetingId}/availability`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userName })
  });
  return res.ok;
}

export async function createNewMeeting(data: {
  title: string;
  description: string;
  dates: string[];
  startHour: number;
  endHour: number;
}): Promise<Meeting> {
  const res = await fetch(`${API_BASE}/meetings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    throw new Error('nie udalo sie utworzyc spotkania');
  }
  return res.json();
}

export async function fetchHealth(): Promise<{ status: string; database: string }> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    return await res.json();
  } catch {
    return { status: 'offline', database: 'none' };
  }
}
