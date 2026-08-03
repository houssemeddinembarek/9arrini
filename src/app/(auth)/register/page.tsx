import { RegisterForm } from "@/components/auth/register-form";

// The public sign-up page is student-only. Teachers and parents each have their
// own URL (/register/teacher, /register/parent) that is shared with them
// directly rather than advertised here. Legacy ?role= links are redirected to
// those pages by the proxy.
export default function RegisterPage() {
  return <RegisterForm role="student" />;
}
