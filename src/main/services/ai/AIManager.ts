import OpenAI from 'openai';
import Store from 'electron-store';
import { Logger } from '../../utils/logger';
import { AISettings, AIMessage, AIResponse, DEFAULT_AI_SETTINGS } from '../../../shared/types/ai';
import fetch from 'node:fetch';

export class AIManager {
  private logger: Logger;
  private store: Store;
  private client: OpenAI | null = null;

  constructor() {
    this.logger = new Logger('AIManager');
    this.store = new Store({ name: 'ai-settings' });
  }

  /**
   * Initialize OpenAI-compatible client with current settings
   */
  private initializeClient(): void {
    const settings = this.getSettings();

    // For Ollama, we don't need an API key
    if (settings.provider !== 'ollama' && !settings.apiKey) {
      throw new Error('API key not configured. Please add your API key in AI Settings.');
    }

    const clientConfig: any = {
      baseURL: settings.baseURL || this.getDefaultBaseURL(settings.provider),
      apiKey: settings.apiKey || 'ollama', // Ollama doesn't require a key but the client needs something
    };

    // Add headers for non-Ollama providers
    if (settings.provider !== 'ollama') {
      clientConfig.defaultHeaders = {
        'HTTP-Referer': 'https://github.com/shelby-terminal',
        'X-Title': 'Shelby Terminal',
      };
    }

    this.client = new OpenAI(clientConfig);

    this.logger.info('AI client initialized:', { provider: settings.provider, model: settings.model });
  }

  /**
   * Get default base URL for provider
   */
  private getDefaultBaseURL(provider: string): string {
    switch (provider) {
      case 'ollama':
        return 'http://localhost:11434/v1';
      case 'claude':
        return 'https://api.anthropic.com/v1';
      case 'openai':
        return 'https://api.openai.com/v1';
      default:
        return 'http://localhost:11434/v1';
    }
  }

  /**
   * Fetch available Ollama models from local instance
   */
  async getOllamaModels(): Promise<Array<{ id: string; name: string; size: number }>> {
    try {
      const settings = this.getSettings();
      const baseURL = settings.baseURL?.replace('/v1', '') || 'http://localhost:11434';

      const response = await fetch(`${baseURL}/api/tags`);
      if (!response.ok) {
        throw new Error(`Ollama API returned ${response.status}`);
      }

      const data: any = await response.json();
      const models = data.models || [];

      return models.map((model: any) => ({
        id: model.name,
        name: model.name,
        size: model.size || 0,
      }));
    } catch (error: any) {
      this.logger.error('Failed to fetch Ollama models:', error);
      throw new Error(`Failed to connect to Ollama: ${error.message}`);
    }
  }

  /**
   * Get AI settings
   */
  getSettings(): AISettings {
    const stored = this.store.get('settings') as AISettings | undefined;
    return {
      ...DEFAULT_AI_SETTINGS,
      ...stored,
    };
  }

  /**
   * Update AI settings
   */
  updateSettings(settings: Partial<AISettings>): void {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    this.store.set('settings', updated);

    // Reinitialize client if API key or baseURL changed
    if (settings.apiKey || settings.baseURL) {
      this.client = null;
    }

    this.logger.info('AI settings updated');
  }

  /**
   * Generate command from natural language
   */
  async generateCommand(prompt: string, context?: string): Promise<string> {
    if (!this.client) {
      this.initializeClient();
    }

    const settings = this.getSettings();
    const systemPrompt = `You are a helpful SSH terminal assistant. Generate shell commands based on user requests.

Rules:
- Return ONLY the command, no explanations
- Use common Unix/Linux commands
- Prefer safe, non-destructive commands
- If the request is unclear, ask for clarification
${context ? `\n\nCurrent context:\n${context}` : ''}`;

    try {
      const completion = await this.client!.chat.completions.create({
        model: settings.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3, // Lower temperature for more precise commands
        max_tokens: 200,
      });

      const command = completion.choices[0]?.message?.content?.trim() || '';
      this.logger.info('Generated command:', command);
      return command;
    } catch (error: any) {
      this.logger.error('Command generation failed:', error);
      throw new Error(`AI Error: ${error.message}`);
    }
  }

