import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, Lock, Phone } from 'lucide-react';

const emailSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export default function LoginPage() {
  const navigate = useNavigate();
  const { signInWithEmail } = useAuth();
  // OTP mode disabled until Twilio is configured
  // const [mode, setMode] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validation = emailSchema.safeParse({ email, password });
    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }

    setLoading(true);
    const result = await signInWithEmail(email, password);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else if (result.redirectPath) {
      navigate(result.redirectPath);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your EduSphere account">
      {/* Mode toggle */}
      <div className="flex bg-secondary rounded-lg p-1 mb-6">
        <button
          type="button"
          onClick={() => setMode('email')}
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all ${
            mode === 'email'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Email & Password
        </button>
        <button
          type="button"
          onClick={() => { setMode('otp'); setError(''); }}
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all ${
            mode === 'otp'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Login with OTP
        </button>
      </div>

      {mode === 'email' ? (
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="you@school.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                autoComplete="email"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                autoComplete="current-password"
              />
            </div>
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive text-sm rounded-lg p-3 border border-destructive/20">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading && <Loader2 className="animate-spin" />}
            Sign in
          </Button>
        </form>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Enter your registered phone number to receive an OTP.
          </p>
          <Button
            variant="outline"
            className="w-full"
            size="lg"
            onClick={() => navigate('/otp-login')}
          >
            <Phone className="mr-2 w-4 h-4" />
            Continue with Phone Number
          </Button>
        </div>
      )}

      <p className="text-center text-sm text-muted-foreground mt-8">
        Having trouble logging in?{' '}
        <a href="mailto:support@edusphere.in" className="text-primary hover:underline">
          Contact support
        </a>
      </p>
    </AuthLayout>
  );
}
