import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICourseDocument extends Document {
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  thumbnail: string;
  category: string;
  classe: string;
  trimestre: string;
  level: "beginner" | "intermediate" | "advanced";
  language: string;
  price: number;
  isFree: boolean;
  status: "draft" | "published" | "archived";
  teacher: mongoose.Types.ObjectId;
  lessons: mongoose.Types.ObjectId[];
  enrollmentCount: number;
  rating: number;
  reviewCount: number;
  duration: number;
  tags: string[];
  requirements: string[];
  objectives: string[];
  certificate: boolean;
}

const CourseSchema = new Schema<ICourseDocument>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true },
    shortDescription: { type: String, maxlength: 200, default: "" },
    thumbnail: { type: String, default: "" },
    category: { type: String, required: true },
    classe: { type: String, default: "", index: true },
    trimestre: { type: String, default: "" },
    level: { type: String, enum: ["beginner", "intermediate", "advanced"], default: "beginner" },
    language: { type: String, default: "English" },
    price: { type: Number, default: 0 },
    isFree: { type: Boolean, default: true },
    status: { type: String, enum: ["draft", "published", "archived"], default: "draft" },
    teacher: { type: Schema.Types.ObjectId, ref: "User", required: true },
    lessons: [{ type: Schema.Types.ObjectId, ref: "Lesson" }],
    enrollmentCount: { type: Number, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    duration: { type: Number, default: 0 },
    tags: [{ type: String }],
    requirements: [{ type: String }],
    objectives: [{ type: String }],
    certificate: { type: Boolean, default: false },
  },
  { timestamps: true }
);

CourseSchema.index({ title: "text", description: "text", tags: "text" });
CourseSchema.index({ category: 1, classe: 1, status: 1 });

const Course: Model<ICourseDocument> =
  mongoose.models.Course || mongoose.model<ICourseDocument>("Course", CourseSchema);

export default Course;
