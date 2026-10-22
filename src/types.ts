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

export interface User {
  id: string;
  username: string;
  avatar: string;
  createdAt: string;
}

export type Tab = 'grid' | 'recommendations' | 'participants' | 'meetings';

export interface UserAvailability {
  userName: string;
  userAvatar?: string;
  slots: string[];
  updatedAt: string;
}

export interface MeetingDetails {
  meeting: Meeting;
  participants: UserAvailability[];
}

export interface SlotHoverInfo {
  date: string;
  time: string;
  slotKey: string;
  count: number;
  total: number;
  availableUsers: string[];
  missingUsers: string[];
  x: number;
  y: number;
}
