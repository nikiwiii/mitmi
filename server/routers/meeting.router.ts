import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  listUserMeetings,
  getMeetingById,
  createMeeting,
  deleteMeeting,
  leaveMeeting,
  setMeetingAvailability,
  deleteMeetingAvailability,
} from "../handlers/meeting.handler.js";

const meetingRouter = Router();

meetingRouter.use(requireAuth);

meetingRouter.get("/", listUserMeetings);
meetingRouter.post("/", createMeeting);
meetingRouter.get("/:id", getMeetingById);
meetingRouter.delete("/:id", deleteMeeting);
meetingRouter.post("/:id/leave", leaveMeeting);
meetingRouter.post("/:id/availability", setMeetingAvailability);
meetingRouter.delete("/:id/availability", deleteMeetingAvailability);

export { meetingRouter };
