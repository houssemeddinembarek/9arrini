import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUserDocument extends Document {
  name: string;
  email: string;
  password: string;
  avatar?: string;
  bio?: string;
  role: "student" | "teacher" | "admin";
  isVerified: boolean;
  isApproved: boolean;
  enrolledCourses: mongoose.Types.ObjectId[];
  createdCourses: mongoose.Types.ObjectId[];
  wishlist: mongoose.Types.ObjectId[];
  xp: number;
  level: number;
  badges: string[];
  socialLinks?: { website?: string; twitter?: string; linkedin?: string };
  expertise?: string[];
  // Teacher verification: profile completeness + admin review.
  verificationStatus: "incomplete" | "pending" | "approved" | "rejected";
  verificationDocuments: { name: string; url: string; type: string; uploadedAt: Date }[];
  rejectionReason?: string;
  resetPasswordToken?: string;
  resetPasswordExpiry?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    avatar: { type: String, default: "" },
    bio: { type: String, maxlength: 500, default: "" },
    role: { type: String, enum: ["student", "teacher", "admin"], default: "student" },
    isVerified: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: true },
    enrolledCourses: [{ type: Schema.Types.ObjectId, ref: "Course" }],
    createdCourses: [{ type: Schema.Types.ObjectId, ref: "Course" }],
    wishlist: [{ type: Schema.Types.ObjectId, ref: "Course" }],
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    badges: [{ type: String }],
    socialLinks: {
      website: String,
      twitter: String,
      linkedin: String,
    },
    expertise: [{ type: String }],
    verificationStatus: {
      type: String,
      enum: ["incomplete", "pending", "approved", "rejected"],
      default: "incomplete",
    },
    verificationDocuments: [
      {
        name: { type: String },
        url: { type: String },
        type: { type: String },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    rejectionReason: { type: String, default: "" },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpiry: { type: Date, select: false },
  },
  { timestamps: true }
);

UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

const User: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>("User", UserSchema);

export default User;
