import mongoose, { Schema, Document, Model } from "mongoose";

// A student's request to join one of a teacher's groups (e.g. "7ème année —
// Maths"). Once the teacher accepts, the student joins that group and can
// see/join the teacher's meetings.
//
// `group` is optional: requests created before groups were selectable are
// teacher-level, and the teacher can still place the student manually.
export interface ITutoringRequestDocument extends Document {
  student: mongoose.Types.ObjectId;
  teacher: mongoose.Types.ObjectId;
  group?: mongoose.Types.ObjectId;
  status: "pending" | "accepted" | "rejected";
  respondedAt?: Date;
}

const TutoringRequestSchema = new Schema<ITutoringRequestDocument>(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    teacher: { type: Schema.Types.ObjectId, ref: "User", required: true },
    group: { type: Schema.Types.ObjectId, ref: "Group" },
    status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
    respondedAt: { type: Date },
  },
  { timestamps: true }
);

// One request per student per group…
TutoringRequestSchema.index(
  { student: 1, group: 1 },
  { unique: true, partialFilterExpression: { group: { $exists: true } } }
);
// …and at most one group-less (teacher-level) request per student–teacher pair.
TutoringRequestSchema.index(
  { student: 1, teacher: 1 },
  { unique: true, partialFilterExpression: { group: { $exists: false } } }
);
TutoringRequestSchema.index({ teacher: 1, status: 1 });

const TutoringRequest: Model<ITutoringRequestDocument> =
  mongoose.models.TutoringRequest ||
  mongoose.model<ITutoringRequestDocument>("TutoringRequest", TutoringRequestSchema);

export default TutoringRequest;
