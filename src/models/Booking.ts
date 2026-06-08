import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBookingDocument extends Document {
  student: mongoose.Types.ObjectId;
  teacher: mongoose.Types.ObjectId;
  session: mongoose.Types.ObjectId;
  slotDate: Date;
  startTime: string;
  endTime: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  meetingUrl?: string;
  notes?: string;
  studentNotes?: string;
  price: number;
}

const BookingSchema = new Schema<IBookingDocument>(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    teacher: { type: Schema.Types.ObjectId, ref: "User", required: true },
    session: { type: Schema.Types.ObjectId, ref: "TutoringSession", required: true },
    slotDate: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },
    meetingUrl: { type: String },
    notes: { type: String },
    studentNotes: { type: String },
    price: { type: Number, required: true },
  },
  { timestamps: true }
);

const Booking: Model<IBookingDocument> =
  mongoose.models.Booking || mongoose.model<IBookingDocument>("Booking", BookingSchema);

export default Booking;
