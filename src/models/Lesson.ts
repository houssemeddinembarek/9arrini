import mongoose, { Schema, Document, Model } from "mongoose";

export interface ILessonDocument extends Document {
  title: string;
  description?: string;
  teacher: mongoose.Types.ObjectId;
  course?: mongoose.Types.ObjectId | null;
  type: "video" | "pdf" | "text" | "quiz";
  subject?: string;
  level?: string;
  order: number;
  videoUrl?: string;
  pdfUrl?: string;
  thumbnailUrl?: string;
  cloudinaryId?: string;
  content?: string;
  duration?: number;
  isPreview: boolean;
  attachments: { name: string; url: string; type: string }[];
  createdAt: Date;
  updatedAt: Date;
}

const LessonSchema = new Schema<ILessonDocument>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String },
    teacher: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", default: null, index: true },
    type: { type: String, enum: ["video", "pdf", "text", "quiz"], default: "video" },
    subject: { type: String },
    level: { type: String },
    order: { type: Number, default: 0 },
    videoUrl: { type: String },
    pdfUrl: { type: String },
    thumbnailUrl: { type: String },
    cloudinaryId: { type: String },
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

LessonSchema.index({ teacher: 1, createdAt: -1 });

const Lesson: Model<ILessonDocument> =
  mongoose.models.Lesson || mongoose.model<ILessonDocument>("Lesson", LessonSchema);

export default Lesson;
