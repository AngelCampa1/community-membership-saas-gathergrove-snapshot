import type { Metadata } from "next";
import { LoginForm } from "@/components/features/auth/login-form";
import { RouteProtection } from "@/components/auth/RouteProtection";

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to your GatherGrove account to access your club dashboard.",
  robots: { index: false, follow: true },
};

export default function LoginPage() {
  return (
    <RouteProtection>
      <LoginForm />
    </RouteProtection>
  );
}

