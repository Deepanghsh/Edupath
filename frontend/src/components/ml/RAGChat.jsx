// frontend/src/components/ml/RAGChat.jsx
// ========================================
// MongoDB-native RAG chat — student can ask placement questions.
// No LLM — answers come from TF-IDF retrieval + templates.

import { useState, useRef, useEffect } from 'react';
import { askRAG } from '../../utils/mlApi';

const SUGGESTIONS = [
  'Which companies hire PHP developers?',
  'What is the placement rate?',
  'Which drives allow backlogs?',
  'What skills are most in demand?',
  'What is the minimum CGPA for TCS?',
];

export default function RAGChat() {
  const [messages, setMessages] = useState([
    { role: 'bot', text: '👋 Hi! Ask me anything about placements, drives, or skills.' }
  ]);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (query) => {
    const q = (query || input).trim();
    if (!q) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: q }]);
    setLoading(true);
    try {
      const res = await askRAG(q);
      setMessages(prev => [...prev, { role: 'bot', text: res.data.answer }]);
    } catch (e) {
      const status = e.response?.status;
      let msg;
      if (status === 429) {
        msg = '⏳ The AI assistant is temporarily busy. Please wait 30 seconds and try again.';
      } else if (status >= 500 || !status) {
        msg = '⚠️ AI assistant is warming up. Please retry in a moment.';
      } else {
        msg = e.response?.data?.error || '⚠️ Could not get a response. Please try again.';
      }
      setMessages(prev => [...prev, { role: 'bot', text: msg, error: true }]);
    } finally { setLoading(false); }
  };

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <span style={styles.title}>💬 Placement Assistant (AI)</span>
        <span style={styles.badge}>MongoDB RAG</span>
      </div>

      {/* Suggestion chips */}
      <div style={styles.chips}>
        {SUGGESTIONS.map(s => (
          <button key={s} onClick={() => send(s)} style={styles.chip}>{s}</button>
        ))}
      </div>

      {/* Messages */}
      <div style={styles.messageBox}>
        {messages.map((m, i) => (
          <div key={i} style={{
            ...styles.bubble,
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            background: m.role === 'user' ? '#1e5fa8' : m.error ? '#fee2e2' : '#f3f4f6',
            color: m.role === 'user' ? '#fff' : m.error ? '#991b1b' : '#1f2937',
            borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
            maxWidth: '82%',
          }}>
            {m.text}
          </div>
        ))}
        {loading && (
          <div style={{ ...styles.bubble, background: '#f3f4f6', color: '#8d97aa', alignSelf: 'flex-start' }}>
            <span style={styles.typingDot} />
            <span style={{ ...styles.typingDot, animationDelay: '0.2s' }} />
            <span style={{ ...styles.typingDot, animationDelay: '0.4s' }} />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={styles.inputRow}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Ask about drives, skills, companies…"
          style={styles.input}
          disabled={loading}
        />
        <button onClick={() => send()} disabled={loading || !input.trim()} style={styles.sendBtn}>
          Send
        </button>
      </div>
    </div>
  );
}

const styles = {
  card: { background: '#fff', border: '1px solid #e5e7eb', borderTop: '3px solid #b45309', marginBottom: 16 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderBottom: '1px solid #f3f4f6' },
  title: { fontSize: 13, fontWeight: 700, color: '#0d1b3e' },
  badge: { fontSize: 10, background: '#fef9c3', color: '#854d0e', padding: '2px 8px', fontWeight: 700 },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 6, padding: '10px 14px', borderBottom: '1px solid #f3f4f6' },
  chip: {
    fontSize: 11, color: '#1e5fa8', background: '#eff6ff', border: '1px solid #bfdbfe',
    padding: '4px 10px', cursor: 'pointer', borderRadius: 20, whiteSpace: 'nowrap',
  },
  messageBox: {
    display: 'flex', flexDirection: 'column', gap: 8,
    padding: '12px 14px', maxHeight: 240, overflowY: 'auto',
    background: '#fafafa',
  },
  bubble: { fontSize: 12.5, padding: '8px 12px', lineHeight: 1.5, whiteSpace: 'pre-wrap' },
  typingDot: {
    display: 'inline-block', width: 6, height: 6, background: '#8d97aa',
    borderRadius: '50%', margin: '0 2px',
    animation: 'bounce 1s infinite',
  },
  inputRow: { display: 'flex', gap: 8, padding: '10px 14px', borderTop: '1px solid #f3f4f6' },
  input: {
    flex: 1, fontSize: 12, border: '1px solid #d1d5db', padding: '7px 12px',
    outline: 'none', fontFamily: 'inherit',
  },
  sendBtn: {
    fontSize: 12, fontWeight: 700, background: '#1e5fa8', color: '#fff',
    border: 'none', padding: '7px 16px', cursor: 'pointer',
  },
};
