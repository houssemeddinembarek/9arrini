import mongoose, { Schema, Document, Model } from "mongoose";

// One row per (student, quiz). Tracks the best score and whether XP was already
// granted, so a student earns a quiz's XP only once (on their first pass).
export interface IQuizAttemptDocument extends Document {
  user: mongoose.Types.ObjectId;
  quiz: mongoose.Types.ObjectId;
  bestScore: number; // percentage 0–100
  attempts: number;
  passed: boolean;
  xpAwarded: number;
}

const QuizAttemptSchema = new Schema<IQuizAttemptDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    quiz: { type: Schema.Types.ObjectId, ref: "Quiz", required: true },
    bestScore: { type: Number, default: 0 },
    attempts: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    xpAwarded: { type: Number, default: 0 },
  },
  { timestamps: true }
);

QuizAttemptSchema.index({ user: 1, quiz: 1 }, { unique: true });

const QuizAttempt: Model<IQuizAttemptDocument> =
  mongoose.models.QuizAttempt ||
  mongoose.model<IQuizAttemptDocument>("QuizAttempt", QuizAttemptSchema);

export default QuizAttempt;
