import mongoose, { Schema, Document, Model } from "mongoose";

// An admin-scheduled live class assigned to a teacher. Students browse these,
// request to join, and (once the admin confirms payment) attend the Agora room.
export interface IClassSessionDocument extends Document {
  title: string;
  subject: string;
  level: string;
  description?: string;
  teacher: mongoose.Types.ObjectId;
  date: Date;
  startTime: string;
  endTime: string;
  price: number;
  channelName: string;
  status: "open" | "cancelled" | "completed";
  createdBy: mongoose.Types.ObjectId;
}

const ClassSessionSchema = new Schema<IClassSessionDocument>(
  {
    title: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    level: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    teacher: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    price: { type: Number, required: true, default: 0 },
    // Agora RTC channel — the live room every confirmed participant joins.
    channelName: { type: String, default: "" },
    status: { type: String, enum: ["open", "cancelled", "completed"], default: "open" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

ClassSessionSchema.index({ status: 1, date: 1 });
ClassSessionSchema.index({ teacher: 1, date: 1 });

const ClassSession: Model<IClassSessionDocument> =
  mongoose.models.ClassSession ||
  mongoose.model<IClassSessionDocument>("ClassSession", ClassSessionSchema);

export default ClassSession;
