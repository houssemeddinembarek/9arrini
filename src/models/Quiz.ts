import mongoose, { Schema, Document, Model } from "mongoose";

// A single multiple-choice question: the student picks one of `options`,
// `correctIndex` is the right one.
const QuestionSchema = new Schema(
  {
    text: { type: String, required: true },
    options: {
      type: [String],
      validate: {
        validator: (v: string[]) => Array.isArray(v) && v.length >= 2,
        message: "A question needs at least 2 options",
      },
    },
    correctIndex: { type: Number, required: true, min: 0 },
    explanation: { type: String, default: "" },
    points: { type: Number, default: 1, min: 1 },
  },
  { _id: false }
);

export interface IQuizQuestion {
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  points: number;
}

export interface IQuizDocument extends Document {
  title: string;
  description: string;
  subject: string;
  classe: string;
  difficulty: "facile" | "moyen" | "difficile";
  questions: IQuizQuestion[];
  xpReward: number;
  passingScore: number;
  timeLimit?: number;
  createdBy: mongoose.Types.ObjectId;
  course?: mongoose.Types.ObjectId;
  status: "draft" | "published";
  createdAt: Date;
  updatedAt: Date;
}

const QuizSchema = new Schema<IQuizDocument>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    subject: { type: String, required: true },
    classe: { type: String, required: true },
    difficulty: { type: String, enum: ["facile", "moyen", "difficile"], default: "moyen" },
    questions: { type: [QuestionSchema], default: [] },
    xpReward: { type: Number, default: 100 }, // XP awarded on first pass
    passingScore: { type: Number, default: 50 }, // percent of points needed to pass
    timeLimit: { type: Number }, // minutes, optional
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: Schema.Types.ObjectId, ref: "Course" },
    status: { type: String, enum: ["draft", "published"], default: "published" },
  },
  { timestamps: true }
);

QuizSchema.index({ createdBy: 1, createdAt: -1 });
QuizSchema.index({ status: 1, subject: 1, classe: 1 });

const Quiz: Model<IQuizDocument> =
  mongoose.models.Quiz || mongoose.model<IQuizDocument>("Quiz", QuizSchema);

export default Quiz;
