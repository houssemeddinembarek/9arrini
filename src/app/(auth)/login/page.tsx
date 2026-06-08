import { Suspense } from "react";
import LoginForm from "./login-form";

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-md">
        <div className="glass rounded-2xl border border-[hsl(var(--border))] p-8 shadow-2xl animate-pulse h-96" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
