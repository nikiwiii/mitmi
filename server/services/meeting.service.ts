import {
  Meeting,
  getMeeting,
  createMeeting,
  deleteMeeting,
  addMember,
  removeMember,
  setAvailability,
  deleteAvailability,
  listMeetingsForUser,
} from "../db.js";
import { validateMeetingInput, validateSlots } from "../utils/meetingValidator.js";

export type ServiceResult<T> =
  | { success: true; data: T; status?: number }
  | { success: false; error: string; status: number };

export async function getUserMeetings(userId: string) {
  return await listMeetingsForUser(userId);
}

export async function getMeetingDetails(
  meetingId: string,
  userId: string
): Promise<ServiceResult<NonNullable<Awaited<ReturnType<typeof getMeeting>>>>> {
  const data = await getMeeting(meetingId);
  if (!data) {
    return {
      success: false,
      error: "spotkanie nie istnieje",
      status: 404,
    };
  }

  await addMember(data.meeting.id, userId);
  return {
    success: true,
    data,
  };
}

export async function createNewMeeting(
  body: unknown,
  userId: string
): Promise<ServiceResult<Meeting>> {
  const validation = validateMeetingInput(body);

  if (!validation.isValid || !validation.data) {
    return {
      success: false,
      error: validation.error || "Nieprawidłowe dane spotkania",
      status: 400,
    };
  }

  const { title, description, dates, startHour, endHour } = validation.data;
  const customId =
    typeof (body as { id?: unknown })?.id === "string"
      ? (body as { id: string }).id.trim()
      : "";

  const id =
    customId ||
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 30) +
      "-" +
      Math.random().toString(36).substring(2, 6);

  const newMeeting: Meeting = {
    id,
    title: title.trim(),
    description: (description || "").trim(),
    dates,
    startHour,
    endHour,
    createdAt: new Date().toISOString(),
    ownerId: userId,
  };

  const saved = await createMeeting(newMeeting);
  return {
    success: true,
    status: 201,
    data: saved,
  };
}

export async function removeMeeting(
  meetingId: string,
  userId: string
): Promise<ServiceResult<void>> {
  const data = await getMeeting(meetingId);
  if (!data) {
    return {
      success: false,
      error: "spotkanie nie istnieje",
      status: 404,
    };
  }

  if (!data.meeting.ownerId || data.meeting.ownerId !== userId) {
    return {
      success: false,
      error: "tylko tworca moze usunac spotkanie",
      status: 403,
    };
  }

  await deleteMeeting(data.meeting.id);
  return {
    success: true,
    data: undefined,
  };
}

export async function leaveMeeting(
  meetingId: string,
  userId: string,
  username: string
): Promise<ServiceResult<void>> {
  await removeMember(meetingId, userId, username);
  return {
    success: true,
    data: undefined,
  };
}

export async function saveAvailability(
  meetingId: string,
  userId: string,
  username: string,
  avatar: string,
  slots: unknown
): Promise<ServiceResult<Awaited<ReturnType<typeof setAvailability>>>> {
  const meetingData = await getMeeting(meetingId);
  if (!meetingData) {
    return {
      success: false,
      error: "spotkanie nie istnieje",
      status: 404,
    };
  }

  const slotValidation = validateSlots(slots, meetingData.meeting);
  if (!slotValidation.isValid || !slotValidation.slots) {
    return {
      success: false,
      error: slotValidation.error || "Nieprawidłowe dane slotów",
      status: 400,
    };
  }

  const updated = await setAvailability(meetingId, username, avatar, slotValidation.slots);
  await addMember(meetingId, userId);

  return {
    success: true,
    data: updated,
  };
}

export async function removeAvailability(
  meetingId: string,
  username: string
): Promise<ServiceResult<void>> {
  await deleteAvailability(meetingId, username);
  return {
    success: true,
    data: undefined,
  };
}
