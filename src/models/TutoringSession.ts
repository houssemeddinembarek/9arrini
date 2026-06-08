import mongoose, { Schema, Document, Model } from "mongoose";

const TimeSlotSchema = new Schema({
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  isBooked: { type: Boolean, default: false },
});

export interface ITutoringSessionDocument extends Document {
  teacher: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  subject: string;
  price: number;
  duration: number;
  availableSlots: mongoose.Types.Subdocument[];
  isActive: boolean;
}

const TutoringSessionSchema = new Schema<ITutoringSessionDocument>(
  {
    teacher: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: { type: String },
    subject: { type: String, required: true },
    price: { type: Number, required: true, default: 0 },
    duration: { type: Number, required: true, default: 60 },
    availableSlots: [TimeSlotSchema],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const TutoringSession: Model<ITutoringSessionDocument> =
  mongoose.models.TutoringSession ||
  mongoose.model<ITutoringSessionDocument>("TutoringSession", TutoringSessionSchema);

export default TutoringSession;
