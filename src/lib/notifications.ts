import mongoose from "mongoose";
import Notification from "@/models/Notification";

type NotificationType = "info" | "success" | "warning" | "error";

interface NotifyInput {
  title: string;
  message: string;
  type?: NotificationType;
  link?: string;
}

type UserId = string | mongoose.Types.ObjectId;

/**
 * Fan a single notification out to many users in one bulk insert.
 * Assumes a DB connection is already established by the caller.
 */
export async function notifyUsers(userIds: UserId[], input: NotifyInput): Promise<void> {
  const recipients = [...new Set(userIds.map((id) => id.toString()))];
  if (recipients.length === 0) return;

  await Notification.insertMany(
    recipients.map((user) => ({
      user,
      title: input.title,
      message: input.message,
      type: input.type ?? "info",
      link: input.link,
    }))
  );
}
