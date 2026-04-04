import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Shield, CloudRain, Zap, Coins, Brain, ArrowRight, CheckCircle, ChevronDown } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F9F8F6]" data-testid="landing-page">
      {/* Navbar */}
      <nav className="bg-white/70 backdrop-blur-xl border-b border-[#E3DFD8] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#D95D39]" />
            <span className="text-lg font-extrabold text-[#1C1A17] tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>GigInsure</span>
          </div>
          <div className="flex gap-2">
            <Button data-testid="landing-login-btn" onClick={() => navigate('/login')} variant="ghost" className="text-[#5C5852] hover:text-[#1C1A17] rounded-full text-sm">Sign In</Button>
            <Button data-testid="landing-register-btn" onClick={() => navigate('/login')} className="bg-[#D95D39] hover:bg-[#C24D2C] text-white rounded-full text-sm px-5">Get Started</Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 pt-20 pb-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-[#D95D39]/10 text-[#D95D39] rounded-full px-4 py-1.5 text-xs font-semibold mb-6">
              <Brain className="w-3 h-3" /> AI-Powered Parametric Insurance
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#1C1A17] leading-[1.1]" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Protect Your <span className="text-[#D95D39]">Earnings</span>, Rain or Shine
            </h1>
            <p className="text-base sm:text-lg text-[#5C5852] mt-6 max-w-lg leading-relaxed">
              Smart insurance for food delivery partners. Automatic payouts during heavy rain, reward coins for tough traffic days. Zero paperwork, zero waiting.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <Button data-testid="hero-cta-btn" onClick={() => navigate('/login')} className="bg-[#D95D39] hover:bg-[#C24D2C] text-white rounded-full h-12 px-8 text-base font-semibold">
                Start Protection <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({behavior:'smooth'})} variant="outline" className="rounded-full h-12 px-8 text-base border-[#E3DFD8] text-[#5C5852]">
                How It Works <ChevronDown className="ml-2 w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center gap-6 mt-8 text-xs text-[#5C5852]">
              <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-[#4A7C59]" /> From {'\u20B9'}20/week</span>
              <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-[#4A7C59]" /> Zero claims needed</span>
              <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-[#4A7C59]" /> AI-powered</span>
            </div>
          </div>
          <div className="hidden lg:block relative">
            <img src="https://images.unsplash.com/photo-1638381225866-c73ec6106fd2?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHNlYXJjaHwxfHxtb3RvcmN5Y2xlJTIwcmlkZXIlMjBjaXR5fGVufDB8fHx8MTc3NTE5NTQxM3ww&ixlib=rb-4.1.0&q=85&w=800" alt="Delivery rider" className="rounded-3xl shadow-2xl w-full object-cover h-[480px]" />
            <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl p-4 shadow-xl border border-[#E3DFD8]">
              <p className="text-xs text-[#5C5852]">Today's payout</p>
              <p className="text-2xl font-extrabold text-[#4A7C59]" style={{fontFamily:'Manrope'}}>+{'\u20B9'}147</p>
              <p className="text-[10px] text-[#5C5852]">Heavy rain detected</p>
            </div>
            <div className="absolute -top-4 -right-4 bg-white rounded-2xl p-4 shadow-xl border border-[#E3DFD8]">
              <p className="text-xs text-[#5C5852]">Coins earned</p>
              <p className="text-2xl font-extrabold text-[#E89B31]" style={{fontFamily:'Manrope'}}>+70</p>
              <p className="text-[10px] text-[#5C5852]">Traffic + Heat bonus</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-[#1C1A17] mb-12" style={{ fontFamily: 'Manrope, sans-serif' }}>How GigInsure Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Subscribe', desc: 'Pay a small weekly premium (Rs20-Rs50). AI calculates your personalized rate.', icon: Shield },
              { step: '02', title: 'We Monitor', desc: 'Real-time weather, traffic & temperature tracking using live APIs.', icon: CloudRain },
              { step: '03', title: 'Auto-Detect', desc: 'AI identifies disruptions — heavy rain, cyclone, traffic, heat.', icon: Brain },
              { step: '04', title: 'Get Paid', desc: 'Major disruptions = instant payout. Minor ones = reward coins.', icon: Zap },
            ].map(({ step, title, desc, icon: Icon }) => (
              <div key={step} className="text-center group">
                <div className="w-14 h-14 mx-auto rounded-full bg-[#D95D39]/10 flex items-center justify-center mb-4 group-hover:bg-[#D95D39] transition-colors duration-300">
                  <Icon className="w-6 h-6 text-[#D95D39] group-hover:text-white transition-colors duration-300" />
                </div>
                <p className="text-xs text-[#D95D39] font-bold mb-1">STEP {step}</p>
                <h3 className="text-lg font-bold text-[#1C1A17] mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>{title}</h3>
                <p className="text-sm text-[#5C5852] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Triggers */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-[#1C1A17] mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>5 Automated Triggers</h2>
          <p className="text-center text-[#5C5852] text-base mb-12 max-w-lg mx-auto">Real-time parametric triggers that automatically detect disruptions and process claims — zero paperwork needed.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: 'Heavy Rain', threshold: 'Rain >= 50mm', type: 'Insurance Payout', color: '#2D6A85', factor: '0.7x' },
              { title: 'Cyclone', threshold: 'Rain >= 70mm + Wind >= 40km/h', type: 'Insurance Payout', color: '#C44536', factor: '0.9x' },
              { title: 'Moderate Rain', threshold: 'Rain >= 30mm', type: 'Partial Insurance', color: '#E89B31', factor: '0.5x' },
              { title: 'Traffic Delay', threshold: 'Delay >= 1.5x normal', type: 'Reward Coins', color: '#D95D39', factor: '20-30 coins' },
              { title: 'Extreme Heat', threshold: 'Temp >= 40 deg C', type: 'Reward Coins', color: '#D95D39', factor: '20-30 coins' },
            ].map(({ title, threshold, type, color, factor }) => (
              <div key={title} className="bg-white rounded-2xl p-5 border border-[#E3DFD8] hover:shadow-lg hover:shadow-[#EBE8E3] transition-all duration-200 hover:-translate-y-0.5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-[#1C1A17]" style={{ fontFamily: 'Manrope, sans-serif' }}>{title}</h3>
                  <span className="text-xs font-bold rounded-full px-2 py-0.5" style={{ backgroundColor: `${color}15`, color }}>{type}</span>
                </div>
                <p className="text-xs text-[#5C5852] mb-2">{threshold}</p>
                <p className="text-sm font-bold" style={{ color }}>Factor: {factor}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#1C1A17] py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>Ready to Protect Your Income?</h2>
          <p className="text-white/60 text-base mb-8 max-w-md mx-auto">Join thousands of delivery partners who never worry about weather disruptions again.</p>
          <Button data-testid="cta-get-started-btn" onClick={() => navigate('/login')} className="bg-[#D95D39] hover:bg-[#C24D2C] text-white rounded-full h-12 px-10 text-base font-semibold">
            Get Started — It's {'\u20B9'}20/week <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#F9F8F6] border-t border-[#E3DFD8] py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#D95D39]" />
            <span className="font-bold text-[#1C1A17]" style={{ fontFamily: 'Manrope, sans-serif' }}>GigInsure</span>
          </div>
          <p className="text-xs text-[#5C5852]">AI-Powered Parametric Insurance for Gig Workers | DEV Trails Hackathon</p>
        </div>
      </footer>
    </div>
  );
}
