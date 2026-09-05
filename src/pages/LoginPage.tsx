import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button, Card } from '../components/ui/Primitives';
import { ShieldAlert, Loader2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    navigate('/overview', { replace: true });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setError(null);
    setSubmitting(true);

    const { error: err } = await signIn(email, password);
    setSubmitting(false);

    if (err) {
      setError('Invalid email or password. Please try again.');
    } else {
      navigate('/overview');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[#E7F0F9] text-[#1971C2] rounded-lg mb-3">
            <ShieldAlert size={28} />
          </div>
          <h1 className="text-2xl font-semibold text-[#212529]">PackCheck</h1>
          <p className="text-sm text-[#495057] mt-1">Package inspection, made simpler.</p>
        </div>

        <Card className="p-6 shadow-sm border border-[#DEE2E6]">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-[#FFF5F5] border border-[#FFC9C9] text-[#C92A2A] rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[#495057] mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="inspector@legalmetrology.gov.in"
                className="w-full bg-white border border-[#DEE2E6] rounded-lg px-3 py-2.5 text-sm text-[#212529] placeholder:text-[#ADB5BD] focus:outline-none focus:ring-2 focus:ring-[#1971C2] focus:ring-offset-1 focus:border-[#1971C2]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#495057] mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-[#DEE2E6] rounded-lg px-3 py-2.5 text-sm text-[#212529] placeholder:text-[#ADB5BD] focus:outline-none focus:ring-2 focus:ring-[#1971C2] focus:ring-offset-1 focus:border-[#1971C2]"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full mt-2"
              disabled={submitting}
              icon={submitting ? <Loader2 className="animate-spin" size={18} /> : undefined}
            >
              {submitting ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-[#E9ECEF] text-center text-xs text-[#868E96]">
            Don't have an account?{' '}
            <Link to="/signup" className="text-[#1971C2] font-medium hover:underline">
              Sign up
            </Link>
          </div>
        </Card>

        <p className="text-center text-xs text-[#868E96] mt-6">
          Department of Legal Metrology Compliance Inspection System
        </p>
      </div>
    </div>
  );
};
