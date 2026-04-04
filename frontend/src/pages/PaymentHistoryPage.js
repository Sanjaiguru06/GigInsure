import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { CreditCard, CheckCircle, Clock } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function PaymentHistoryPage() {
  const [payments, setPayments] = useState([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API}/payments/history`, { withCredentials: true });
        setPayments(res.data.payments || []);
        setTotalPaid(res.data.total_paid || 0);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin w-8 h-8 border-2 border-[#D95D39] border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto space-y-6" data-testid="payment-history-page">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1C1A17]" style={{ fontFamily: 'Manrope, sans-serif' }}>
          Payment History
        </h1>
        <p className="text-[#5C5852] text-base mt-1">All your premium payments</p>
      </div>

      <Card className="border-[#E3DFD8] shadow-none bg-gradient-to-br from-[#F9F8F6] to-[#EBE8E3]" data-testid="total-paid-card">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] font-semibold text-[#5C5852]">Total Paid</p>
            <p className="text-3xl font-extrabold text-[#D95D39] mt-1" style={{ fontFamily: 'Manrope, sans-serif' }}>{'\u20B9'}{totalPaid}</p>
          </div>
          <div className="w-14 h-14 bg-[#D95D39]/10 rounded-full flex items-center justify-center">
            <CreditCard className="w-7 h-7 text-[#D95D39]" />
          </div>
        </CardContent>
      </Card>

      {payments.length === 0 ? (
        <Card className="border-[#E3DFD8] shadow-none">
          <CardContent className="text-center py-12">
            <CreditCard className="w-12 h-12 text-[#E3DFD8] mx-auto mb-3" />
            <p className="text-[#5C5852] text-sm">No payments yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {payments.map((p) => (
            <Card key={p.payment_id} className="border-[#E3DFD8] shadow-none hover:shadow-lg hover:shadow-[#EBE8E3] transition-all duration-200" data-testid={`payment-${p.payment_id}`}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#4A7C59]/10 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-[#4A7C59]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1C1A17]">{p.payment_id}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge className="rounded-full bg-[#4A7C59]/10 text-[#4A7C59] text-[10px]">{p.status}</Badge>
                      <span className="text-[10px] text-[#5C5852]">Policy: {p.policy_id}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-[#1C1A17]" style={{ fontFamily: 'Manrope, sans-serif' }}>{'\u20B9'}{p.amount}</p>
                  <p className="text-[10px] text-[#5C5852] flex items-center gap-1 justify-end"><Clock className="w-2 h-2" /> {new Date(p.timestamp).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
