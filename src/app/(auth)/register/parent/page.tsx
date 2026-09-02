import { RegisterForm } from "@/components/auth/register-form";

// Parent sign-up. When the administration sends a parent an invitation, the URL
// carries their child's code (?code=…), which is redeemed as soon as the
// account is created; parents arriving on their own can add it later.
export default function ParentRegisterPage() {
  return <RegisterForm role="parent" />;
}
