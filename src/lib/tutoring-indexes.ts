import TutoringRequest from "@/models/TutoringRequest";

// Reservations used to be one-per-teacher, enforced by a plain unique index on
// { student, teacher }. Now that a student picks a group, that index would
// block a second request to the same teacher for a different group.
// syncIndexes() drops it and builds the partial ones the schema declares.
//
// Cached at module scope so it runs once per server process, not per request.
let synced: Promise<void> | null = null;

export function ensureTutoringIndexes(): Promise<void> {
  synced ??= TutoringRequest.syncIndexes()
    .then(() => undefined)
    .catch((e) => {
      // Never block a reservation on an index rebuild; log and move on.
      console.error("tutoring syncIndexes failed:", e);
      synced = null;
    });
  return synced;
}
