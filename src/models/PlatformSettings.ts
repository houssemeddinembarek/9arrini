import mongoose, { Schema, Document, Model } from "mongoose";

// Platform-wide configuration the admin edits. A singleton: exactly one
// document, found by its fixed `key`.
export const SETTINGS_KEY = "platform";

export interface IPlatformSettingsDocument extends Document {
  key: string;
  // How many class séances a newly registered student gets for free. The value
  // is stamped onto each student at sign-up, so changing it here only affects
  // students who register afterwards.
  freeSeancesForNewStudents: number;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PlatformSettingsSchema = new Schema<IPlatformSettingsDocument>(
  {
    key: { type: String, required: true, unique: true, default: SETTINGS_KEY },
    freeSeancesForNewStudents: { type: Number, default: 0, min: 0 },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const PlatformSettings: Model<IPlatformSettingsDocument> =
  mongoose.models.PlatformSettings ||
  mongoose.model<IPlatformSettingsDocument>("PlatformSettings", PlatformSettingsSchema);

export default PlatformSettings;
