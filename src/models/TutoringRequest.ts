import mongoose, { Schema, Document, Model } from "mongoose";

// A student's request to be tutored by a teacher. Once the teacher accepts, the
// student is connected to that teacher and can see/join the teacher's meetings.
export interface ITutoringRequestDocument extends Document {
  student: mongoose.Types.ObjectId;
  teacher: mongoose.Types.ObjectId;
  status: "pending" | "accepted" | "rejected";
  respondedAt?: Date;
}

const TutoringRequestSchema = new Schema<ITutoringRequestDocument>(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    teacher: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
    respondedAt: { type: Date },
  },
  { timestamps: true }
);

// One relationship record per student–teacher pair.
TutoringRequestSchema.index({ student: 1, teacher: 1 }, { unique: true });
TutoringRequestSchema.index({ teacher: 1, status: 1 });

const TutoringRequest: Model<ITutoringRequestDocument> =
  mongoose.models.TutoringRequest ||
  mongoose.model<ITutoringRequestDocument>("TutoringRequest", TutoringRequestSchema);

export default TutoringRequest;
