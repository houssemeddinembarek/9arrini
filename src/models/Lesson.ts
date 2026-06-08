import mongoose, { Schema, Document, Model } from "mongoose";

export interface ILessonDocument extends Document {
  title: string;
  description?: string;
  course: mongoose.Types.ObjectId;
  type: "video" | "pdf" | "text" | "quiz";
  order: number;
  videoUrl?: string;
  pdfUrl?: string;
  content?: string;
  duration?: number;
  isPreview: boolean;
  attachments: { name: string; url: string; type: string }[];
}

const LessonSchema = new Schema<ILessonDocument>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    type: { type: String, enum: ["video", "pdf", "text", "quiz"], default: "video" },
    order: { type: Number, required: true },
    videoUrl: { type: String },
    pdfUrl: { type: String },
    content: { type: String },
    duration: { type: Number, default: 0 },
    isPreview: { type: Boolean, default: false },
    attachments: [
      {
        name: { type: String },
        url: { type: String },
        type: { type: String },
      },
    ],
  },
  { timestamps: true }
);

const Lesson: Model<ILessonDocument> =
  mongoose.models.Lesson || mongoose.model<ILessonDocument>("Lesson", LessonSchema);

export default Lesson;
