import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Coins, Gift, ArrowDownToLine, Clock, TrendingUp, Zap } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function RewardsPage() {
  const { user } = useAuth();
  const [walletData, setWalletData] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [totalEarned, setTotalEarned] = useState(0);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [walletRes, rewardsRes] = await Promise.all([
        axios.get(`${API}/wallet`, { withCredentials: true }),
        axios.get(`${API}/rewards/history`, { withCredentials: true })
      ]);
      setWalletData(walletRes.data);
      setRewards(rewardsRes.data.rewards || []);
      setTotalEarned(rewardsRes.data.total_earned || 0);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (coins) => {
    setRedeeming(true);
    try {
      await axios.post(`${API}/wallet/redeem`, { coins }, { withCredentials: true });
      fetchData();
    } catch (err) {
      console.error('Redeem error:', err);
    } finally {
      setRedeeming(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin w-8 h-8 border-2 border-[#D95D39] border-t-transparent rounded-full" />
    </div>
  );

  const available = walletData?.available_coins || 0;

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6" data-testid="rewards-page">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1C1A17]" style={{ fontFamily: 'Manrope, sans-serif' }}>
          Rewards & Wallet
        </h1>
        <p className="text-[#5C5852] text-base mt-1">
          Earn coins for working through minor disruptions
        </p>
      </div>

      {/* Wallet Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 border-[#E3DFD8] shadow-none bg-gradient-to-br from-[#F9F8F6] to-[#EBE8E3]" data-testid="wallet-overview-card">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] font-semibold text-[#5C5852]">Available Balance</p>
                <p className="text-5xl font-extrabold text-[#D95D39] mt-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  {available}
                </p>
                <p className="text-sm text-[#5C5852] mt-1">coins</p>
              </div>
              <div className="w-16 h-16 bg-[#E89B31]/10 rounded-full flex items-center justify-center">
                <Coins className="w-8 h-8 text-[#E89B31]" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-[#E3DFD8]">
              <div>
                <p className="text-xs text-[#5C5852]">Total Earned</p>
                <p className="text-lg font-bold text-[#1C1A17]" style={{ fontFamily: 'Manrope, sans-serif' }}>{walletData?.total_coins || 0}</p>
              </div>
              <div>
                <p className="text-xs text-[#5C5852]">Redeemed</p>
                <p className="text-lg font-bold text-[#1C1A17]" style={{ fontFamily: 'Manrope, sans-serif' }}>{walletData?.redeemed_coins || 0}</p>
              </div>
              <div>
                <p className="text-xs text-[#5C5852]">Cash Value</p>
                <p className="text-lg font-bold text-[#4A7C59]" style={{ fontFamily: 'Manrope, sans-serif' }}>{'\u20B9'}{walletData?.cash_value || '0.00'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#E3DFD8] shadow-none" data-testid="redeem-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-[#1C1A17] flex items-center gap-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
              <ArrowDownToLine className="w-5 h-5 text-[#4A7C59]" />
              Redeem Coins
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-[#5C5852]">100 coins = {'\u20B9'}1.00</p>
            <Button
              data-testid="redeem-100-btn"
              onClick={() => handleRedeem(100)}
              disabled={available < 100 || redeeming}
              className="w-full bg-[#4A7C59] hover:bg-[#3d6a4a] text-white rounded-full text-sm"
            >
              Redeem 100 coins ({'\u20B9'}1)
            </Button>
            <Button
              data-testid="redeem-500-btn"
              onClick={() => handleRedeem(500)}
              disabled={available < 500 || redeeming}
              variant="outline"
              className="w-full rounded-full text-sm border-[#E3DFD8]"
            >
              Redeem 500 coins ({'\u20B9'}5)
            </Button>
            <Button
              data-testid="redeem-all-btn"
              onClick={() => handleRedeem(available)}
              disabled={available < 100 || redeeming}
              variant="outline"
              className="w-full rounded-full text-sm border-[#E3DFD8]"
            >
              Redeem All ({'\u20B9'}{(available / 100).toFixed(2)})
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* How Rewards Work */}
      <Card className="border-[#E3DFD8] shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-[#1C1A17] flex items-center gap-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
            <Gift className="w-5 h-5 text-[#E89B31]" />
            How Rewards Work
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { title: 'Traffic Delay', coins: '20-30', desc: 'Delay >= 1.5x normal = 20 coins, >= 2x = 30 coins', icon: Clock },
              { title: 'Extreme Heat', coins: '20-30', desc: 'Temp >= 40°C = 20 coins, >= 42°C = 30 coins', icon: TrendingUp },
              { title: 'Combo Bonus', coins: '+20', desc: 'Both traffic + heat = extra 20 coins', icon: Zap },
            ].map(({ title, coins, desc, icon: Icon }) => (
              <div key={title} className="bg-[#F9F8F6] rounded-xl p-4">
                <Icon className="w-5 h-5 text-[#E89B31] mb-2" />
                <p className="text-sm font-semibold text-[#1C1A17]">{title}</p>
                <Badge className="bg-[#E89B31]/10 text-[#E89B31] rounded-full text-xs mt-1">{coins} coins</Badge>
                <p className="text-xs text-[#5C5852] mt-2">{desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reward History */}
      <div>
        <h2 className="text-lg font-semibold text-[#1C1A17] mb-3" style={{ fontFamily: 'Manrope, sans-serif' }}>Reward History</h2>
        {rewards.length === 0 ? (
          <Card className="border-[#E3DFD8] shadow-none">
            <CardContent className="text-center py-12">
              <Coins className="w-12 h-12 text-[#E3DFD8] mx-auto mb-3" />
              <p className="text-[#5C5852] text-sm">No rewards yet. Rewards are earned automatically when you work through minor disruptions.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {rewards.map((reward) => (
              <Card key={reward.reward_id} className="border-[#E3DFD8] shadow-none hover:shadow-lg hover:shadow-[#EBE8E3] transition-all duration-200" data-testid={`reward-${reward.reward_id}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-[#1C1A17]">{reward.reward_id}</span>
                    <span className="text-lg font-bold text-[#E89B31]" style={{ fontFamily: 'Manrope, sans-serif' }}>+{reward.total_coins} coins</span>
                  </div>
                  <div className="space-y-1">
                    {reward.triggers?.map((t, i) => (
                      <p key={i} className="text-xs text-[#5C5852]">+{t.coins} — {t.detail}</p>
                    ))}
                  </div>
                  <p className="text-[10px] text-[#5C5852] mt-2">{new Date(reward.timestamp).toLocaleString()}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
