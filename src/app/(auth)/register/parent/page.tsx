import { RegisterForm } from "@/components/auth/register-form";

// Parent sign-up — reachable by direct link only. The administration sends the
// parent this URL with their child's code (?code=…), which is redeemed as soon
// as the account is created.
export const metadata = { robots: { index: false, follow: false } };

export default function ParentRegisterPage() {
  return <RegisterForm role="parent" />;
}