  /**
   * Explain error or terminal output
   */
  async explainError(errorText: string, context?: string): Promise<string> {
    if (!this.client) {
      this.initializeClient();
    }

    const settings = this.getSettings();
    const systemPrompt = `You are a helpful SSH terminal assistant. Explain terminal errors and suggest fixes.

Rules:
- Be concise but helpful
- Explain what went wrong
- Suggest 1-2 ways to fix it
- Use simple language
${context ? `\n\nCurrent context:\n${context}` : ''}`;

    try {
      const completion = await this.client!.chat.completions.create({
        model: settings.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Explain this error:\n\n${errorText}` },
        ],
        temperature: 0.5,
        max_tokens: 500,
      });

      const explanation = completion.choices[0]?.message?.content?.trim() || '';
      this.logger.info('Generated explanation');
      return explanation;
    } catch (error: any) {
      this.logger.error('Error explanation failed:', error);
      throw new Error(`AI Error: ${error.message}`);
    }
  }

  /**
   * Analyze logs
   */
  async analyzeLogs(logs: string, question?: string): Promise<string> {
    if (!this.client) {
      this.initializeClient();
    }

    const settings = this.getSettings();
    const systemPrompt = `You are a helpful SSH terminal assistant. Analyze log files and identify issues.

Rules:
- Identify errors, warnings, and anomalies
- Explain what they mean
- Suggest solutions
- Be concise but thorough`;

    const userPrompt = question
      ? `${question}\n\nLogs:\n${logs}`
      : `Analyze these logs and identify any issues:\n\n${logs}`;

    try {
      const completion = await this.client!.chat.completions.create({
        model: settings.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.5,
        max_tokens: 1000,
      });

      const analysis = completion.choices[0]?.message?.content?.trim() || '';
      this.logger.info('Generated log analysis');
      return analysis;
    } catch (error: any) {
      this.logger.error('Log analysis failed:', error);
      throw new Error(`AI Error: ${error.message}`);
    }
  }

  /**
   * Chat with AI (general conversation)
   */
  async chat(messages: AIMessage[], context?: string): Promise<AIResponse> {
    if (!this.client) {
      this.initializeClient();
    }

    const settings = this.getSettings();
    const systemPrompt = `You are Shelby, a helpful SSH terminal assistant built into the Shelby terminal application.

Your capabilities:
- Generate shell commands from natural language
- Explain errors and suggest fixes
- Analyze logs and identify issues
- Help with Linux/Unix system administration
- Provide scripting assistance (bash, python, etc.)
- Troubleshoot network, file system, and process issues

Be helpful, concise, and accurate. Format code blocks with \`\`\` when appropriate.
${context ? `\n\nCurrent context:\n${context}` : ''}`;

    try {
      const completion = await this.client!.chat.completions.create({
        model: settings.model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ],
        temperature: settings.temperature,
        max_tokens: settings.maxTokens,
      });

      const response: AIResponse = {
        content: completion.choices[0]?.message?.content?.trim() || '',
        model: completion.model,
        usage: completion.usage ? {
          promptTokens: completion.usage.prompt_tokens,
          completionTokens: completion.usage.completion_tokens,
          totalTokens: completion.usage.total_tokens,
        } : undefined,
      };

      this.logger.info('Chat response generated');
      return response;
    } catch (error: any) {
      this.logger.error('Chat failed:', error);
      throw new Error(`AI Error: ${error.message}`);
    }
  }

  /**
   * Generate script from task description
   */
  async generateScript(task: string, language: 'bash' | 'python' = 'bash'): Promise<string> {
    if (!this.client) {
      this.initializeClient();
    }

    const settings = this.getSettings();
    const systemPrompt = `You are a helpful script generation assistant. Generate ${language} scripts based on task descriptions.

Rules:
- Write clean, well-commented code
- Include error handling
- Use best practices
- Return ONLY the script code, no additional explanation
- Start with appropriate shebang (#!/bin/bash or #!/usr/bin/env python3)`;

    try {
      const completion = await this.client!.chat.completions.create({
        model: settings.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Task: ${task}\n\nGenerate a ${language} script to accomplish this.` },
        ],
        temperature: 0.4,
        max_tokens: 2000,
      });

      const script = completion.choices[0]?.message?.content?.trim() || '';
      this.logger.info('Generated script');
      return script;
    } catch (error: any) {
      this.logger.error('Script generation failed:', error);
      throw new Error(`AI Error: ${error.message}`);
    }
  }
}
