import React, { useState, useEffect, useRef } from 'react';
import { AppView } from '../types';
import { sendCopilotMessage, resetCopilot } from '../services/gemini';
import { ICONS } from '../constants';

interface CopilotScreenProps {
  onNavigate: (view: AppView) => void;
}

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  links?: Array<{ title: string, uri: string }>;
}

export const CopilotScreen: React.FC<CopilotScreenProps> = ({ onNavigate }) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '0', sender: 'bot', text: 'Hello Driver! Need to find a mechanic, fuel, or directions?' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [gps, setGps] = useState<{lat: number, lng: number} | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.warn("GPS failed", err),
        { enableHighAccuracy: true }
      );
    }
    // Reset session on mount to start fresh
    resetCopilot();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (textOverride?: string) => {
    const text = textOverride || inputText;
    if (!text.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: text };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const result = await sendCopilotMessage(text, gps?.lat, gps?.lng);
      const responseText = result.text || "I couldn't find that.";
      
      // Extract Google Maps Links if any
      const chunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const links: Array<{ title: string, uri: string }> = [];
      
      chunks.forEach((chunk: any) => {
        if (chunk.web?.uri && chunk.web?.title) {
            links.push({ title: chunk.web.title, uri: chunk.web.uri });
        }
      });

      const botMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        sender: 'bot', 
        text: responseText,
        links: links.length > 0 ? links : undefined
      };
      
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
      const errMsg: Message = { id: (Date.now() + 1).toString(), sender: 'bot', text: "Network error. Please try again." };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const QuickChip = ({ label }: { label: string }) => (
    <button 
      onClick={() => handleSend(label)}
      disabled={isLoading}
      className="bg-gray-800 text-civic-lime border border-gray-600 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap active:bg-gray-700"
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-civic-dark text-white">
      {/* Header */}
      <div className="bg-civic-card p-4 border-b border-gray-800 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
            <div className="text-civic-lime scale-125">{ICONS.ROBOT}</div>
            <h2 className="text-xl font-black uppercase tracking-wider">Copilot AI</h2>
        </div>
        <button onClick={() => onNavigate(AppView.HOME)} className="text-gray-400 font-bold underline">EXIT</button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-4 ${
                msg.sender === 'user' 
                ? 'bg-civic-lime text-black font-bold rounded-tr-none' 
                : 'bg-gray-800 text-white rounded-tl-none border border-gray-700'
            }`}>
              <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
              
              {/* Maps Sources */}
              {msg.links && (
                <div className="mt-3 pt-3 border-t border-gray-600">
                    <p className="text-xs uppercase text-gray-400 font-bold mb-2">Sources & Directions:</p>
                    <div className="flex flex-col gap-2">
                        {msg.links.map((link, idx) => (
                            <a 
                                key={idx} 
                                href={link.uri} 
                                target="_blank" 
                                rel="noreferrer"
                                className="flex items-center gap-2 bg-black/30 p-2 rounded hover:bg-black/50 transition-colors text-blue-400 text-sm font-bold truncate"
                            >
                                <span className="text-civic-red">{ICONS.MAP_PIN}</span>
                                {link.title}
                            </a>
                        ))}
                    </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex justify-start">
                <div className="bg-gray-800 p-4 rounded-2xl rounded-tl-none border border-gray-700">
                    <div className="flex gap-2">
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100"></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></div>
                    </div>
                </div>
            </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="p-2 flex gap-2 overflow-x-auto no-scrollbar bg-civic-dark border-t border-gray-800">
         <QuickChip label="Nearest Petrol Pump" />
         <QuickChip label="Find Mechanic" />
         <QuickChip label="Traffic to Dump Yard" />
         <QuickChip label="Nearest Hospital" />
      </div>

      {/* Input */}
      <div className="p-4 bg-civic-card border-t border-gray-800 flex gap-2">
        <input 
          type="text" 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask for location or help..."
          className="flex-1 bg-gray-900 border-2 border-gray-700 rounded-xl px-4 text-white font-bold focus:border-civic-lime focus:outline-none"
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button 
          onClick={() => handleSend()}
          disabled={!inputText.trim() || isLoading}
          className="bg-civic-lime text-black p-3 rounded-xl font-bold disabled:opacity-50 active:scale-95 transition-transform"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
        </button>
      </div>
    </div>
  );
};