import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Terminal as TerminalIcon,
  AlertCircle,
  FileText,
  Code,
  Settings,
  X,
  ChevronLeft,
  Trash2,
  Copy,
  Check,
} from 'lucide-react';
import { AIMessage } from '../../../shared/types/ai';

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  terminalContext?: string;
}

const QUICK_PROMPTS = [
  { icon: <TerminalIcon size={16} />, label: 'Generate command', prompt: 'How do I' },
  { icon: <AlertCircle size={16} />, label: 'Explain error', prompt: 'What does this error mean:' },
  { icon: <FileText size={16} />, label: 'Analyze logs', prompt: 'Analyze these logs:' },
  { icon: <Code size={16} />, label: 'Generate script', prompt: 'Write a script to' },
];

export const AIAssistant: React.FC<AIAssistantProps> = ({ isOpen, onClose, terminalContext }) => {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // AI Settings
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('anthropic/claude-3.5-sonnet');
  const [hasApiKey, setHasApiKey] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    try {
      const result = await window.electron.ai.getSettings();
      if (result.success) {
        setApiKey(result.data.apiKey || '');
        setModel(result.data.model || 'anthropic/claude-3.5-sonnet');
        setHasApiKey(!!result.data.apiKey);
      }
    } catch (err) {
      console.error('Failed to load AI settings:', err);
    }
  };

  const saveSettings = async () => {
    try {
      await window.electron.ai.updateSettings({
        apiKey,
        model,
      });
      setHasApiKey(!!apiKey);
      setShowSettings(false);
      setError(null);
    } catch (err: any) {
      setError('Failed to save settings: ' + err.message);
    }
  };

  const sendMessage = async (content?: string) => {
    const messageContent = content || inputValue.trim();
    if (!messageContent) return;

    if (!hasApiKey) {
      setError('Please configure your OpenRouter API key in settings');
      setShowSettings(true);
      return;
    }

    const userMessage: AIMessage = {
      role: 'user',
      content: messageContent,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      const result = await window.electron.ai.chat(
        [...messages, userMessage],
        terminalContext
      );

      if (result.success) {
        const assistantMessage: AIMessage = {
          role: 'assistant',
          content: result.data.content,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        setError(result.error || 'AI request failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to get AI response');
    } finally {
      setIsLoading(false);
    }
  };

  const useQuickPrompt = (prompt: string) => {
    setInputValue(prompt + ' ');
    inputRef.current?.focus();
  };

  const clearChat = () => {
    if (confirm('Clear all messages?')) {
      setMessages([]);
    }
  };

  const copyMessage = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatMessage = (content: string) => {
    // Simple markdown-like formatting
    const parts = content.split(/(```[\s\S]*?```|`[^`]+`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('```')) {
        const code = part.slice(3, -3).trim();
        return (
          <pre
            key={i}
            style={{
              background: '#1a1a1a',
              padding: '12px',
              borderRadius: '6px',
              overflow: 'auto',
              fontSize: '13px',
              marginTop: '8px',
              marginBottom: '8px',
            }}
          >
            <code>{code}</code>
          </pre>
        );
      } else if (part.startsWith('`')) {
        return (
          <code
            key={i}
            style={{
              background: '#2a2a2a',
              padding: '2px 6px',
              borderRadius: '3px',
              fontSize: '13px',
            }}
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: isOpen ? 0 : '-400px',
        width: '400px',
        height: '100%',
        background: '#1e1e1e',
        borderLeft: '1px solid #333',
        display: 'flex',
        flexDirection: 'column',
        transition: 'right 0.3s ease',
        zIndex: 2000,
        boxShadow: isOpen ? '-4px 0 20px rgba(0,0,0,0.5)' : 'none',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid #333',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#252525',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Bot size={20} style={{ color: '#0e639c' }} />
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>AI Assistant</h3>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              background: showSettings ? '#0e639c' : 'transparent',
              border: 'none',
              color: '#ccc',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
            title="Settings"
          >
            <Settings size={18} />
          </button>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ccc',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Clear chat"
            >
              <Trash2 size={18} />
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ccc',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <ChevronLeft size={18} />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div
          style={{
            padding: '20px',
            borderBottom: '1px solid #333',
            background: '#252525',
          }}
        >
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>
              OpenRouter API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-or-v1-..."
              style={{
                width: '100%',
                padding: '8px 12px',
                background: '#3c3c3c',
                border: '1px solid #555',
                borderRadius: '4px',
                color: '#ccc',
                fontSize: '13px',
              }}
            />
            <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
              Get your API key from{' '}
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#0e639c' }}
              >
                openrouter.ai/keys
              </a>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>
              AI Model
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: '#3c3c3c',
                border: '1px solid #555',
                borderRadius: '4px',
                color: '#ccc',
                fontSize: '13px',
              }}
            >
              <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</option>
              <option value="anthropic/claude-3-opus">Claude 3 Opus</option>
              <option value="anthropic/claude-3-haiku">Claude 3 Haiku</option>
              <option value="openai/gpt-4-turbo">GPT-4 Turbo</option>
              <option value="openai/gpt-4">GPT-4</option>
              <option value="openai/gpt-3.5-turbo">GPT-3.5 Turbo</option>
              <option value="meta-llama/llama-3.1-70b-instruct">Llama 3.1 70B</option>
              <option value="google/gemini-pro">Gemini Pro</option>
            </select>
          </div>

          <button
            onClick={saveSettings}
            style={{
              width: '100%',
              padding: '10px',
              background: '#0e639c',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              fontWeight: 500,
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Save Settings
          </button>
        </div>
      )}

      {/* Quick Prompts */}
      {!hasApiKey ? (
        <div
          style={{
            padding: '20px',
            textAlign: 'center',
            color: '#888',
          }}
        >
          <Bot size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
          <p style={{ fontSize: '14px', margin: 0 }}>Configure your API key to get started</p>
          <button
            onClick={() => setShowSettings(true)}
            style={{
              marginTop: '12px',
              padding: '8px 16px',
              background: '#0e639c',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            Open Settings
          </button>
        </div>
      ) : messages.length === 0 ? (
        <div style={{ padding: '20px' }}>
          <div style={{ marginBottom: '12px', fontSize: '13px', color: '#888', fontWeight: 500 }}>
            Quick Actions:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {QUICK_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                onClick={() => useQuickPrompt(prompt.prompt)}
                style={{
                  padding: '12px',
                  background: '#2a2a2a',
                  border: '1px solid #3a3a3a',
                  borderRadius: '6px',
                  color: '#ccc',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '13px',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#323232';
                  e.currentTarget.style.borderColor = '#0e639c';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#2a2a2a';
                  e.currentTarget.style.borderColor = '#3a3a3a';
                }}
              >
                <span style={{ color: '#0e639c' }}>{prompt.icon}</span>
                <span>{prompt.label}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {messages.map((message, i) => {
          const isUser = message.role === 'user';
          const messageId = `${i}-${message.timestamp}`;
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isUser ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  maxWidth: '85%',
                  padding: '12px 14px',
                  background: isUser ? '#0e639c' : '#2a2a2a',
                  borderRadius: '12px',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  position: 'relative',
                }}
              >
                <div>{formatMessage(message.content)}</div>
                {!isUser && (
                  <button
                    onClick={() => copyMessage(message.content, messageId)}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: '#1a1a1a',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '4px',
                      cursor: 'pointer',
                      color: '#888',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    title="Copy"
                  >
                    {copiedId === messageId ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                )}
              </div>
              <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                {message.timestamp && new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          );
        })}
        {isLoading && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#888',
              fontSize: '13px',
            }}
          >
            <Sparkles size={16} className="pulse" />
            <span>Thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error Display */}
      {error && (
        <div
          style={{
            padding: '12px 20px',
            background: '#5a1d1d',
            borderTop: '1px solid #cd3131',
            color: '#f48771',
            fontSize: '13px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#f48771',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Input */}
      <div
        style={{
          padding: '16px 20px',
          borderTop: '1px solid #333',
          background: '#252525',
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !isLoading) {
                sendMessage();
              }
            }}
            placeholder="Ask anything..."
            disabled={isLoading || !hasApiKey}
            style={{
              flex: 1,
              padding: '10px 14px',
              background: '#3c3c3c',
              border: '1px solid #555',
              borderRadius: '6px',
              color: '#ccc',
              fontSize: '14px',
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={isLoading || !inputValue.trim() || !hasApiKey}
            style={{
              padding: '10px 16px',
              background: isLoading || !inputValue.trim() || !hasApiKey ? '#333' : '#0e639c',
              border: 'none',
              borderRadius: '6px',
              color: 'white',
              cursor: isLoading || !inputValue.trim() || !hasApiKey ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Send size={16} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .pulse {
          animation: pulse 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
