import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Sparkles, Mic, MicOff, Settings } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { processChatMessage } from '../utils/chatBrain';

const ChatAssistant = ({ isOpen, onClose, setCurrentView }) => {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'ai', text: 'Hello! I am your Clinical AI Assistant. You can ask me about drug interactions, standard dosages, or how to use the dashboard.' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Initialize Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
          // Append final transcript
          setInput(prev => prev + (prev.endsWith(' ') || prev === '' ? '' : ' ') + finalTranscript);
        }
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsListening(true);
      } else {
        alert("Your browser does not support Speech Recognition.");
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userText = input.trim();
    const userMessage = { id: Date.now(), sender: 'user', text: userText };
    const updatedHistory = [...messages, userMessage];
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    let aiResponse = '';
    const storedApiKey = localStorage.getItem('gemini_api_key') || '';

    if (navigator.onLine && storedApiKey.trim()) {
      try {
        const contextHistory = messages.slice(-6).map(m => `${m.sender === 'user' ? 'User' : 'Assistant'}: ${m.text}`).join('\n');
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${storedApiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are the Clinical AI Assistant for the JSPulse Occupational Health Management System (OHMS) at Jindal Steel Patratu.
                
                System Specifications:
                - Target: Offline-resilient clinical registry for steel plant OHC.
                - Tech stack: Electron wrapper, React 19, IndexedDB, local storage proxy, DOM virtualization spreadsheet.
                - Vitals thresholds: BP (90/60 to 140/90), Pulse (60-100), Temp (96.0-99.5F), SpO2 (95-100%).
                - Compliance: Section 45 of Factories Act 1948, Form 21, Periodic Medical Exams (PME).
                
                Previous Conversation History Context:
                ${contextHistory}
                
                Current User query: ${userText}
                
                Provide a professional, clinical, helpful, and concise response in clean markdown formatting.`
              }]
            }]
          })
        });

        if (!response.ok) throw new Error('Gemini API Error');
        const data = await response.json();
        aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "Empty response from Gemini.";
      } catch (err) {
        console.error('Gemini API request failed, falling back to local NLP:', err);
        aiResponse = processChatMessage(userText, updatedHistory);
      }
    } else {
      aiResponse = processChatMessage(userText, updatedHistory);
    }
    
    const typingDelay = Math.min(Math.max(aiResponse.length * 10, 600), 2000);

    setTimeout(() => {
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: aiResponse }]);
      setIsTyping(false);
    }, typingDelay);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const handleQuickAction = (actionText) => {
    setInput(actionText);
    setTimeout(() => {
      // Small delay to allow state to update before sending (or we can just send directly)
      // but sending directly is cleaner.
    }, 0);
  };
  
  // Custom function to handle direct quick action send
  const triggerQuickAction = async (text) => {
    const userMessage = { id: Date.now(), sender: 'user', text: text };
    const updatedHistory = [...messages, userMessage];
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    let aiResponse = '';
    const storedApiKey = localStorage.getItem('gemini_api_key') || '';

    if (navigator.onLine && storedApiKey.trim()) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${storedApiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are the Clinical AI Assistant for the JSPulse Occupational Health Management System (OHMS) at Jindal Steel Patratu.
                
                Current User query: ${text}
                
                Provide a professional, clinical, helpful, and concise response in clean markdown formatting.`
              }]
            }]
          })
        });
        const data = await response.json();
        aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "Empty response from Gemini.";
      } catch (err) {
        console.error('Gemini API Error, falling back to local NLP:', err);
        aiResponse = processChatMessage(text, updatedHistory);
      }
    } else {
      aiResponse = processChatMessage(text, updatedHistory);
    }

    setTimeout(() => {
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: aiResponse }]);
      setIsTyping(false);
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="animate-slide-in" style={{
      position: 'fixed',
      bottom: '90px',
      right: '30px',
      width: '380px',
      height: '550px',
      background: 'var(--surface)',
      borderRadius: '20px',
      boxShadow: 'var(--shadow-lg), 0 0 40px rgba(0,0,0,0.1)',
      border: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
        padding: '1rem',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: '6px', borderRadius: '50%' }}>
            <Sparkles size={20} color="white" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Jindal Steel AI Assistant</h3>
            <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>AI Clinical Support</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.8, display: 'flex', alignItems: 'center' }}
            title="AI Settings"
            onMouseOver={e => e.currentTarget.style.opacity = 1}
            onMouseOut={e => e.currentTarget.style.opacity = 0.8}
          >
            <Settings size={20} />
          </button>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.8, display: 'flex', alignItems: 'center' }}
            onMouseOver={e => e.currentTarget.style.opacity = 1}
            onMouseOut={e => e.currentTarget.style.opacity = 0.8}
          >
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div style={{ padding: '12px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Enter Gemini API Key for Online AI:</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="password" 
              value={apiKey}
              onChange={e => {
                setApiKey(e.target.value);
                localStorage.setItem('gemini_api_key', e.target.value);
              }}
              placeholder="AIzaSy..."
              style={{ flex: 1, padding: '6px 10px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-main)', outline: 'none' }}
            />
            <button 
              onClick={() => setShowSettings(false)}
              style={{ padding: '6px 12px', fontSize: '0.85rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}
            >
              Save
            </button>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>If blank or offline, local context-aware NLP is used automatically.</div>
        </div>
      )}

      {/* Messages Area */}
      <div style={{
        flex: 1,
        padding: '1.5rem 1rem',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        background: 'var(--bg)'
      }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{
            display: 'flex',
            gap: '10px',
            alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
            flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row',
            maxWidth: '85%'
          }}>
            <div style={{ 
              width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: msg.sender === 'user' ? 'var(--primary-light)' : 'var(--success-light)',
              color: msg.sender === 'user' ? 'var(--primary)' : 'var(--success)'
            }}>
              {msg.sender === 'user' ? <User size={18} /> : <Bot size={18} />}
            </div>
            <div style={{
              background: msg.sender === 'user' ? 'var(--primary)' : 'var(--surface)',
              color: msg.sender === 'user' ? 'white' : 'var(--text-main)',
              padding: msg.sender === 'user' ? '10px 14px' : '0',
              borderRadius: '16px',
              borderTopRightRadius: msg.sender === 'user' ? '4px' : '16px',
              borderTopLeftRadius: msg.sender === 'ai' ? '4px' : '16px',
              border: 'none',
              fontSize: '0.95rem',
              lineHeight: 1.5,
              boxShadow: msg.sender === 'user' ? 'var(--shadow-sm)' : 'none'
            }}>
              {msg.sender === 'user' ? (
                msg.text
              ) : (
                <div className="markdown-body" style={{
                  background: 'var(--surface)',
                  padding: '12px 16px',
                  borderRadius: '16px',
                  borderTopLeftRadius: '4px',
                  boxShadow: 'var(--shadow-sm)',
                  border: '1px solid var(--border)'
                }}>
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div style={{ display: 'flex', gap: '10px', alignSelf: 'flex-start' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--success-light)', color: 'var(--success)' }}>
              <Bot size={18} />
            </div>
            <div style={{ background: 'var(--surface)', padding: '12px 16px', borderRadius: '16px', borderTopLeftRadius: '4px', border: '1px solid var(--border)' }}>
              <div className="flex gap-1">
                <span className="animate-pulse" style={{ animationDelay: '0ms' }}>●</span>
                <span className="animate-pulse" style={{ animationDelay: '200ms' }}>●</span>
                <span className="animate-pulse" style={{ animationDelay: '400ms' }}>●</span>
              </div>
            </div>
          </div>
        )}
        
        {messages.length === 1 && !isTyping && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '1rem', justifyContent: 'center' }}>
            <button 
              onClick={() => triggerQuickAction('How do I check interactions?')}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', color: 'var(--primary)', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'var(--primary-light)' }}
              onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface)' }}
            >
              Check interactions
            </button>
            <button 
              onClick={() => triggerQuickAction('Add a new medicine')}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', color: 'var(--primary)', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'var(--primary-light)' }}
              onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface)' }}
            >
              Add new medicine
            </button>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{ padding: '1rem', background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: '8px', position: 'relative' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your clinical question..."
            style={{
              flex: 1,
              padding: '12px 40px 12px 16px',
              borderRadius: '24px',
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              outline: 'none',
              fontSize: '0.95rem'
            }}
          />
          <button
            onClick={toggleListen}
            style={{
              position: 'absolute',
              right: '48px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: isListening ? '#fef2f2' : 'transparent',
              color: isListening ? '#ef4444' : 'var(--text-muted)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            title={isListening ? "Stop Listening" : "Start Voice Input"}
          >
            {isListening ? <span className="animate-pulse"><Mic size={18} /></span> : <MicOff size={18} />}
          </button>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            style={{
              position: 'absolute',
              right: '6px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: input.trim() && !isTyping ? 'var(--primary)' : 'var(--border)',
              color: input.trim() && !isTyping ? 'white' : 'var(--text-muted)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: input.trim() && !isTyping ? 'pointer' : 'default',
              transition: 'background 0.2s'
            }}
          >
            <Send size={16} style={{ marginLeft: '2px' }} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatAssistant;
