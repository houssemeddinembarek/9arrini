"use client";

import { MeetingRoomView } from "@/components/meetings/meeting-room-view";

// Teacher (and dashboard) version of the meeting room — keeps the dashboard chrome.
export default function MeetingRoomPage() {
  return <MeetingRoomView backHref="/dashboard/meetings" />;
}
