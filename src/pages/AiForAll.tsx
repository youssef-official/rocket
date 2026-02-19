import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowLeft, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

const API_URL = "https://ai-gateway.vivorax.online/api/ai/generate";

interface Message {
  text: string;
  type: 'user' | 'bot';
}

export default function AiForAll() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: Message = { text, type: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: text,
          config: {
            stream: false,
            temperature: 0.8,
            max_tokens: 800
          }
        })
      });

      const data = await res.json();
      const botMsg: Message = { text: data.result || "No response", type: 'bot' };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      const errorMsg: Message = { text: t('aiforall.error'), type: 'bot' };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 font-sans">
      {/* Header Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate('/')} 
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('aiforall.backToVivora')}
          </button>
          <span className="font-bold text-sm">{t('aiforall.title')}</span>
        </div>
      </header>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mt-16">
        {/* Left Side: Hero Content */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }} 
          animate={{ opacity: 1, x: 0 }} 
          className="text-left"
        >
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 text-sm text-blue-400 mb-6">
            <Sparkles className="w-4 h-4" />
            {t('aiforall.freeBadge')}
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white to-slate-500 bg-clip-text text-transparent leading-tight">
            {t('aiforall.heroTitle')}
          </h1>
          <p className="text-xl text-slate-400 mb-8 leading-relaxed">
            {t('aiforall.heroSubtitle')}
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-2 text-sm text-green-400">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              {t('aiforall.liveStatus')}
            </div>
            <code className="bg-slate-900 border border-slate-800 rounded-full px-4 py-2 text-sm text-slate-400 font-mono">
              https://ai-gateway.vivorax.online
            </code>
          </div>
        </motion.div>

        {/* Right Side: Chat Interface */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-[420px] mx-auto h-[80vh] lg:h-[600px] bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl"
        >
          <div className="p-4 text-center font-bold border-b border-slate-800 bg-slate-900">
            {t('aiforall.chatHeader')}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700">
            {messages.length === 0 && (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm italic">
                {t('chat.placeholder')}
              </div>
            )}
            {messages.map((msg, i) => (
              <div 
                key={i} 
                className={`max-w-[85%] p-3 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.type === 'user' 
                    ? 'bg-blue-600 ml-auto text-white' 
                    : 'bg-slate-800 mr-auto text-slate-200'
                }`}
              >
                {msg.text}
              </div>
            ))}
            {isLoading && (
              <div className="text-xs text-slate-500 animate-pulse">
                {t('aiforall.thinking')}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t border-slate-800 bg-slate-900 flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={t('aiforall.inputPlaceholder')}
              className="flex-1 bg-slate-800 border-none rounded-lg p-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none resize-none h-10"
            />
            <button 
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors p-2 rounded-lg flex items-center justify-center"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
