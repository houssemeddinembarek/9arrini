import mongoose, { Schema, Document, Model } from "mongoose";

export interface IGroupDocument extends Document {
  name: string;
  description?: string;
  teacher: mongoose.Types.ObjectId;
  students: mongoose.Types.ObjectId[];
  subject?: string;
  level?: string;
  color: string;
}

const GroupSchema = new Schema<IGroupDocument>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    teacher: { type: Schema.Types.ObjectId, ref: "User", required: true },
    students: [{ type: Schema.Types.ObjectId, ref: "User" }],
    subject: { type: String, trim: true, default: "" },
    level: { type: String, trim: true, default: "" },
    color: { type: String, default: "purple" },
  },
  { timestamps: true }
);

GroupSchema.index({ teacher: 1, createdAt: -1 });

const Group: Model<IGroupDocument> =
  mongoose.models.Group || mongoose.model<IGroupDocument>("Group", GroupSchema);

export default Group;
