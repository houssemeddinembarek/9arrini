import crypto from "crypto";
import { Types } from "mongoose";
import User from "@/models/User";

// Human-friendly, unguessable share code (no ambiguous chars like O/0/I/1).
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function makeLinkCode(len = 8): string {
  const bytes = crypto.randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

// A code guaranteed not to collide with another user's (retries on the
// astronomically unlikely unique-index clash).
export async function generateUniqueLinkCode(excludeId?: Types.ObjectId | string): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const code = makeLinkCode();
    const clash = excludeId
      ? await User.exists({ linkCode: code, _id: { $ne: excludeId } })
      : await User.exists({ linkCode: code });
    if (!clash) return code;
  }
  return makeLinkCode();
}
