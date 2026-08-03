import { RegisterForm } from "@/components/auth/register-form";

// Teacher sign-up — reachable by direct link only, never advertised on the
// public register page. New accounts still need admin verification.
export const metadata = { robots: { index: false, follow: false } };

export default function TeacherRegisterPage() {
  return <RegisterForm role="teacher" />;
}
