import mongoose, { Schema, Document, Model } from "mongoose";

// One attendance mark per (meeting, student), set by the meeting's teacher.
export interface IAttendanceDocument extends Document {
  meeting: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  status: "present" | "absent" | "late";
  recordedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendanceDocument>(
  {
    meeting: { type: Schema.Types.ObjectId, ref: "Meeting", required: true },
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["present", "absent", "late"], required: true },
    recordedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

AttendanceSchema.index({ meeting: 1, student: 1 }, { unique: true });
AttendanceSchema.index({ student: 1, createdAt: -1 });

const Attendance: Model<IAttendanceDocument> =
  mongoose.models.Attendance || mongoose.model<IAttendanceDocument>("Attendance", AttendanceSchema);

export default Attendance;
