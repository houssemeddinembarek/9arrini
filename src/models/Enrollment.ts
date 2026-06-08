import mongoose, { Schema, Document, Model } from "mongoose";

export interface IEnrollmentDocument extends Document {
  student: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  progress: number;
  completedLessons: mongoose.Types.ObjectId[];
  quizScores: { quiz: mongoose.Types.ObjectId; score: number; passed: boolean; attemptedAt: Date }[];
  certificateIssued: boolean;
  enrolledAt: Date;
  completedAt?: Date;
  lastAccessedAt?: Date;
}

const EnrollmentSchema = new Schema<IEnrollmentDocument>(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    completedLessons: [{ type: Schema.Types.ObjectId, ref: "Lesson" }],
    quizScores: [
      {
        quiz: { type: Schema.Types.ObjectId, ref: "Quiz" },
        score: { type: Number },
        passed: { type: Boolean },
        attemptedAt: { type: Date, default: Date.now },
      },
    ],
    certificateIssued: { type: Boolean, default: false },
    enrolledAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    lastAccessedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

EnrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

const Enrollment: Model<IEnrollmentDocument> =
  mongoose.models.Enrollment || mongoose.model<IEnrollmentDocument>("Enrollment", EnrollmentSchema);

export default Enrollment;
