import mongoose, { Schema, Document, Model } from "mongoose";

// A student's request to join a class. Stays "pending" until the admin confirms
// that payment was received, which flips it to "confirmed" and grants room access.
export interface IClassEnrollmentDocument extends Document {
  classSession: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  status: "pending" | "confirmed" | "rejected" | "cancelled";
  paymentReceived: boolean;
  // Paid for with one of the student's free séances — nothing is owed, so the
  // enrolment skips the payment-confirmation step.
  isFree: boolean;
  confirmedAt?: Date;
}

const ClassEnrollmentSchema = new Schema<IClassEnrollmentDocument>(
  {
    classSession: { type: Schema.Types.ObjectId, ref: "ClassSession", required: true },
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "rejected", "cancelled"],
      default: "pending",
    },
    paymentReceived: { type: Boolean, default: false },
    isFree: { type: Boolean, default: false },
    confirmedAt: { type: Date },
  },
  { timestamps: true }
);

// One enrollment record per student per class.
ClassEnrollmentSchema.index({ classSession: 1, student: 1 }, { unique: true });
ClassEnrollmentSchema.index({ student: 1 });

const ClassEnrollment: Model<IClassEnrollmentDocument> =
  mongoose.models.ClassEnrollment ||
  mongoose.model<IClassEnrollmentDocument>("ClassEnrollment", ClassEnrollmentSchema);

export default ClassEnrollment;
