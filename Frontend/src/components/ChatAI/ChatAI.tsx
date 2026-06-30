import React, { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import { Bot, Send, X, Sparkles } from 'lucide-react';
import './ChatAI.css';

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

interface ChatAIProps {
  currentHouseId?: string;
}

export const ChatAI: React.FC<ChatAIProps> = ({ currentHouseId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'ai', text: 'Xin chào! Tôi là trợ lý AI Smart Garden. Tôi có thể giúp gì cho vườn nấm của bạn hôm nay?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom when new message arrives or chat window opens
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const messageContent = textToSend || input;
    if (!messageContent.trim() || loading) return;

    const userMsg = messageContent.trim();
    if (!textToSend) setInput('');
    
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setLoading(true);

    try {
      // Calls the Backend endpoint /chat registered via app.ts
      const res = await api.post('/chat', {
        message: userMsg,
        houseId: currentHouseId
      });

      setMessages(prev => [...prev, { sender: 'ai', text: res.data.reply }]);
    } catch (error) {
      setMessages(prev => [...prev, { sender: 'ai', text: 'Có lỗi xảy ra khi kết nối với máy chủ AI. Vui lòng thử lại sau.' }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    "Vườn này đang trồng cái gì?",
    "Thông số vườn có đang ổn không?",
    "Cho tôi lời khuyên bảo dưỡng vườn."
  ];

  return (
    <div className="chat-ai-container">
      {/* Floating Chat Bubble Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="chat-ai-bubble-btn"
          title="Hỏi trợ lý AI"
        >
          <div className="chat-ai-btn-glow"></div>
          <Bot size={26} className="chat-ai-bot-icon" />
          <span className="chat-ai-online-dot"></span>
          <span className="chat-ai-tooltip">Trợ lý AI</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-ai-window">
          {/* Header */}
          <div className="chat-ai-header">
            <div className="chat-ai-header-title">
              <Sparkles size={18} className="sparkle-icon" />
              <span>Trợ lý AI Smart Garden</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="chat-ai-close-btn">
              <X size={18} />
            </button>
          </div>

          {/* Messages Container */}
          <div className="chat-ai-messages">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`chat-ai-msg-row ${msg.sender === 'user' ? 'user-row' : 'ai-row'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="chat-ai-avatar">
                    <Bot size={16} />
                  </div>
                )}
                <div className="chat-ai-bubble">
                  {msg.text}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="chat-ai-msg-row ai-row">
                <div className="chat-ai-avatar">
                  <Bot size={16} />
                </div>
                <div className="chat-ai-bubble loading-bubble">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Action Suggestion Chips */}
          {!loading && (
            <div className="chat-ai-suggestions">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(s)}
                  className="chat-ai-suggestion-chip"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input Bar */}
          <div className="chat-ai-input-bar">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Hỏi AI về vườn nấm..."
              className="chat-ai-input"
              disabled={loading}
            />
            <button
              onClick={() => handleSend()}
              className="chat-ai-send-btn"
              disabled={loading || !input.trim()}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
