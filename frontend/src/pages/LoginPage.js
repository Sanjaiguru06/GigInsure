import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Shield, Zap, CloudRain, Thermometer } from 'lucide-react';

const CITIES = ["Chennai", "Mumbai", "Delhi", "Bangalore", "Kolkata", "Hyderabad", "Pune", "Jaipur", "Ahmedabad", "Lucknow"];

export default function LoginPage() {
  const { user, loading, login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('Chennai');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-[#D95D39] border-t-transparent rounded-full" /></div>;
  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const result = isRegister
      ? await register(email, password, name, city)
      : await login(email, password);
    if (!result.success) setError(result.error);
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#F9F8F6] flex" data-testid="login-page">
      {/* Left - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-8 h-8 text-[#D95D39]" />
              <h1 className="text-3xl font-extrabold tracking-tight text-[#1C1A17]" style={{ fontFamily: 'Manrope, sans-serif' }}>
                GigInsure
              </h1>
            </div>
            <p className="text-[#5C5852] text-base leading-relaxed">
              AI-powered parametric insurance for food delivery partners
            </p>
          </div>

          <Card className="border-[#E3DFD8] shadow-none">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-[#1C1A17]" style={{ fontFamily: 'Manrope, sans-serif' }}>
                {isRegister ? 'Create Account' : 'Welcome Back'}
              </CardTitle>
              <CardDescription className="text-[#5C5852]">
                {isRegister ? 'Register to protect your earnings' : 'Sign in to your account'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {isRegister && (
                  <>
                    <div>
                      <Label htmlFor="name" className="text-[#1C1A17] text-sm font-medium">Full Name</Label>
                      <Input
                        id="name"
                        data-testid="register-name-input"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Ravi Kumar"
                        required
                        className="mt-1 border-[#E3DFD8] focus:border-[#D95D39] focus:ring-[#D95D39]"
                      />
                    </div>
                    <div>
                      <Label htmlFor="city" className="text-[#1C1A17] text-sm font-medium">City</Label>
                      <Select value={city} onValueChange={setCity}>
                        <SelectTrigger data-testid="register-city-select" className="mt-1 border-[#E3DFD8]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CITIES.map(c => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                <div>
                  <Label htmlFor="email" className="text-[#1C1A17] text-sm font-medium">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    data-testid="login-email-input"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="rider@example.com"
                    required
                    className="mt-1 border-[#E3DFD8] focus:border-[#D95D39] focus:ring-[#D95D39]"
                  />
                </div>

                <div>
                  <Label htmlFor="password" className="text-[#1C1A17] text-sm font-medium">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    data-testid="login-password-input"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    required
                    minLength={6}
                    className="mt-1 border-[#E3DFD8] focus:border-[#D95D39] focus:ring-[#D95D39]"
                  />
                </div>

                {error && (
                  <div data-testid="auth-error-message" className="text-[#C44536] text-sm bg-red-50 px-3 py-2 rounded-lg">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  data-testid="login-submit-button"
                  disabled={submitting}
                  className="w-full bg-[#D95D39] hover:bg-[#C24D2C] text-white rounded-full h-11 font-semibold transition-all duration-200"
                >
                  {submitting ? 'Please wait...' : (isRegister ? 'Create Account' : 'Sign In')}
                </Button>
              </form>

              <div className="mt-4 text-center">
                <button
                  data-testid="toggle-auth-mode"
                  onClick={() => { setIsRegister(!isRegister); setError(''); }}
                  className="text-[#D95D39] hover:text-[#C24D2C] text-sm font-medium transition-colors"
                >
                  {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register"}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right - Hero Image & Features */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1638381225866-c73ec6106fd2?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHNlYXJjaHwxfHxtb3RvcmN5Y2xlJTIwcmlkZXIlMjBjaXR5fGVufDB8fHx8MTc3NTE5NTQxM3ww&ixlib=rb-4.1.0&q=85"
          alt="Delivery rider"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1C1A17]/90 via-[#1C1A17]/40 to-transparent" />
        <div className="relative z-10 flex flex-col justify-end p-12 text-white">
          <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Protect Your Earnings
          </h2>
          <p className="text-white/80 text-base mb-8 max-w-md leading-relaxed">
            Smart insurance that understands your work. Automatic payouts during heavy rain, rewards for tough traffic days.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: CloudRain, label: "Rain Protection", desc: "Auto-payouts for heavy rain" },
              { icon: Thermometer, label: "Heat Rewards", desc: "Coins for working in extreme heat" },
              { icon: Zap, label: "Instant Claims", desc: "No paperwork, no waiting" },
              { icon: Shield, label: "Weekly Plans", desc: "Starting from just \u20B920/week" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                <Icon className="w-5 h-5 mb-1 text-[#E89B31]" />
                <p className="text-sm font-semibold">{label}</p>
                <p className="text-xs text-white/60">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
