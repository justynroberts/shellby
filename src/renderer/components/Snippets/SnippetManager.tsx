import React, { useState, useEffect } from 'react';
import { Code, Search, Plus, Edit2, Trash2, Copy, Play, X, Save, Star } from 'lucide-react';
import { Snippet, DEFAULT_CATEGORIES } from '../../../shared/types/snippets';

interface SnippetManagerProps {
  onClose: () => void;
  onExecute?: (command: string) => void;
}

export const SnippetManager: React.FC<SnippetManagerProps> = ({ onClose, onExecute }) => {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [filteredSnippets, setFilteredSnippets] = useState<Snippet[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formCommand, setFormCommand] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('custom');

  useEffect(() => {
    loadSnippets();
  }, []);

  useEffect(() => {
    filterSnippets();
  }, [snippets, searchQuery, selectedCategory, showFavoritesOnly]);

  const loadSnippets = async () => {
    try {
      const result = await window.electron.snippets.getAll();
      if (result.success) {
        setSnippets(result.data);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const filterSnippets = () => {
    let filtered = snippets;
    if (showFavoritesOnly) {
      filtered = filtered.filter((s) => s.favorite === true);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.command.toLowerCase().includes(query) ||
          s.description?.toLowerCase().includes(query)
      );
    }
    if (selectedCategory) {
      filtered = filtered.filter((s) => s.category === selectedCategory);
    }
    setFilteredSnippets(filtered);
  };

  const handleCreateSnippet = async () => {
    try {
      const snippet = {
        name: formName,
        command: formCommand,
        description: formDescription,
        category: formCategory,
      };
      const result = await window.electron.snippets.create(snippet);
      if (result.success) {
        await loadSnippets();
        resetForm();
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateSnippet = async () => {
    if (!editingSnippet) return;
    try {
      const updates = {
        name: formName,
        command: formCommand,
        description: formDescription,
        category: formCategory,
      };
      const result = await window.electron.snippets.update(editingSnippet.id, updates);
      if (result.success) {
        await loadSnippets();
        resetForm();
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteSnippet = async (id: string) => {
    if (!confirm('Delete this snippet?')) return;
    try {
      await window.electron.snippets.delete(id);
      await loadSnippets();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleExecuteSnippet = async (snippet: Snippet) => {
    const variableMatches = snippet.command.match(/\{\{([A-Z_]+)\}\}/g);
    if (variableMatches && variableMatches.length > 0) {
      const values: Record<string, string> = {};
      for (const match of variableMatches) {
        const varName = match.slice(2, -2);
        const variable = snippet.variables?.find((v) => v.name === varName);
        const value = prompt(`${variable?.description || varName}:`, variable?.defaultValue || '');
        if (value === null) return;
        values[varName] = value;
      }
      let command = snippet.command;
      for (const [name, value] of Object.entries(values)) {
        command = command.replace(new RegExp(`\\{\\{${name}\\}\\}`, 'g'), value);
      }
      if (onExecute) onExecute(command);
    } else {
      if (onExecute) onExecute(snippet.command);
    }
    await window.electron.snippets.incrementUsage(snippet.id);
    await loadSnippets();
  };

  const handleToggleFavorite = async (id: string) => {
    try {
      await window.electron.snippets.toggleFavorite(id);
      await loadSnippets();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const startEdit = (snippet: Snippet) => {
    setEditingSnippet(snippet);
    setFormName(snippet.name);
    setFormCommand(snippet.command);
    setFormDescription(snippet.description || '');
    setFormCategory(snippet.category || 'custom');
    setIsCreating(false);
  };

  const resetForm = () => {
    setFormName('');
    setFormCommand('');
    setFormDescription('');
    setFormCategory('custom');
    setIsCreating(false);
    setEditingSnippet(null);
  };

  const getCategoryColor = (categoryId: string) => {
    return DEFAULT_CATEGORIES.find((c) => c.id === categoryId)?.color || '#6b7280';
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#1e1e1e',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 20px',
          borderBottom: '1px solid #333',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
          <Code size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Command Snippets
        </h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={() => {
              resetForm();
              setIsCreating(true);
            }}
            style={{
              padding: '4px 10px',
              backgroundColor: '#0e639c',
              border: 'none',
              borderRadius: '3px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Plus size={14} />
            New
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#999',
              fontSize: '20px',
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '8px 20px',
            backgroundColor: '#dc3545',
            color: 'white',
            fontSize: '12px',
          }}
        >
          {error}
          <button onClick={() => setError(null)} style={{ float: 'right', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>×</button>
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Sidebar */}
        <div style={{ width: '200px', borderRight: '1px solid #333', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '12px' }}>
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 8px',
                backgroundColor: '#252525',
                border: '1px solid #333',
                borderRadius: '3px',
                color: 'white',
                fontSize: '12px',
              }}
            />
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            <button
              onClick={() => {
                setSelectedCategory(null);
                setShowFavoritesOnly(false);
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: selectedCategory === null && !showFavoritesOnly ? '#252525' : 'transparent',
                border: 'none',
                color: '#ccc',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '12px',
              }}
            >
              All ({snippets.length})
            </button>
            <button
              onClick={() => {
                setSelectedCategory(null);
                setShowFavoritesOnly(true);
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: showFavoritesOnly ? '#252525' : 'transparent',
                border: 'none',
                color: '#ccc',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>
                <Star size={12} style={{ display: 'inline-block', marginRight: '6px', fill: '#ffd700', color: '#ffd700' }} />
                Favorites
              </span>
              <span style={{ color: '#666', fontSize: '11px' }}>
                {snippets.filter((s) => s.favorite).length}
              </span>
            </button>
            {DEFAULT_CATEGORIES.map((cat) => {
              const count = snippets.filter((s) => s.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setShowFavoritesOnly(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: selectedCategory === cat.id ? '#252525' : 'transparent',
                    border: 'none',
                    color: '#ccc',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>
                    <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: cat.color, marginRight: '6px' }} />
                    {cat.name}
                  </span>
                  <span style={{ color: '#666', fontSize: '11px' }}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {(isCreating || editingSnippet) ? (
            /* Edit Form - Compact */
            <div style={{ padding: '20px', overflow: 'auto' }}>
              <h3 style={{ marginTop: 0, fontSize: '14px' }}>{editingSnippet ? 'Edit Snippet' : 'Create Snippet'}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', color: '#999' }}>Name</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    style={{ width: '100%', padding: '6px', backgroundColor: '#252525', border: '1px solid #333', borderRadius: '3px', color: 'white', fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', color: '#999' }}>Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    style={{ width: '100%', padding: '6px', backgroundColor: '#252525', border: '1px solid #333', borderRadius: '3px', color: 'white', fontSize: '12px' }}
                  >
                    {DEFAULT_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', color: '#999' }}>Command</label>
                <textarea
                  value={formCommand}
                  onChange={(e) => setFormCommand(e.target.value)}
                  rows={3}
                  style={{ width: '100%', padding: '6px', backgroundColor: '#252525', border: '1px solid #333', borderRadius: '3px', color: 'white', fontSize: '12px', fontFamily: 'monospace' }}
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', color: '#999' }}>Description</label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  style={{ width: '100%', padding: '6px', backgroundColor: '#252525', border: '1px solid #333', borderRadius: '3px', color: 'white', fontSize: '12px' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={editingSnippet ? handleUpdateSnippet : handleCreateSnippet}
                  disabled={!formName || !formCommand}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: formName && formCommand ? '#0e639c' : '#333',
                    border: 'none',
                    borderRadius: '3px',
                    color: 'white',
                    cursor: formName && formCommand ? 'pointer' : 'not-allowed',
                    fontSize: '12px',
                  }}
                >
                  <Save size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                  {editingSnippet ? 'Update' : 'Create'}
                </button>
                <button
                  onClick={resetForm}
                  style={{ padding: '6px 12px', backgroundColor: '#333', border: 'none', borderRadius: '3px', color: 'white', cursor: 'pointer', fontSize: '12px' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* Data Table */
            <div style={{ flex: 1, overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead style={{ position: 'sticky', top: 0, backgroundColor: '#252525', zIndex: 1 }}>
                  <tr>
                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #333', fontWeight: 600 }}>Category</th>
                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #333', fontWeight: 600 }}>Name</th>
                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #333', fontWeight: 600 }}>Command</th>
                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #333', fontWeight: 600 }}>Description</th>
                    <th style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #333', fontWeight: 600, width: '170px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSnippets.map((snippet) => (
                    <tr key={snippet.id} style={{ borderBottom: '1px solid #2a2a2a' }}>
                      <td style={{ padding: '8px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 6px',
                            borderRadius: '3px',
                            fontSize: '10px',
                            backgroundColor: `${getCategoryColor(snippet.category || 'custom')}22`,
                            color: getCategoryColor(snippet.category || 'custom'),
                            border: `1px solid ${getCategoryColor(snippet.category || 'custom')}`,
                          }}
                        >
                          {DEFAULT_CATEGORIES.find((c) => c.id === snippet.category)?.name || 'Custom'}
                        </span>
                      </td>
                      <td style={{ padding: '8px', color: '#ccc' }}>{snippet.name}</td>
                      <td style={{ padding: '8px', fontFamily: 'monospace', fontSize: '11px', color: '#a9b7c6', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {snippet.command}
                      </td>
                      <td style={{ padding: '8px', color: '#999', fontSize: '11px' }}>{snippet.description || '-'}</td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleToggleFavorite(snippet.id)}
                            style={{
                              padding: '4px',
                              backgroundColor: snippet.favorite ? '#ffd70022' : '#333',
                              border: snippet.favorite ? '1px solid #ffd700' : 'none',
                              borderRadius: '3px',
                              color: snippet.favorite ? '#ffd700' : 'white',
                              cursor: 'pointer',
                            }}
                            title={snippet.favorite ? 'Remove from favorites' : 'Add to favorites'}
                          >
                            <Star size={12} fill={snippet.favorite ? '#ffd700' : 'none'} />
                          </button>
                          <button
                            onClick={() => handleExecuteSnippet(snippet)}
                            style={{ padding: '4px', backgroundColor: '#0e639c', border: 'none', borderRadius: '3px', color: 'white', cursor: 'pointer' }}
                            title="Execute"
                          >
                            <Play size={12} />
                          </button>
                          <button
                            onClick={() => navigator.clipboard.writeText(snippet.command)}
                            style={{ padding: '4px', backgroundColor: '#333', border: 'none', borderRadius: '3px', color: 'white', cursor: 'pointer' }}
                            title="Copy"
                          >
                            <Copy size={12} />
                          </button>
                          <button
                            onClick={() => startEdit(snippet)}
                            style={{ padding: '4px', backgroundColor: '#333', border: 'none', borderRadius: '3px', color: 'white', cursor: 'pointer' }}
                            title="Edit"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteSnippet(snippet.id)}
                            style={{ padding: '4px', backgroundColor: '#dc3545', border: 'none', borderRadius: '3px', color: 'white', cursor: 'pointer' }}
                            title="Delete"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredSnippets.length === 0 && (
                <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                  <Code size={48} style={{ marginBottom: '12px', opacity: 0.3 }} />
                  <p>No snippets found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
