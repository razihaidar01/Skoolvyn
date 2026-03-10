import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Phone, ArrowLeft } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

const phoneSchema = z.string().regex(/^\+91\d{10}$/, 'Enter a valid Indian phone number with +91 prefix');

export default function OtpLoginPage() {
  const navigate = useNavigate();
  const { signInWithOtp, verifyOtp } = useAuth();
  const [step, setStep] = useState<'phone' | 'verify'>('phone');
  const [phone, setPhone] = useState('+91');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validation = phoneSchema.safeParse(phone);
    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }

    setLoading(true);
    const result = await signInWithOtp(phone);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setStep('verify');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (otp.length !== 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }

    setLoading(true);
    const result = await verifyOtp(phone, otp);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else if (result.redirectPath) {
      navigate(result.redirectPath);
    }
  };

  return (
    <AuthLayout
      title={step === 'phone' ? 'Login with OTP' : 'Verify OTP'}
      subtitle={
        step === 'phone'
          ? 'We\'ll send a verification code to your phone'
          : `Enter the 6-digit code sent to ${phone}`
      }
    >
      <Link to="/login" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to login
      </Link>

      {step === 'phone' ? (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="pl-10"
                autoComplete="tel"
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
            Send OTP
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-6">
          <div className="flex justify-center">
            <InputOTP maxLength={6} value={otp} onChange={setOtp}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive text-sm rounded-lg p-3 border border-destructive/20">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading && <Loader2 className="animate-spin" />}
            Verify & Sign in
          </Button>

          <button
            type="button"
            onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
            className="w-full text-sm text-muted-foreground hover:text-foreground"
          >
            Didn't receive the code? Try again
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
