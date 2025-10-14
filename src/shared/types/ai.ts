export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

export interface AIConversation {
  id: string;
  messages: AIMessage[];
  context?: string; // Terminal context
  createdAt: Date;
}

export type AIProvider = 'ollama' | 'claude' | 'openai';

export interface AISettings {
  provider: AIProvider;
  apiKey?: string;
  model: string;
  baseURL?: string;
  maxTokens: number;
  temperature: number;
}

export interface AIResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface CommandSuggestion {
  command: string;
  description: string;
  category: 'file' | 'network' | 'system' | 'process' | 'text' | 'other';
  confidence: number;
}

export interface AICapability {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const AI_MODELS = {
  ollama: [
    { id: 'llama3.2', name: 'Llama 3.2', provider: 'ollama' },
    { id: 'llama3.1', name: 'Llama 3.1', provider: 'ollama' },
    { id: 'llama3', name: 'Llama 3', provider: 'ollama' },
    { id: 'mistral', name: 'Mistral', provider: 'ollama' },
    { id: 'codellama', name: 'Code Llama', provider: 'ollama' },
    { id: 'phi3', name: 'Phi-3', provider: 'ollama' },
  ],
  claude: [
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'claude' },
    { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', provider: 'claude' },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'claude' },
    { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', provider: 'claude' },
    { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', provider: 'claude' },
  ],
  openai: [
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai' },
    { id: 'gpt-4', name: 'GPT-4', provider: 'openai' },
    { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai' },
  ],
};

export const DEFAULT_AI_SETTINGS: AISettings = {
  provider: 'ollama',
  model: 'llama3.2',
  baseURL: 'http://localhost:11434',
  maxTokens: 4096,
  temperature: 0.7,
};
