import Attendance from "@/models/Attendance";

// Attendance used to be meeting-only, with a plain unique index on
// { meeting, student }. Now that a mark can belong to a ClassSession instead,
// that index would treat every class mark as { meeting: null } and reject a
// student's second class. syncIndexes() drops the legacy index and builds the
// partial ones the schema now declares.
//
// Cached at module scope so it runs once per server process, not per request.
let synced: Promise<void> | null = null;

export function ensureAttendanceIndexes(): Promise<void> {
  synced ??= Attendance.syncIndexes()
    .then(() => undefined)
    .catch((e) => {
      // Never block marking attendance on an index rebuild; log and move on.
      console.error("attendance syncIndexes failed:", e);
      synced = null;
    });
  return synced;
}
