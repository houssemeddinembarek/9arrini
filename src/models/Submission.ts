import mongoose, { Schema, Document, Model } from "mongoose";

// One student's work on a given assignment: the photos of their handwritten
// work, plus the teacher's correction (images and/or an AI-assisted text).
export interface ISubmissionDocument extends Document {
  assignment: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  teacher: mongoose.Types.ObjectId;
  status: "pending" | "submitted" | "corrected";
  workImages: string[];
  correctionImages: string[];
  aiCorrection?: string;
  submittedAt?: Date;
  correctedAt?: Date;
}

const SubmissionSchema = new Schema<ISubmissionDocument>(
  {
    assignment: { type: Schema.Types.ObjectId, ref: "Assignment", required: true },
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    teacher: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "submitted", "corrected"], default: "pending" },
    workImages: [{ type: String }],
    correctionImages: [{ type: String }],
    aiCorrection: { type: String, default: "" },
    submittedAt: { type: Date },
    correctedAt: { type: Date },
  },
  { timestamps: true }
);

SubmissionSchema.index({ assignment: 1, student: 1 }, { unique: true });
SubmissionSchema.index({ student: 1, status: 1 });

const Submission: Model<ISubmissionDocument> =
  mongoose.models.Submission || mongoose.model<ISubmissionDocument>("Submission", SubmissionSchema);

export default Submission;
