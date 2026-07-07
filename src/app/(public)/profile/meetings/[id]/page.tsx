"use client";

import { MeetingRoomView } from "@/components/meetings/meeting-room-view";

// Student version of the meeting room — lives under the profile (public) area so
// joining/replaying a meeting keeps the student in their own chrome rather than
// switching to the dashboard. Back link returns to the profile.
export default function StudentMeetingRoomPage() {
  return (
    <div className="h-[calc(100vh-4rem)] px-4 sm:px-6 py-4">
      <MeetingRoomView backHref="/profile" />
    </div>
  );
}
