import mongoose, { Schema, Document, Model } from "mongoose";

// One attendance mark per (séance, student), set by the séance's teacher.
// A séance is either a Meeting (teacher's own calendar session) or a
// ClassSession (school class students enrol in) — exactly one of the two is set.
export interface IAttendanceDocument extends Document {
  meeting?: mongoose.Types.ObjectId;
  classSession?: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  status: "present" | "absent" | "late";
  recordedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendanceDocument>(
  {
    meeting: { type: Schema.Types.ObjectId, ref: "Meeting" },
    classSession: { type: Schema.Types.ObjectId, ref: "ClassSession" },
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["present", "absent", "late"], required: true },
    recordedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// Partial unique indexes: one mark per student per séance, per séance type.
// They are partial so rows of the other type (where the field is missing) don't
// all collide on a single null key.
AttendanceSchema.index(
  { meeting: 1, student: 1 },
  { unique: true, partialFilterExpression: { meeting: { $exists: true } } }
);
AttendanceSchema.index(
  { classSession: 1, student: 1 },
  { unique: true, partialFilterExpression: { classSession: { $exists: true } } }
);
AttendanceSchema.index({ student: 1, createdAt: -1 });

const Attendance: Model<IAttendanceDocument> =
  mongoose.models.Attendance || mongoose.model<IAttendanceDocument>("Attendance", AttendanceSchema);

export default Attendance;
