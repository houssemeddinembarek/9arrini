import mongoose, { Schema, Document, Model } from "mongoose";

const QuestionSchema = new Schema({
  text: { type: String, required: true },
  type: { type: String, enum: ["multiple_choice", "true_false", "short_answer"], default: "multiple_choice" },
  options: [{ type: String }],
  correctAnswer: { type: Schema.Types.Mixed, required: true },
  explanation: { type: String },
  points: { type: Number, default: 1 },
});

export interface IQuizDocument extends Document {
  title: string;
  course: mongoose.Types.ObjectId;
  lesson?: mongoose.Types.ObjectId;
  questions: mongoose.Types.Subdocument[];
  passingScore: number;
  timeLimit?: number;
  attempts: number;
}

const QuizSchema = new Schema<IQuizDocument>(
  {
    title: { type: String, required: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    lesson: { type: Schema.Types.ObjectId, ref: "Lesson" },
    questions: [QuestionSchema],
    passingScore: { type: Number, default: 70 },
    timeLimit: { type: Number },
    attempts: { type: Number, default: 3 },
  },
  { timestamps: true }
);

const Quiz: Model<IQuizDocument> =
  mongoose.models.Quiz || mongoose.model<IQuizDocument>("Quiz", QuizSchema);

export default Quiz;
