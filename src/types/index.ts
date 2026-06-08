export type UserRole = "student" | "teacher" | "admin";
export type CourseLevel = "beginner" | "intermediate" | "advanced";
export type CourseStatus = "draft" | "published" | "archived";
export type LessonType = "video" | "pdf" | "text" | "quiz";
export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";
export type SessionStatus = "upcoming" | "live" | "completed" | "cancelled";

export interface IUser {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  role: UserRole;
  isVerified: boolean;
  isApproved: boolean;
  enrolledCourses: string[];
  createdCourses: string[];
  xp: number;
  level: number;
  badges: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ICourse {
  _id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail: string;
  category: string;
  level: CourseLevel;
  language: string;
  price: number;
  isFree: boolean;
  status: CourseStatus;
  teacher: IUser | string;
  lessons: ILesson[] | string[];
  enrollmentCount: number;
  rating: number;
  reviewCount: number;
  duration: number;
  tags: string[];
  requirements: string[];
  objectives: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ILesson {
  _id: string;
  title: string;
  description?: string;
  course: string;
  type: LessonType;
  order: number;
  videoUrl?: string;
  pdfUrl?: string;
  content?: string;
  duration?: number;
  isPreview: boolean;
  createdAt: string;
}

export interface IQuiz {
  _id: string;
  title: string;
  course: string;
  lesson?: string;
  questions: IQuestion[];
  passingScore: number;
  timeLimit?: number;
  attempts: number;
  createdAt: string;
}

export interface IQuestion {
  _id: string;
  text: string;
  type: "multiple_choice" | "true_false" | "short_answer";
  options?: string[];
  correctAnswer: string | number;
  explanation?: string;
  points: number;
}

export interface IEnrollment {
  _id: string;
  student: IUser | string;
  course: ICourse | string;
  progress: number;
  completedLessons: string[];
  quizScores: { quiz: string; score: number; passed: boolean }[];
  certificateIssued: boolean;
  enrolledAt: string;
  completedAt?: string;
}

export interface ITutoringSession {
  _id: string;
  teacher: IUser | string;
  title: string;
  description?: string;
  subject: string;
  price: number;
  duration: number;
  availableSlots: ITimeSlot[];
  createdAt: string;
}

export interface ITimeSlot {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

export interface IBooking {
  _id: string;
  student: IUser | string;
  teacher: IUser | string;
  session: ITutoringSession | string;
  slot: ITimeSlot;
  status: BookingStatus;
  meetingUrl?: string;
  notes?: string;
  createdAt: string;
}

export interface IReview {
  _id: string;
  student: IUser | string;
  course: ICourse | string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface IMessage {
  _id: string;
  sender: IUser | string;
  receiver: IUser | string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface INotification {
  _id: string;
  user: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
