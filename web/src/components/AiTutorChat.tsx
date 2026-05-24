"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Bot, User, Loader2, Sparkles, MessageSquare } from "lucide-react";
import { aiChat, getChatHistory, type ChatResponse } from "@/lib/ai-api";
import { getStoredUser } from "@/lib/auth";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  sources?: any[];
}

export default function AiTutorChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const user = getStoredUser();

  useEffect(() => {
    if (user?.id) {
      loadHistory();
    }
  }, [user?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function loadHistory() {
    if (!user?.id) return;
    try {
      const history = await getChatHistory(user.id);
      if (history && history.history) {
        const mapped = history.history.map((h: any) => ([
          {
            id: `u-${h.timestamp}`,
            role: "user",
            content: h.message,
            timestamp: new Date(h.timestamp)
          },
          {
            id: `a-${h.timestamp}`,
            role: "assistant",
            content: h.answer,
            timestamp: new Date(h.timestamp),
            sources: h.sources
          }
        ])).flat();
        setMessages(mapped);
      }
    } catch (err) {
      console.error("Failed to load chat history:", err);
    }
  }

  async function handleSend() {
    if (!input.trim() || !user?.id || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await aiChat({
        student_id: user.id,
        message: input,
        grade_level: user.grade ? parseInt(user.grade) : 9
      });

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: res.answer,
        timestamp: new Date(),
        sources: res.sources
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error("AI Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: "err",
          role: "assistant",
          content: "Sorry, I'm having trouble connecting to my brain right now. Please try again later.",
          timestamp: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ai-tutor-container">
      <div className="ai-tutor-header">
        <div className="flex items-center gap-3">
          <div className="ai-bot-avatar">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--gray-900)" }}>TriLink AI Tutor</h2>
            <p style={{ fontSize: "0.75rem", color: "var(--primary-500)", fontWeight: 600, marginTop: 2 }}>Always online to help you learn</p>
          </div>
        </div>
      </div>

      <div className="ai-messages-area" ref={scrollRef}>
        {messages.length === 0 && !loading && (
          <div className="ai-empty-state">
            <Bot size={48} style={{ color: "var(--primary-200)", marginBottom: "1rem" }} />
            <h3>Hi {user?.firstName}!</h3>
            <p>I'm your personal AI tutor. Ask me anything about your lessons, or help with a specific topic!</p>
            <div className="ai-suggestions">
              <button onClick={() => setInput("Can you explain photosynthesis?")}>Explain photosynthesis</button>
              <button onClick={() => setInput("Give me a study plan for math")}>Math study plan</button>
              <button onClick={() => setInput("How do I improve my writing?")}>Writing tips</button>
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`ai-message-row ${m.role}`}>
            <div className="ai-message-avatar">
              {m.role === "assistant" ? <Bot size={18} /> : <User size={18} />}
            </div>
            <div className="ai-message-bubble">
              <div className="ai-message-content">{m.content}</div>
              {m.sources && m.sources.length > 0 && (
                <div className="ai-message-sources">
                  <p style={{ fontSize: "0.625rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--gray-400)", marginBottom: 4 }}>Sources</p>
                  {m.sources.map((s: any, i: number) => (
                    <div key={i} className="ai-source-tag">
                      {s.title || "Reference"}
                    </div>
                  ))}
                </div>
              )}
              <div className="ai-message-time">
                {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="ai-message-row assistant">
            <div className="ai-message-avatar">
              <Bot size={18} />
            </div>
            <div className="ai-message-bubble loading">
              <Loader2 style={{ animation: "spin 1s linear infinite" }} size={18} />
              <span>Thinking...</span>
            </div>
          </div>
        )}
      </div>

      <div className="ai-input-area">
        <div className="ai-input-wrapper">
          <input
            type="text"
            placeholder="Ask your tutor something..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button 
            className={`ai-send-btn ${input.trim() ? 'active' : ''}`}
            onClick={handleSend}
            disabled={!input.trim() || loading}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
