import mongoose, { Schema, Document, Model } from "mongoose";

// "Travail à faire" — a teacher assigns an existing content (exercice PDF) to
// one/several students (or a whole group) with a due date. Each recipient gets
// a Submission record to track their work and its correction.
export interface IAssignmentDocument extends Document {
  title: string;
  instructions?: string;
  teacher: mongoose.Types.ObjectId;
  content: mongoose.Types.ObjectId;
  students: mongoose.Types.ObjectId[];
  group?: mongoose.Types.ObjectId;
  assignedAt: Date;
  dueDate: Date;
}

const AssignmentSchema = new Schema<IAssignmentDocument>(
  {
    title: { type: String, required: true, trim: true },
    instructions: { type: String, trim: true, default: "" },
    teacher: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: Schema.Types.ObjectId, ref: "Content", required: true },
    students: [{ type: Schema.Types.ObjectId, ref: "User" }],
    group: { type: Schema.Types.ObjectId, ref: "Group" },
    assignedAt: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true },
  },
  { timestamps: true }
);

AssignmentSchema.index({ teacher: 1, createdAt: -1 });
AssignmentSchema.index({ students: 1, dueDate: 1 });

const Assignment: Model<IAssignmentDocument> =
  mongoose.models.Assignment || mongoose.model<IAssignmentDocument>("Assignment", AssignmentSchema);

export default Assignment;
