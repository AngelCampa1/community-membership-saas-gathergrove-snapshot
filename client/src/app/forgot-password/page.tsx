import { Metadata } from'next';
import Link from'next/link';
import { ArrowLeft } from'lucide-react';
import { ForgotPasswordForm } from'@/components/features/auth/forgot-password-form';

export const metadata: Metadata = {
  title:'Reset Password',
  description:'Reset your GatherGrove account password',
  robots: { index: false, follow: true },
};

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-background-subtle px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5  to-emerald-500/5  pointer-events-none" />
      <div className="max-w-md w-full space-y-8 relative">
        {/* Back to Login Button */}
        <div className="flex justify-start">
          <Link href="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors duration-200 px-3 py-1.5 rounded-md bg-glass border border-border/50 hover-lift">
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Link>
        </div>

        <div className="glass-strong border-border/50 backdrop-blur-xl p-8 rounded-2xl shadow-2xl">
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}