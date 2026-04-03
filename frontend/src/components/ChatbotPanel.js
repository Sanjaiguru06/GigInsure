import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { MessageCircle, X, Send, Loader2, Brain, CloudRain } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ChatbotPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hi! I'm your GigInsure AI Risk Advisor. Ask me about weather conditions, whether you should go out, or your coverage details." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const QUICK_PROMPTS = [
    "Should I go out today?",
    "What's my risk level?",
    "How much can I earn today?",
    "Am I covered right now?",
  ];

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    const userMsg = { role: 'user', text: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res = await axios.post(`${API}/chat`, { message: text }, { withCredentials: true });
      setMessages(prev => [...prev, { role: 'assistant', text: res.data.reply, severity: res.data.severity }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: "Sorry, I couldn't process that. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        data-testid="chatbot-toggle-btn"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#D95D39] hover:bg-[#C24D2C] text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105 z-[9999]"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[380px] h-[520px] bg-white rounded-2xl shadow-2xl border border-[#E3DFD8] flex flex-col z-[9999] overflow-hidden" data-testid="chatbot-panel">
      {/* Header */}
      <div className="bg-[#D95D39] text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          <div>
            <p className="text-sm font-semibold" style={{ fontFamily: 'Manrope, sans-serif' }}>AI Risk Advisor</p>
            <p className="text-[10px] text-white/70">Powered by Groq AI</p>
          </div>
        </div>
        <button data-testid="chatbot-close-btn" onClick={() => setIsOpen(false)} className="hover:bg-white/20 rounded-full p-1 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-[#D95D39] text-white rounded-br-md'
                : 'bg-[#F9F8F6] text-[#1C1A17] border border-[#E3DFD8] rounded-bl-md'
            }`}>
              {msg.text}
              {msg.severity && msg.severity !== 'none' && (
                <span className={`inline-flex items-center gap-1 mt-1 text-[10px] font-bold rounded-full px-2 py-0.5 ${
                  msg.severity === 'extreme' ? 'bg-[#C44536]/10 text-[#C44536]' :
                  msg.severity === 'high' ? 'bg-[#D95D39]/10 text-[#D95D39]' :
                  'bg-[#E89B31]/10 text-[#E89B31]'
                }`}>
                  <CloudRain className="w-2 h-2" /> {msg.severity}
                </span>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#F9F8F6] border border-[#E3DFD8] rounded-2xl rounded-bl-md px-3 py-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#D95D39]" />
            </div>
          </div>
        )}
      </div>

      {/* Quick prompts */}
      {messages.length <= 2 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          {QUICK_PROMPTS.map(prompt => (
            <button key={prompt} onClick={() => sendMessage(prompt)} className="text-[10px] px-2 py-1 rounded-full border border-[#E3DFD8] text-[#5C5852] hover:bg-[#D95D39]/10 hover:text-[#D95D39] hover:border-[#D95D39]/20 transition-colors">
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-[#E3DFD8] p-3 flex gap-2 flex-shrink-0">
        <Input
          data-testid="chatbot-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !loading && sendMessage(input)}
          placeholder="Ask about weather, risk..."
          className="flex-1 text-sm border-[#E3DFD8] rounded-full h-9"
        />
        <Button data-testid="chatbot-send-btn" onClick={() => sendMessage(input)} disabled={loading || !input.trim()} className="bg-[#D95D39] hover:bg-[#C24D2C] text-white rounded-full h-9 w-9 p-0">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
