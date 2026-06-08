import mongoose, { Schema, Document, Model } from "mongoose";

export interface IContentDocument extends Document {
  title: string;
  subject: string;
  level: string;
  contentType: "resume" | "exercices" | "devoir_controle" | "devoir_synthese" | "fiche_revision";
  source: "ai_generated" | "uploaded" | "ai_adapted";
  body: string;
  pdfUrl?: string;
  cloudinaryId?: string;
  teacher: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ContentSchema = new Schema<IContentDocument>(
  {
    title: { type: String, required: true, trim: true },
    subject: { type: String, required: true },
    level: { type: String, required: true },
    contentType: {
      type: String,
      enum: ["resume", "exercices", "devoir_controle", "devoir_synthese", "fiche_revision"],
      required: true,
    },
    source: { type: String, enum: ["ai_generated", "uploaded", "ai_adapted"], required: true },
    body: { type: String, default: "" },
    pdfUrl: { type: String, default: "" },
    cloudinaryId: { type: String, default: "" },
    teacher: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

ContentSchema.index({ teacher: 1, createdAt: -1 });

const Content: Model<IContentDocument> =
  mongoose.models.Content || mongoose.model<IContentDocument>("Content", ContentSchema);

export default Content;
