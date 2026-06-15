import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMeetingDocument extends Document {
  title: string;
  description?: string;
  teacher: mongoose.Types.ObjectId;
  group?: mongoose.Types.ObjectId;
  students: mongoose.Types.ObjectId[];
  date: Date;
  startTime: string;
  endTime?: string;
  type: "online" | "in-person" | "hybrid";
  channelName: string;
  meetingUrl?: string;
  location?: string;
  reminder: { enabled: boolean; minutesBefore: number };
  status: "scheduled" | "cancelled" | "completed";
}

const MeetingSchema = new Schema<IMeetingDocument>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    teacher: { type: Schema.Types.ObjectId, ref: "User", required: true },
    group: { type: Schema.Types.ObjectId, ref: "Group" },
    students: [{ type: Schema.Types.ObjectId, ref: "User" }],
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, default: "" },
    type: { type: String, enum: ["online", "in-person", "hybrid"], default: "online" },
    // Agora RTC channel — stable id every participant joins.
    channelName: { type: String, default: "" },
    meetingUrl: { type: String, default: "" },
    location: { type: String, default: "" },
    reminder: {
      enabled: { type: Boolean, default: true },
      minutesBefore: { type: Number, default: 30 },
    },
    status: { type: String, enum: ["scheduled", "cancelled", "completed"], default: "scheduled" },
  },
  { timestamps: true }
);

MeetingSchema.index({ teacher: 1, date: 1 });
MeetingSchema.index({ students: 1, date: 1 });

const Meeting: Model<IMeetingDocument> =
  mongoose.models.Meeting || mongoose.model<IMeetingDocument>("Meeting", MeetingSchema);

export default Meeting;
