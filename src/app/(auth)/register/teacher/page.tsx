import { RegisterForm } from "@/components/auth/register-form";

// Teacher sign-up. New accounts still need admin verification before they can
// reach the teacher workspace.
export default function TeacherRegisterPage() {
  return <RegisterForm role="teacher" />;
}
