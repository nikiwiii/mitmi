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
