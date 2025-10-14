import Store from 'electron-store';
import { v4 as uuidv4 } from 'uuid';
import { Snippet, DEFAULT_SNIPPETS } from '../../../shared/types/snippets';

export class SnippetManager {
  private store: Store;

  constructor() {
    this.store = new Store({
      name: 'snippets',
      defaults: {
        snippets: [],
      },
    });
    this.initializeDefaultSnippets();
  }

  private initializeDefaultSnippets(): void {
    const snippets = this.getSnippets();
    if (snippets.length === 0) {
      // Add default snippets on first run
      DEFAULT_SNIPPETS.forEach((snippet) => {
        this.createSnippet(snippet);
      });
    } else {
      // Merge new default snippets that don't exist yet
      DEFAULT_SNIPPETS.forEach((defaultSnippet) => {
        const exists = snippets.some(
          (s) => s.name === defaultSnippet.name && s.command === defaultSnippet.command
        );
        if (!exists) {
          this.createSnippet(defaultSnippet);
        }
      });
    }
  }

  getSnippets(): Snippet[] {
    return this.store.get('snippets', []) as Snippet[];
  }

  getSnippet(id: string): Snippet | null {
    const snippets = this.getSnippets();
    return snippets.find((s) => s.id === id) || null;
  }

  createSnippet(
    snippet: Omit<Snippet, 'id' | 'createdAt' | 'updatedAt'>
  ): Snippet {
    const now = new Date();
    const newSnippet: Snippet = {
      ...snippet,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
      usageCount: 0,
    };
    const snippets = this.getSnippets();
    snippets.push(newSnippet);
    this.store.set('snippets', snippets);
    return newSnippet;
  }

  updateSnippet(
    id: string,
    updates: Partial<Omit<Snippet, 'id' | 'createdAt' | 'updatedAt'>>
  ): Snippet | null {
    const snippets = this.getSnippets();
    const index = snippets.findIndex((s) => s.id === id);
    if (index === -1) return null;

    const updatedSnippet = {
      ...snippets[index],
      ...updates,
      updatedAt: new Date(),
    };
    snippets[index] = updatedSnippet;
    this.store.set('snippets', snippets);
    return updatedSnippet;
  }

  deleteSnippet(id: string): boolean {
    const snippets = this.getSnippets();
    const filtered = snippets.filter((s) => s.id !== id);
    if (filtered.length === snippets.length) return false;
    this.store.set('snippets', filtered);
    return true;
  }

  incrementUsage(id: string): void {
    const snippet = this.getSnippet(id);
    if (snippet) {
      this.updateSnippet(id, {
        usageCount: (snippet.usageCount || 0) + 1,
      });
    }
  }

  searchSnippets(query: string): Snippet[] {
    const snippets = this.getSnippets();
    const lowerQuery = query.toLowerCase();
    return snippets.filter(
      (s) =>
        s.name.toLowerCase().includes(lowerQuery) ||
        s.command.toLowerCase().includes(lowerQuery) ||
        s.description?.toLowerCase().includes(lowerQuery) ||
        s.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
  }

  getSnippetsByCategory(category: string): Snippet[] {
    const snippets = this.getSnippets();
    return snippets.filter((s) => s.category === category);
  }

  getMostUsed(limit: number = 10): Snippet[] {
    const snippets = this.getSnippets();
    return snippets
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
      .slice(0, limit);
  }

  toggleFavorite(id: string): Snippet | null {
    const snippet = this.getSnippet(id);
    if (!snippet) return null;
    return this.updateSnippet(id, {
      favorite: !snippet.favorite,
    });
  }

  getFavorites(): Snippet[] {
    const snippets = this.getSnippets();
    return snippets.filter((s) => s.favorite === true);
  }
}
