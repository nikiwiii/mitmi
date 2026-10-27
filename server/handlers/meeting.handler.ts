import type { Response } from "express";
import { AuthedRequest } from "../middleware/auth.middleware.js";
import {
  getUserMeetings,
  getMeetingDetails,
  createNewMeeting,
  removeMeeting,
  leaveMeeting as leaveMeetingService,
  saveAvailability,
  removeAvailability,
} from "../services/meeting.service.js";

export async function listUserMeetings(req: AuthedRequest, res: Response) {
  try {
    const meetings = await getUserMeetings(req.user!.id);
    return res.json(meetings);
  } catch {
    return res.status(500).json({ error: "blad serwera" });
  }
}

export async function getMeetingById(req: AuthedRequest, res: Response) {
  try {
    const result = await getMeetingDetails(
      req.params.id as string,
      req.user!.id
    );
    if (!result.success) {
      return res.status(result.status).json({ error: result.error });
    }
    return res.json(result.data);
  } catch {
    return res.status(500).json({ error: "blad serwera" });
  }
}

export async function createMeeting(req: AuthedRequest, res: Response) {
  try {
    const result = await createNewMeeting(req.body, req.user!.id);
    if (!result.success) {
      return res.status(result.status).json({ error: result.error });
    }
    return res.status(201).json(result.data);
  } catch {
    return res.status(500).json({ error: "blad tworzenia spotkania" });
  }
}

export async function deleteMeeting(req: AuthedRequest, res: Response) {
  try {
    const result = await removeMeeting(
      req.params.id as string,
      req.user!.id
    );
    if (!result.success) {
      return res.status(result.status).json({ error: result.error });
    }
    return res.json({ success: true });
  } catch {
    return res.status(500).json({ error: "blad usuwania spotkania" });
  }
}

export async function leaveMeeting(req: AuthedRequest, res: Response) {
  try {
    await leaveMeetingService(
      req.params.id as string,
      req.user!.id,
      req.user!.username
    );
    return res.json({ success: true });
  } catch {
    return res.status(500).json({ error: "blad opuszczania spotkania" });
  }
}

export async function setMeetingAvailability(
  req: AuthedRequest,
  res: Response
) {
  try {
    const result = await saveAvailability(
      req.params.id as string,
      req.user!.id,
      req.user!.username,
      req.user!.avatar,
      req.body.slots
    );
    if (!result.success) {
      return res.status(result.status).json({ error: result.error });
    }
    return res.json(result.data);
  } catch {
    return res.status(500).json({ error: "blad zapisu dostepnosci" });
  }
}

export async function deleteMeetingAvailability(
  req: AuthedRequest,
  res: Response
) {
  try {
    await removeAvailability(
      req.params.id as string,
      req.user!.username
    );
    return res.json({ success: true });
  } catch {
    return res.status(500).json({ error: "blad usuwania dostepnosci" });
  }
}
