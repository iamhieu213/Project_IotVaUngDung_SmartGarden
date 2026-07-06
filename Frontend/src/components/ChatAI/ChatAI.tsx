import React, { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import { Bot, Send, X, Sparkles, Trash2, Copy, Check, MessageSquare } from 'lucide-react';
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
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
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

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([
      { sender: 'ai', text: 'Xin chào! Tôi là trợ lý AI Smart Garden. Tôi có thể giúp gì cho vườn nấm của bạn hôm nay?' }
    ]);
  };

  const suggestions = [
    "Vườn này đang trồng cái gì?",
    "Thông số vườn có đang ổn không?",
    "Cho tôi lời khuyên bảo dưỡng vườn."
  ];

  // Helper function to render text with inline markdown styles (bold, italic, inline code)
  const renderInlineStyles = (text: string) => {
    const regex = /(\*\*.*?\*\*|`.*?`|\*.*?\*)/g;
    const parts = text.split(regex);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={idx} className="chat-ai-inline-code">{part.slice(1, -1)}</code>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={idx}>{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  // Helper function to render markdown blocks (paragraphs, list items, code blocks)
  const renderMessageText = (text: string) => {
    const parts = text.split(/(```[\s\S]*?```)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const codeContent = part.slice(3, -3).trim();
        const lines = codeContent.split('\n');
        let lang = '';
        let code = codeContent;
        if (lines.length > 0 && !lines[0].includes(' ') && lines[0].length < 15) {
          lang = lines[0];
          code = lines.slice(1).join('\n');
        }
        return (
          <pre key={idx} className="chat-ai-code-block">
            {lang && <span className="chat-ai-code-lang">{lang}</span>}
            <code>{code}</code>
          </pre>
        );
      }

      const lines = part.split('\n');
      return lines.map((line, lineIdx) => {
        const listMatch = line.match(/^[\s]*[-*+]\s+(.*)/);
        if (listMatch) {
          return (
            <ul key={`${idx}-${lineIdx}`} className="chat-ai-list">
              <li>{renderInlineStyles(listMatch[1])}</li>
            </ul>
          );
        }
        if (line.trim() === '') {
          return <div key={`${idx}-${lineIdx}`} className="chat-ai-space" />;
        }
        return (
          <p key={`${idx}-${lineIdx}`} className="chat-ai-paragraph">
            {renderInlineStyles(line)}
          </p>
        );
      });
    });
  };

  return (
    <div className="chat-ai-container">
      {/* Floating Chat Bubble Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`chat-ai-bubble-btn ${isOpen ? 'is-active' : ''}`}
        title={isOpen ? "Đóng cửa sổ chat" : "Hỏi trợ lý AI"}
      >
        <div className="chat-ai-btn-glow"></div>
        {isOpen ? (
          <X size={26} className="chat-ai-close-icon" />
        ) : (
          <Bot size={26} className="chat-ai-bot-icon" />
        )}
        <span className="chat-ai-online-dot"></span>
        <span className="chat-ai-tooltip">{isOpen ? "Đóng chat" : "Trợ lý AI"}</span>
      </button>

      {/* Chat Window */}
      <div className={`chat-ai-window ${isOpen ? 'is-open' : 'is-closed'}`}>
        {/* Header */}
        <div className="chat-ai-header">
          <div className="chat-ai-header-title">
            <div className="chat-ai-sparkle-container">
              <Sparkles size={18} className="sparkle-icon" />
            </div>
            <div className="chat-ai-header-text">
              <span className="chat-ai-header-name">Trợ lý AI Smart Garden</span>
              <span className="chat-ai-header-status">
                <span className="status-dot"></span> Đang hoạt động
              </span>
            </div>
          </div>
          <div className="chat-ai-header-actions">
            <button 
              onClick={handleClearChat} 
              className="chat-ai-action-btn"
              title="Xóa lịch sử cuộc trò chuyện"
            >
              <Trash2 size={16} />
            </button>
            <button 
              onClick={() => setIsOpen(false)} 
              className="chat-ai-action-btn close-action"
              title="Thu nhỏ"
            >
              <X size={16} />
            </button>
          </div>
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
              <div className="chat-ai-bubble-container">
                <div className="chat-ai-bubble">
                  {msg.sender === 'user' ? msg.text : renderMessageText(msg.text)}
                </div>
                {msg.sender === 'ai' && (
                  <button
                    onClick={() => handleCopy(msg.text, index)}
                    className={`chat-ai-copy-btn ${copiedIndex === index ? 'copied' : ''}`}
                    title="Sao chép câu trả lời"
                  >
                    {copiedIndex === index ? (
                      <span className="copied-text">Đã chép!</span>
                    ) : (
                      <Copy size={12} />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="chat-ai-msg-row ai-row">
              <div className="chat-ai-avatar">
                <Bot size={16} />
              </div>
              <div className="chat-ai-bubble-container">
                <div className="chat-ai-bubble loading-bubble">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
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
                <MessageSquare size={12} className="chip-icon" />
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
            title="Gửi tin nhắn"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
