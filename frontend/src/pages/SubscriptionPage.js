import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { pricing, policies, payment } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import {
  Shield, Zap, CloudRain, Coins, CheckCircle, Loader2,
  Sparkles, ArrowRight, Brain, MapPin
} from 'lucide-react';

const CITIES = ["Chennai", "Mumbai", "Delhi", "Bangalore", "Kolkata", "Hyderabad", "Pune", "Jaipur", "Ahmedabad", "Lucknow"];

export default function SubscriptionPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [city, setCity] = useState(user?.city || 'Chennai');
  const [pricingData, setPricingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentStep, setPaymentStep] = useState(0);
  const [policyCreated, setPolicyCreated] = useState(null);
  const [hasActive, setHasActive] = useState(false);

  useEffect(() => {
    checkActivePolicy();
  }, []);

  useEffect(() => {
    fetchPricing();
  }, [city]);

  const checkActivePolicy = async () => {
    try {
      const res = await policies.getActive();
      setHasActive(res.data.has_active_policy);
    } catch { /* ignore */ }
  };

  const fetchPricing = async () => {
    setLoading(true);
    try {
      const res = await pricing.calculate(city);
      setPricingData(res.data);
    } catch (err) {
      console.error('Pricing error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (hasActive) return;
    setSubscribing(true);
    try {
      const res = await policies.create(city, pricingData.final_premium);
      setPolicyCreated(res.data);
      setShowPayment(true);
      setPaymentStep(0);
    } catch (err) {
      console.error('Create policy error:', err);
    } finally {
      setSubscribing(false);
    }
  };

  const handlePayment = async () => {
    if (!policyCreated) return;
    setPaymentStep(1); // Processing
    await new Promise(r => setTimeout(r, 1500));
    setPaymentStep(2); // Verifying
    await new Promise(r => setTimeout(r, 1000));
    try {
      await payment.confirm(policyCreated.policy_id);
      setPaymentStep(3); // Success
      await new Promise(r => setTimeout(r, 1500));
      navigate('/dashboard');
    } catch (err) {
      console.error('Payment error:', err);
      setPaymentStep(-1); // Failure
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto" data-testid="subscription-page">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1C1A17]" style={{ fontFamily: 'Manrope, sans-serif' }}>
          Subscribe to GigInsure
        </h1>
        <p className="text-[#5C5852] text-base mt-1 leading-relaxed">
          Choose your city and get AI-optimized weekly protection
        </p>
      </div>

      {hasActive && (
        <div className="mb-6 bg-[#4A7C59]/10 border border-[#4A7C59]/20 rounded-2xl p-4 flex items-center gap-3" data-testid="active-policy-notice">
          <CheckCircle className="w-5 h-5 text-[#4A7C59] flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-[#4A7C59]">You already have an active policy</p>
            <p className="text-xs text-[#5C5852]">You can subscribe again after your current policy expires.</p>
          </div>
          <Button onClick={() => navigate('/dashboard')} variant="outline" className="ml-auto rounded-full border-[#4A7C59] text-[#4A7C59] text-sm">
            View Dashboard
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* City Selector & Pricing */}
        <div className="lg:col-span-2 space-y-6">
          {/* City Select */}
          <Card className="border-[#E3DFD8] shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-[#1C1A17] flex items-center gap-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
                <MapPin className="w-5 h-5 text-[#D95D39]" />
                Select Your City
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger data-testid="city-select" className="border-[#E3DFD8] h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CITIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Pricing Breakdown */}
          {loading ? (
            <Card className="border-[#E3DFD8] shadow-none">
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-[#D95D39] mr-2" />
                <span className="text-[#5C5852]">Calculating your premium with AI...</span>
              </CardContent>
            </Card>
          ) : pricingData && (
            <Card className="border-[#E3DFD8] shadow-none" data-testid="pricing-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-[#1C1A17] flex items-center gap-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    <Brain className="w-5 h-5 text-[#D95D39]" />
                    AI-Optimized Premium
                  </CardTitle>
                  <Badge className="bg-[#D95D39]/10 text-[#D95D39] border-[#D95D39]/20 rounded-full">
                    <Sparkles className="w-3 h-3 mr-1" />
                    {pricingData.ai_source === 'groq_ai' ? 'AI Assessed' : 'Rule Based'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-[#F9F8F6] rounded-xl p-4">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] font-semibold text-[#5C5852]">Weekly Premium</p>
                      <p className="text-4xl font-extrabold text-[#D95D39] mt-1" data-testid="premium-amount" style={{ fontFamily: 'Manrope, sans-serif' }}>
                        {'\u20B9'}{pricingData.final_premium}
                      </p>
                    </div>
                    <Badge className={`rounded-full ${
                      pricingData.risk_level === 'high' ? 'bg-[#C44536]/10 text-[#C44536]' :
                      pricingData.risk_level === 'medium' ? 'bg-[#E89B31]/10 text-[#E89B31]' :
                      'bg-[#4A7C59]/10 text-[#4A7C59]'
                    }`}>
                      {pricingData.risk_level} risk
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-[#F9F8F6] rounded-xl">
                    <p className="text-xs text-[#5C5852]">Base</p>
                    <p className="text-sm font-bold text-[#1C1A17]">{'\u20B9'}{pricingData.base_premium}</p>
                  </div>
                  <div className="text-center p-3 bg-[#F9F8F6] rounded-xl">
                    <p className="text-xs text-[#5C5852]">Multiplier</p>
                    <p className="text-sm font-bold text-[#1C1A17]">{pricingData.multiplier}x</p>
                  </div>
                  <div className="text-center p-3 bg-[#F9F8F6] rounded-xl">
                    <p className="text-xs text-[#5C5852]">Final</p>
                    <p className="text-sm font-bold text-[#D95D39]">{'\u20B9'}{pricingData.final_premium}</p>
                  </div>
                </div>

                <div className="bg-[#2D6A85]/5 rounded-xl p-3 border border-[#2D6A85]/10">
                  <p className="text-xs font-semibold text-[#2D6A85] flex items-center gap-1">
                    <Brain className="w-3 h-3" /> AI Reasoning
                  </p>
                  <p className="text-xs text-[#5C5852] mt-1">{pricingData.ai_reasoning}</p>
                </div>

                {/* Weather Forecast Used */}
                {pricingData.weather_forecast && (
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-2 bg-[#F9F8F6] rounded-lg">
                      <span className="text-[#5C5852]">Expected Rain:</span>
                      <span className="ml-1 font-medium">{pricingData.weather_forecast.total_rain_mm}mm</span>
                    </div>
                    <div className="p-2 bg-[#F9F8F6] rounded-lg">
                      <span className="text-[#5C5852]">Max Wind:</span>
                      <span className="ml-1 font-medium">{pricingData.weather_forecast.max_wind_kmh}km/h</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Plan Details & Subscribe */}
        <div className="space-y-6">
          <Card className="border-[#D95D39] border-2 shadow-none" data-testid="plan-details-card">
            <CardHeader className="pb-3 bg-[#D95D39] text-white rounded-t-xl -mt-[1px] -mx-[1px]">
              <CardTitle className="text-lg font-semibold flex items-center gap-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
                <Shield className="w-5 h-5" />
                Weekly Plan
              </CardTitle>
              <CardDescription className="text-white/80">7-day comprehensive coverage</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {[
                { icon: CloudRain, text: 'Heavy rain auto-payout' },
                { icon: Zap, text: 'Cyclone protection' },
                { icon: Coins, text: 'Traffic & heat rewards' },
                { icon: Shield, text: 'Zero manual claims' },
                { icon: CheckCircle, text: 'AI-powered assessment' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-[#4A7C59]" />
                  <span className="text-sm text-[#1C1A17]">{text}</span>
                </div>
              ))}

              <Button
                data-testid="subscribe-button"
                onClick={handleSubscribe}
                disabled={subscribing || hasActive || !pricingData}
                className="w-full bg-[#D95D39] hover:bg-[#C24D2C] text-white rounded-full h-12 font-semibold mt-4 transition-all duration-200"
              >
                {subscribing ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Processing...</>
                ) : hasActive ? 'Already Subscribed' : (
                  <>Subscribe for {'\u20B9'}{pricingData?.final_premium || '--'}/week <ArrowRight className="ml-2 w-4 h-4" /></>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-[#E3DFD8] shadow-none">
            <CardContent className="pt-4">
              <p className="text-xs text-[#5C5852] leading-relaxed">
                <strong className="text-[#1C1A17]">How it works:</strong> Pay a small weekly premium. When heavy rain or cyclone disrupts your work, we automatically calculate your income loss and credit the payout. No claims needed.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="sm:max-w-md" data-testid="payment-dialog">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Manrope, sans-serif' }}>Complete Payment</DialogTitle>
            <DialogDescription>Simulated UPI Payment</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {paymentStep === 0 && (
              <div className="space-y-4">
                <div className="bg-[#F9F8F6] rounded-xl p-4 text-center">
                  <p className="text-xs uppercase tracking-[0.2em] font-semibold text-[#5C5852]">Amount to Pay</p>
                  <p className="text-3xl font-extrabold text-[#D95D39] mt-1" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    {'\u20B9'}{policyCreated?.premium || '--'}
                  </p>
                  <p className="text-xs text-[#5C5852] mt-1">Weekly Premium</p>
                </div>
                <div className="space-y-2">
                  <Button
                    data-testid="pay-upi-button"
                    onClick={handlePayment}
                    className="w-full bg-[#4A7C59] hover:bg-[#3d6a4a] text-white rounded-full h-11 font-semibold"
                  >
                    Pay via UPI (Simulated)
                  </Button>
                  <Button
                    data-testid="pay-wallet-button"
                    onClick={handlePayment}
                    variant="outline"
                    className="w-full rounded-full h-11 border-[#E3DFD8] text-[#1C1A17]"
                  >
                    Pay via Wallet (Simulated)
                  </Button>
                </div>
              </div>
            )}
            {paymentStep === 1 && (
              <div className="text-center py-6">
                <Loader2 className="w-10 h-10 animate-spin text-[#D95D39] mx-auto" />
                <p className="text-sm text-[#5C5852] mt-3">Processing payment...</p>
              </div>
            )}
            {paymentStep === 2 && (
              <div className="text-center py-6">
                <Loader2 className="w-10 h-10 animate-spin text-[#E89B31] mx-auto" />
                <p className="text-sm text-[#5C5852] mt-3">Verifying and activating policy...</p>
              </div>
            )}
            {paymentStep === 3 && (
              <div className="text-center py-6">
                <CheckCircle className="w-12 h-12 text-[#4A7C59] mx-auto" />
                <p className="text-lg font-bold text-[#1C1A17] mt-3" style={{ fontFamily: 'Manrope, sans-serif' }}>Payment Successful!</p>
                <p className="text-sm text-[#5C5852] mt-1">Your policy is now active. Redirecting...</p>
              </div>
            )}
            {paymentStep === -1 && (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-[#C44536]/10 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-[#C44536] text-xl font-bold">!</span>
                </div>
                <p className="text-lg font-bold text-[#C44536] mt-3" style={{ fontFamily: 'Manrope, sans-serif' }}>Payment Failed</p>
                <p className="text-sm text-[#5C5852] mt-1">Please try again</p>
                <Button onClick={() => setPaymentStep(0)} className="mt-3 bg-[#D95D39] hover:bg-[#C24D2C] text-white rounded-full">
                  Retry
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
