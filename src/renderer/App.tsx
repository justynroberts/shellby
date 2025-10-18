import React, { useState, useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import {
  Server,
  Edit2,
  Trash2,
  Plus,
  Settings,
  X,
  Save,
  Upload,
  Download,
  Clipboard,
  Tv,
  Copy,
  Search,
  PawPrint,
  HardDrive,
  Bot,
  Code,
  CornerDownLeft,
  Files,
  Database,
  Cloud,
  Lock,
  Zap,
  Package,
  Boxes,
  Container,
  Globe,
  Wifi,
  Shield,
  Terminal as TerminalIcon,
  Laptop,
  MonitorDot,
  type LucideIcon
} from 'lucide-react';
import '@xterm/xterm/css/xterm.css';
import { FileManager } from './components/FileManager';
import { AIAssistant } from './components/AIAssistant';
import { SnippetManager } from './components/Snippets';

// Best monospace fonts for terminals (macOS defaults first)
const TERMINAL_FONTS = [
  { name: 'Monaco', value: 'Monaco, monospace' },
  { name: 'Menlo', value: 'Menlo, monospace' },
  { name: 'SF Mono', value: '"SF Mono", monospace' },
  { name: 'Courier New', value: '"Courier New", monospace' },
  { name: 'Courier', value: 'Courier, monospace' },
  { name: 'Andale Mono', value: '"Andale Mono", monospace' },
  { name: 'Fira Code', value: '"Fira Code", Monaco, monospace' },
  { name: 'JetBrains Mono', value: '"JetBrains Mono", Menlo, monospace' },
  { name: 'Cascadia Code', value: '"Cascadia Code", Monaco, monospace' },
  { name: 'Consolas', value: 'Consolas, Monaco, monospace' },
  { name: 'Inconsolata', value: 'Inconsolata, Monaco, monospace' },
  { name: 'Source Code Pro', value: '"Source Code Pro", Menlo, monospace' },
  { name: 'Source Code Pro Powerline', value: '"Source Code Pro for Powerline", "Source Code Pro", monospace' },
  { name: 'Fira Mono Powerline', value: '"Fira Mono for Powerline", "Fira Mono", monospace' },
  { name: 'Roboto Mono Powerline', value: '"Roboto Mono for Powerline", "Roboto Mono", monospace' },
  { name: 'Space Mono Powerline', value: '"Space Mono for Powerline", "Space Mono", monospace' },
  { name: 'Ubuntu Mono Powerline', value: '"Ubuntu Mono derivative Powerline", "Ubuntu Mono", monospace' },
  { name: 'DejaVu Sans Mono Powerline', value: '"DejaVu Sans Mono for Powerline", "DejaVu Sans Mono", monospace' },
  { name: 'FiraCode Nerd Font', value: '"FiraCodeNerdFont-Regular", "Fira Code", monospace' },
  { name: 'JetBrainsMono Nerd Font', value: '"JetBrainsMonoNerdFont-Regular", "JetBrains Mono", monospace' },
  { name: 'MesloLGS Nerd Font', value: '"MesloLGSNerdFont-Regular", "Menlo", monospace' },
  { name: 'SauceCodePro Nerd Font', value: '"SauceCodeProNerdFont-Regular", "Source Code Pro", monospace' },
  { name: 'RobotoMono Nerd Font', value: '"RobotoMonoNerdFont-Regular", "Roboto Mono", monospace' },
  { name: 'UbuntuMono Nerd Font', value: '"UbuntuMonoNerdFont-Regular", "Ubuntu Mono", monospace' },
];

const TERMINAL_THEMES = {
  'vscode-dark': {
    name: 'VS Code Dark',
    background: '#1e1e1e',
    foreground: '#cccccc',
    cursor: '#ffffff',
    black: '#000000',
    red: '#cd3131',
    green: '#0dbc79',
    yellow: '#e5e510',
    blue: '#2472c8',
    magenta: '#bc3fbc',
    cyan: '#11a8cd',
    white: '#e5e5e5',
    brightBlack: '#666666',
    brightRed: '#f14c4c',
    brightGreen: '#23d18b',
    brightYellow: '#f5f543',
    brightBlue: '#3b8eea',
    brightMagenta: '#d670d6',
    brightCyan: '#29b8db',
    brightWhite: '#ffffff',
  },
  'dracula': {
    name: 'Dracula',
    background: '#282a36',
    foreground: '#f8f8f2',
    cursor: '#f8f8f2',
    black: '#21222c',
    red: '#ff5555',
    green: '#50fa7b',
    yellow: '#f1fa8c',
    blue: '#bd93f9',
    magenta: '#ff79c6',
    cyan: '#8be9fd',
    white: '#f8f8f2',
    brightBlack: '#6272a4',
    brightRed: '#ff6e6e',
    brightGreen: '#69ff94',
    brightYellow: '#ffffa5',
    brightBlue: '#d6acff',
    brightMagenta: '#ff92df',
    brightCyan: '#a4ffff',
    brightWhite: '#ffffff',
  },
  'monokai': {
    name: 'Monokai',
    background: '#272822',
    foreground: '#f8f8f2',
    cursor: '#f8f8f0',
    black: '#272822',
    red: '#f92672',
    green: '#a6e22e',
    yellow: '#f4bf75',
    blue: '#66d9ef',
    magenta: '#ae81ff',
    cyan: '#a1efe4',
    white: '#f8f8f2',
    brightBlack: '#75715e',
    brightRed: '#f92672',
    brightGreen: '#a6e22e',
    brightYellow: '#f4bf75',
    brightBlue: '#66d9ef',
    brightMagenta: '#ae81ff',
    brightCyan: '#a1efe4',
    brightWhite: '#f9f8f5',
  },
  'nord': {
    name: 'Nord',
    background: '#2e3440',
    foreground: '#d8dee9',
    cursor: '#d8dee9',
    black: '#3b4252',
    red: '#bf616a',
    green: '#a3be8c',
    yellow: '#ebcb8b',
    blue: '#81a1c1',
    magenta: '#b48ead',
    cyan: '#88c0d0',
    white: '#e5e9f0',
    brightBlack: '#4c566a',
    brightRed: '#bf616a',
    brightGreen: '#a3be8c',
    brightYellow: '#ebcb8b',
    brightBlue: '#81a1c1',
    brightMagenta: '#b48ead',
    brightCyan: '#8fbcbb',
    brightWhite: '#eceff4',
  },
  'solarized-dark': {
    name: 'Solarized Dark',
    background: '#002b36',
    foreground: '#839496',
    cursor: '#839496',
    black: '#073642',
    red: '#dc322f',
    green: '#859900',
    yellow: '#b58900',
    blue: '#268bd2',
    magenta: '#d33682',
    cyan: '#2aa198',
    white: '#eee8d5',
    brightBlack: '#002b36',
    brightRed: '#cb4b16',
    brightGreen: '#586e75',
    brightYellow: '#657b83',
    brightBlue: '#839496',
    brightMagenta: '#6c71c4',
    brightCyan: '#93a1a1',
    brightWhite: '#fdf6e3',
  },
  'solarized-light': {
    name: 'Solarized Light',
    background: '#fdf6e3',
    foreground: '#657b83',
    cursor: '#657b83',
    black: '#073642',
    red: '#dc322f',
    green: '#859900',
    yellow: '#b58900',
    blue: '#268bd2',
    magenta: '#d33682',
    cyan: '#2aa198',
    white: '#eee8d5',
    brightBlack: '#002b36',
    brightRed: '#cb4b16',
    brightGreen: '#586e75',
    brightYellow: '#657b83',
    brightBlue: '#839496',
    brightMagenta: '#6c71c4',
    brightCyan: '#93a1a1',
    brightWhite: '#fdf6e3',
  },
  'github-light': {
    name: 'GitHub Light',
    background: '#ffffff',
    foreground: '#24292f',
    cursor: '#044289',
    black: '#24292f',
    red: '#cf222e',
    green: '#116329',
    yellow: '#4d2d00',
    blue: '#0969da',
    magenta: '#8250df',
    cyan: '#1b7c83',
    white: '#6e7781',
    brightBlack: '#57606a',
    brightRed: '#a40e26',
    brightGreen: '#1a7f37',
    brightYellow: '#633c01',
    brightBlue: '#218bff',
    brightMagenta: '#a475f9',
    brightCyan: '#3192aa',
    brightWhite: '#8c959f',
  },
  'one-light': {
    name: 'One Light',
    background: '#fafafa',
    foreground: '#383a42',
    cursor: '#526eff',
    black: '#383a42',
    red: '#e45649',
    green: '#50a14f',
    yellow: '#c18401',
    blue: '#4078f2',
    magenta: '#a626a4',
    cyan: '#0184bc',
    white: '#fafafa',
    brightBlack: '#4f525e',
    brightRed: '#e06c75',
    brightGreen: '#98c379',
    brightYellow: '#e5c07b',
    brightBlue: '#61afef',
    brightMagenta: '#c678dd',
    brightCyan: '#56b6c2',
    brightWhite: '#ffffff',
  },
  'gruvbox-light': {
    name: 'Gruvbox Light',
    background: '#fbf1c7',
    foreground: '#3c3836',
    cursor: '#3c3836',
    black: '#fbf1c7',
    red: '#cc241d',
    green: '#98971a',
    yellow: '#d79921',
    blue: '#458588',
    magenta: '#b16286',
    cyan: '#689d6a',
    white: '#7c6f64',
    brightBlack: '#928374',
    brightRed: '#9d0006',
    brightGreen: '#79740e',
    brightYellow: '#b57614',
    brightBlue: '#076678',
    brightMagenta: '#8f3f71',
    brightCyan: '#427b58',
    brightWhite: '#3c3836',
  },
  'gruvbox-dark': {
    name: 'Gruvbox Dark',
    background: '#282828',
    foreground: '#ebdbb2',
    cursor: '#ebdbb2',
    black: '#282828',
    red: '#cc241d',
    green: '#98971a',
    yellow: '#d79921',
    blue: '#458588',
    magenta: '#b16286',
    cyan: '#689d6a',
    white: '#a89984',
    brightBlack: '#928374',
    brightRed: '#fb4934',
    brightGreen: '#b8bb26',
    brightYellow: '#fabd2f',
    brightBlue: '#83a598',
    brightMagenta: '#d3869b',
    brightCyan: '#8ec07c',
    brightWhite: '#ebdbb2',
  },
  'tokyo-night': {
    name: 'Tokyo Night',
    background: '#1a1b26',
    foreground: '#a9b1d6',
    cursor: '#c0caf5',
    black: '#15161e',
    red: '#f7768e',
    green: '#9ece6a',
    yellow: '#e0af68',
    blue: '#7aa2f7',
    magenta: '#bb9af7',
    cyan: '#7dcfff',
    white: '#a9b1d6',
    brightBlack: '#414868',
    brightRed: '#f7768e',
    brightGreen: '#9ece6a',
    brightYellow: '#e0af68',
    brightBlue: '#7aa2f7',
    brightMagenta: '#bb9af7',
    brightCyan: '#7dcfff',
    brightWhite: '#c0caf5',
  },
  'catppuccin': {
    name: 'Catppuccin',
    background: '#1e1e2e',
    foreground: '#cdd6f4',
    cursor: '#f5e0dc',
    black: '#45475a',
    red: '#f38ba8',
    green: '#a6e3a1',
    yellow: '#f9e2af',
    blue: '#89b4fa',
    magenta: '#f5c2e7',
    cyan: '#94e2d5',
    white: '#bac2de',
    brightBlack: '#585b70',
    brightRed: '#f38ba8',
    brightGreen: '#a6e3a1',
    brightYellow: '#f9e2af',
    brightBlue: '#89b4fa',
    brightMagenta: '#f5c2e7',
    brightCyan: '#94e2d5',
    brightWhite: '#a6adc8',
  },
};

const PROFILE_COLORS = [
  '#0e639c', '#cd3131', '#0dbc79', '#bc3fbc', '#e5e510',
  '#2472c8', '#11a8cd', '#f14c4c', '#d670d6', '#23d18b'
];

const PROFILE_ICONS: Record<string, { icon: LucideIcon; name: string }> = {
  server: { icon: Server, name: 'Server' },
  database: { icon: Database, name: 'Database' },
  cloud: { icon: Cloud, name: 'Cloud' },
  terminal: { icon: TerminalIcon, name: 'Terminal' },
  laptop: { icon: Laptop, name: 'Laptop' },
  monitor: { icon: MonitorDot, name: 'Monitor' },
  globe: { icon: Globe, name: 'Globe' },
  wifi: { icon: Wifi, name: 'WiFi' },
  shield: { icon: Shield, name: 'Shield' },
  lock: { icon: Lock, name: 'Lock' },
  zap: { icon: Zap, name: 'Zap' },
  package: { icon: Package, name: 'Package' },
  boxes: { icon: Boxes, name: 'Boxes' },
  container: { icon: Container, name: 'Container' },
  harddrive: { icon: HardDrive, name: 'HardDrive' },
  bot: { icon: Bot, name: 'Bot' },
  code: { icon: Code, name: 'Code' },
  files: { icon: Files, name: 'Files' },
};

interface TerminalTab {
  id: string;
  sessionId: string;
  profileName: string;
  profileHost: string;
  terminalRef: HTMLDivElement | null;
  xtermInstance: Terminal | null;
  fitAddon: FitAddon | null;
}

export const App: React.FC = () => {
  // Multi-tab terminal state
  const [tabs, setTabs] = useState<TerminalTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  // Legacy state for compatibility
  const [connected, setConnected] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Profile management state
  const [profiles, setProfiles] = useState<any[]>([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<any>(null);

  // Terminal settings state
  const [showTerminalSettings, setShowTerminalSettings] = useState(false);
  const [terminalFont, setTerminalFont] = useState('Monaco, monospace');
  const [terminalFontSize, setTerminalFontSize] = useState(14);
  const [terminalTheme, setTerminalTheme] = useState('vscode-dark');
  const [vhsMode, setVhsMode] = useState<'off' | 'blue' | 'amber' | 'green' | 'matrix'>('off');

  // Clipboard state
  const [showClipboard, setShowClipboard] = useState(false);
  const [clipboardHistory, setClipboardHistory] = useState<any[]>([]);
  const [clipboardSearchQuery, setClipboardSearchQuery] = useState('');

  // File Manager state
  const [showFileManager, setShowFileManager] = useState(false);

  // AI Assistant state
  const [showAI, setShowAI] = useState(false);

  // Snippet Manager state
  const [showSnippets, setShowSnippets] = useState(false);

  // Profile form state
  const [profileName, setProfileName] = useState('');
  const [profileHost, setProfileHost] = useState('');
  const [profilePort, setProfilePort] = useState('22');
  const [profileUsername, setProfileUsername] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileColor, setProfileColor] = useState(PROFILE_COLORS[0]);
  const [profileIcon, setProfileIcon] = useState('server');
  const [profileAuthMethod, setProfileAuthMethod] = useState<'password' | 'publickey'>('password');
  const [profilePrivateKey, setProfilePrivateKey] = useState('');
  const [profilePassphrase, setProfilePassphrase] = useState('');
  const [profileTags, setProfileTags] = useState<string[]>([]);
  const [profileTagInput, setProfileTagInput] = useState('');

  // Terminal refs (legacy - still used for some operations)
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  // Computed values
  const activeTab = tabs.find(tab => tab.id === activeTabId);
  const hasConnections = tabs.length > 0;

  // Load profiles on mount
  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const response = await window.electron.connections.list();
      if (response.success) {
        setProfiles(response.data || []);
      }
    } catch (err) {
      console.error('Failed to load profiles:', err);
    }
  };

  const handleExportProfiles = async () => {
    try {
      const response = await window.electron.connections.exportProfiles(profiles);
      if (response.success) {
        setError(`Successfully exported ${response.data.count} connection(s)`);
        setTimeout(() => setError(null), 3000);
      } else if (response.error !== 'Cancelled') {
        setError(`Export failed: ${response.error}`);
      }
    } catch (err: any) {
      setError(`Export failed: ${err.message}`);
    }
  };

  const handleImportProfiles = async () => {
    try {
      const response = await window.electron.connections.importProfiles();
      if (response.success && response.data) {
        const importedProfiles = response.data;
        let savedCount = 0;

        for (const profile of importedProfiles) {
          try {
            // Remove id so it creates new profiles instead of overwriting
            const { id, ...profileWithoutId } = profile;
            const saveResponse = await window.electron.connections.save(profileWithoutId);
            if (saveResponse.success) {
              savedCount++;
            }
          } catch (err) {
            console.error('Failed to save profile:', err);
          }
        }

        if (savedCount > 0) {
          await loadProfiles();
          setError(`Successfully imported ${savedCount} connection(s)`);
          setTimeout(() => setError(null), 3000);
        }
      } else if (response.error !== 'Cancelled') {
        setError(`Import failed: ${response.error}`);
      }
    } catch (err: any) {
      setError(`Import failed: ${err.message}`);
    }
  };

  // Tab management functions
  const createNewTab = (sessionId: string, profileName: string, profileHost: string): string => {
    const tabId = `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newTab: TerminalTab = {
      id: tabId,
      sessionId,
      profileName,
      profileHost,
      terminalRef: null,
      xtermInstance: null,
      fitAddon: null,
    };

    setTabs(prev => [...prev, newTab]);
    setActiveTabId(tabId);
    setConnected(true);
    setSessionId(sessionId);

    return tabId;
  };

  const closeTab = async (tabId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    const tab = tabs.find(t => t.id === tabId);
    if (!tab) return;

    // Disconnect the session
    try {
      await window.electron.ssh.disconnect(tab.sessionId);
    } catch (err) {
      console.error('Error disconnecting tab:', err);
    }

    // Dispose terminal
    if (tab.xtermInstance) {
      tab.xtermInstance.dispose();
    }

    // Remove tab from array
    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== tabId);

      // If we closed the active tab, switch to another
      if (activeTabId === tabId) {
        if (newTabs.length > 0) {
          const newActiveTab = newTabs[newTabs.length - 1];
          setActiveTabId(newActiveTab.id);
          setSessionId(newActiveTab.sessionId);
        } else {
          setActiveTabId(null);
          setSessionId(null);
          setConnected(false);
        }
      }

      return newTabs;
    });
  };

  const switchToTab = (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab) {
      setActiveTabId(tabId);
      setSessionId(tab.sessionId);
      setConnected(true);

      // Refit terminal when switching
      setTimeout(() => {
        if (tab.fitAddon && tab.xtermInstance) {
          tab.fitAddon.fit();
          window.electron.ssh.resize(tab.sessionId, tab.xtermInstance.cols, tab.xtermInstance.rows);
        }
      }, 50);
    }
  };

  const handleConnectWithProfile = async (profile: any) => {
    setConnecting(true);
    setError(null);

    try {
      const config: any = {
        host: profile.host,
        port: profile.port || 22,
        username: profile.username,
        authMethod: profile.authMethod || 'password',
      };

      if (profile.authMethod === 'publickey' || profile.authMethod === 'certificate') {
        if (profile.privateKeyContent) {
          config.privateKey = profile.privateKeyContent;
        }
        if (profile.passphrase) {
          config.passphrase = profile.passphrase;
        }
      } else {
        config.password = profile.password;
      }

      const response = await window.electron.ssh.connect(config);

      if (response.success) {
        // Create a new tab for this connection
        const profileName = profile.name || `${profile.username}@${profile.host}`;
        createNewTab(response.data, profileName, profile.host);
      } else {
        setError(response.error || 'Connection failed');
      }
    } catch (err: any) {
      setError(err.message || 'Connection failed');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (activeTabId) {
      await closeTab(activeTabId);
    }
  };

  const openProfileModal = (profile?: any) => {
    if (profile) {
      setEditingProfile(profile);
      setProfileName(profile.name || '');
      setProfileHost(profile.host);
      setProfilePort(profile.port?.toString() || '22');
      setProfileUsername(profile.username);
      setProfilePassword(profile.password || '');
      setProfileColor(profile.color || PROFILE_COLORS[0]);
      setProfileIcon(profile.icon || 'server');
      setProfileAuthMethod(profile.authMethod || 'password');
      setProfilePrivateKey(profile.privateKeyContent || '');
      setProfilePassphrase(profile.passphrase || '');
      setProfileTags(profile.tags || []);
    } else {
      setEditingProfile(null);
      setProfileName('');
      setProfileHost('');
      setProfilePort('22');
      setProfileUsername('');
      setProfilePassword('');
      setProfileColor(PROFILE_COLORS[0]);
      setProfileIcon('server');
      setProfileAuthMethod('password');
      setProfilePrivateKey('');
      setProfilePassphrase('');
      setProfileTags([]);
    }
    setProfileTagInput('');
    setShowProfileModal(true);
  };

  const closeProfileModal = () => {
    setShowProfileModal(false);
    setEditingProfile(null);
  };

  const saveProfile = async () => {
    if (!profileHost || !profileUsername) {
      setError('Host and username are required');
      return;
    }

    if (profileAuthMethod === 'password' && !profilePassword) {
      setError('Password is required for password authentication');
      return;
    }

    if (profileAuthMethod === 'publickey' && !profilePrivateKey) {
      setError('Private key is required for key-based authentication');
      return;
    }

    try {
      const profile: any = {
        name: profileName || `${profileUsername}@${profileHost}`,
        host: profileHost,
        port: parseInt(profilePort, 10),
        username: profileUsername,
        color: profileColor,
        icon: profileIcon,
        authMethod: profileAuthMethod,
        tags: profileTags,
      };

      console.log('Saving profile with tags:', profileTags);

      if (profileAuthMethod === 'password') {
        profile.password = profilePassword;
      } else {
        profile.privateKeyContent = profilePrivateKey;
        if (profilePassphrase) {
          profile.passphrase = profilePassphrase;
        }
      }

      if (editingProfile) {
        profile.id = editingProfile.id;
      }

      const response = await window.electron.connections.save(profile);
      if (response.success) {
        await loadProfiles();
        closeProfileModal();
        setError(null);
      } else {
        setError(response.error || 'Failed to save profile');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
    }
  };

  const deleteProfile = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this connection profile?')) {
      try {
        await window.electron.connections.delete(id);
        await loadProfiles();
      } catch (err) {
        console.error('Failed to delete profile:', err);
      }
    }
  };

  const cloneProfile = (profile: any, e: React.MouseEvent) => {
    e.stopPropagation();
    // Create a copy with modified name
    const clonedName = profile.name ? `${profile.name} (Copy)` : `${profile.username}@${profile.host} (Copy)`;
    setEditingProfile(null); // Important: set to null so it creates a new profile
    setProfileName(clonedName);
    setProfileHost(profile.host);
    setProfilePort(profile.port?.toString() || '22');
    setProfileUsername(profile.username);
    setProfilePassword(profile.password || '');
    setProfileColor(profile.color || PROFILE_COLORS[0]);
    setProfileIcon(profile.icon || 'server');
    setProfileAuthMethod(profile.authMethod || 'password');
    setProfilePrivateKey(profile.privateKeyContent || '');
    setProfilePassphrase(profile.passphrase || '');
    setProfileTags(profile.tags || []);
    setProfileTagInput('');
    setShowProfileModal(true);
  };

  const selectKeyFile = async () => {
    try {
      const response = await window.electron.connections.selectKeyFile();
      if (response.success) {
        setProfilePrivateKey(response.data.content);
      }
    } catch (err: any) {
      console.error('Failed to select key file:', err);
    }
  };

  const loadClipboardHistory = async () => {
    try {
      const response = await window.electron.clipboard.getHistory();
      if (response.success) {
        setClipboardHistory(response.data || []);
      }
    } catch (err) {
      console.error('Failed to load clipboard history:', err);
    }
  };

  const copyFromClipboardHistory = async (id: string) => {
    try {
      await window.electron.clipboard.copyFromHistory(id);
    } catch (err) {
      console.error('Failed to copy from history:', err);
    }
  };

  const pasteFromClipboardHistory = async (id: string) => {
    try {
      const entry = clipboardHistory.find(e => e.id === id);
      if (entry && xtermRef.current && sessionId) {
        window.electron.ssh.sendData(sessionId, entry.content);
      }
    } catch (err) {
      console.error('Failed to paste from history:', err);
    }
  };

  const clearClipboardHistory = async () => {
    try {
      await window.electron.clipboard.clearHistory();
      setClipboardHistory([]);
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  };

  const deleteClipboardEntry = async (id: string) => {
    try {
      await window.electron.clipboard.deleteEntry(id);
      setClipboardHistory(prev => prev.filter(entry => entry.id !== id));
    } catch (err) {
      console.error('Failed to delete entry:', err);
    }
  };

  // Setup terminals for each tab
  useEffect(() => {
    if (tabs.length === 0) {
      return;
    }

    const theme = TERMINAL_THEMES[terminalTheme as keyof typeof TERMINAL_THEMES];
    const cleanup: Array<() => void> = [];

    // Initialize terminals for tabs that don't have one yet
    tabs.forEach((tab) => {
      if (tab.xtermInstance || !tab.terminalRef) {
        return;
      }

      const term = new Terminal({
        cursorBlink: true,
        fontSize: terminalFontSize,
        fontFamily: terminalFont,
        theme,
        scrollback: 10000,
      });

      const fitAddon = new FitAddon();
      const webLinksAddon = new WebLinksAddon();

      term.loadAddon(fitAddon);
      term.loadAddon(webLinksAddon);

      term.open(tab.terminalRef);

      // Use setTimeout to ensure DOM is ready
      setTimeout(() => {
        fitAddon.fit();
        window.electron.ssh.resize(tab.sessionId, term.cols, term.rows);
      }, 100);

      // Update the tab object with terminal instances
      tab.xtermInstance = term;
      tab.fitAddon = fitAddon;

      // Also update legacy refs for the active tab
      if (tab.id === activeTabId) {
        xtermRef.current = term;
        fitAddonRef.current = fitAddon;
      }

      // Intercept keyboard events to detect Ctrl+C for copying when text is selected
      term.attachCustomKeyEventHandler((event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
          const selection = term.getSelection();
          if (selection && selection.length > 0) {
            window.electron.clipboard.copy(selection, 'terminal').catch(() => {});
            return false;
          }
        }
        return true;
      });

      term.onData((data) => {
        window.electron.ssh.sendData(tab.sessionId, data);
      });

      const unsubscribeData = window.electron.ssh.onData((event) => {
        if (event.sessionId === tab.sessionId && event.data) {
          term.write(event.data);
        }
      });

      const unsubscribeStatus = window.electron.ssh.onStatus((event) => {
        if (event.sessionId === tab.sessionId) {
          if (event.status === 'disconnected') {
            // Find and close this tab
            const tabToClose = tabs.find(t => t.sessionId === event.sessionId);
            if (tabToClose) {
              closeTab(tabToClose.id);
            }
          }
        }
      });

      const unsubscribeError = window.electron.ssh.onError((event) => {
        if (event.sessionId === tab.sessionId) {
          setError(event.error);
        }
      });

      const handleResize = () => {
        // Only resize if this is the active tab
        if (tab.id === activeTabId && fitAddon) {
          fitAddon.fit();
          window.electron.ssh.resize(tab.sessionId, term.cols, term.rows);
        }
      };

      window.addEventListener('resize', handleResize);

      cleanup.push(() => {
        window.removeEventListener('resize', handleResize);
        unsubscribeData();
        unsubscribeStatus();
        unsubscribeError();
        // Don't dispose terminal here - it's handled in closeTab
      });
    });

    return () => {
      cleanup.forEach(fn => fn());
    };
  }, [tabs.length, terminalTheme, terminalFont, terminalFontSize]);

  // Update terminal settings dynamically for all tabs
  useEffect(() => {
    if (tabs.length === 0) {
      return;
    }

    const theme = TERMINAL_THEMES[terminalTheme as keyof typeof TERMINAL_THEMES];

    tabs.forEach((tab) => {
      if (!tab.xtermInstance) return;

      const term = tab.xtermInstance;

      // Update options
      term.options.fontSize = terminalFontSize;
      term.options.fontFamily = terminalFont;
      term.options.theme = theme;

      // Refit terminal after font changes (only for active tab)
      if (tab.fitAddon && tab.id === activeTabId) {
        setTimeout(() => {
          if (tab.fitAddon) {
            tab.fitAddon.fit();
            window.electron.ssh.resize(tab.sessionId, term.cols, term.rows);
          }
        }, 50);
      }
    });
  }, [terminalFont, terminalFontSize, terminalTheme, tabs, activeTabId]);

  // Get current theme colors
  const currentTheme = TERMINAL_THEMES[terminalTheme as keyof typeof TERMINAL_THEMES];
  const isDarkTheme = currentTheme.background !== '#ffffff' && currentTheme.background !== '#fafafa' && currentTheme.background !== '#fbf1c7' && currentTheme.background !== '#fdf6e3';

  // VHS effect setup
  const vhsColors = vhsMode !== 'off' ? {
    blue: { scanline: 'rgba(0, 180, 255, 0.15)', glow: '0, 180, 255' },
    amber: { scanline: 'rgba(255, 176, 0, 0.2)', glow: '255, 176, 0' },
    green: { scanline: 'rgba(0, 255, 0, 0.15)', glow: '0, 255, 0' },
    matrix: { scanline: 'rgba(0, 255, 65, 0.2)', glow: '0, 255, 65' }
  }[vhsMode] : null;

  return (
    <>
      <style>{`
        .connection-card:hover .connection-card-actions {
          opacity: 1 !important;
        }
      `}</style>
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: currentTheme.background,
        color: currentTheme.foreground,
        fontFamily: 'Space Grotesk, sans-serif',
        position: 'relative',
      }}>
      {/* VHS/CRT Effects Overlay - Applied to entire UI */}
      {vhsMode !== 'off' && vhsColors && (
        <>
          {/* Static scanline overlay */}
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `repeating-linear-gradient(0deg, ${vhsColors.scanline}, ${vhsColors.scanline} 1px, transparent 1px, transparent 2px)`,
            pointerEvents: 'none',
            zIndex: 9999,
          }} />
          {/* CRT glow */}
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            boxShadow: `inset 0 0 100px rgba(${vhsColors.glow}, 0.1)`,
            pointerEvents: 'none',
            zIndex: 9998,
          }} />
        </>
      )}

      {/* Header */}
      <div style={{
        padding: '12px 20px',
        background: isDarkTheme ? `${currentTheme.black}dd` : `${currentTheme.white}dd`,
        borderBottom: `1px solid rgba(255, 255, 255, 0.12)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginRight: '40px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <PawPrint size={22} style={{ color: currentTheme.green }} />
            Shellby
          </h1>
          <div style={{ fontSize: '11px', color: currentTheme.brightBlack, marginLeft: '32px', fontWeight: 400 }}>
            by FintonLabs
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: 1 }}>
          <button
            onClick={() => {
              loadClipboardHistory();
              setShowClipboard(true);
              setShowSnippets(false);
            }}
            style={{
              padding: '8px 14px',
              background: showClipboard ? currentTheme.cyan : (isDarkTheme ? '#1a1a1a' : '#f0f0f0'),
              color: showClipboard ? (isDarkTheme ? currentTheme.background : '#fff') : currentTheme.cyan,
              border: `1px solid ${showClipboard ? currentTheme.cyan : (isDarkTheme ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)')}`,
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 500,
            }}
            title="Clipboard Manager"
          >
            <Clipboard size={16} />
          </button>

          <button
            onClick={() => setShowSnippets(true)}
            style={{
              padding: '8px 14px',
              background: showSnippets ? currentTheme.yellow : (isDarkTheme ? '#1a1a1a' : '#f0f0f0'),
              color: showSnippets ? (isDarkTheme ? currentTheme.background : '#fff') : currentTheme.yellow,
              border: `1px solid ${showSnippets ? currentTheme.yellow : (isDarkTheme ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)')}`,
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 500,
            }}
            title="Command Snippets"
          >
            <Code size={16} />
          </button>

          <button
            onClick={() => {
              if (connected && sessionId) {
                setShowFileManager(true);
                setShowSnippets(false);
              }
            }}
            style={{
              padding: '8px 14px',
              background: showFileManager ? currentTheme.green : (isDarkTheme ? '#1a1a1a' : '#f0f0f0'),
              color: showFileManager ? (isDarkTheme ? currentTheme.background : '#fff') : currentTheme.green,
              border: `1px solid ${showFileManager ? currentTheme.green : (isDarkTheme ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)')}`,
              borderRadius: '6px',
              cursor: connected && sessionId ? 'pointer' : 'not-allowed',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 500,
              opacity: connected && sessionId ? 1 : 0.5,
            }}
            title={connected && sessionId ? "File Manager (SFTP)" : "File Manager (Connect first)"}
          >
            <HardDrive size={16} />
          </button>

          <button
            onClick={() => {
              setShowAI(!showAI);
              if (!showAI) setShowSnippets(false);
            }}
            style={{
              padding: '8px 14px',
              background: showAI ? currentTheme.magenta : (isDarkTheme ? '#1a1a1a' : '#f0f0f0'),
              color: showAI ? (isDarkTheme ? currentTheme.background : '#fff') : currentTheme.magenta,
              border: `1px solid ${showAI ? currentTheme.magenta : (isDarkTheme ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)')}`,
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 500,
            }}
            title="AI Assistant"
          >
            <Bot size={16} />
          </button>

          <button
            onClick={() => {
              const modes: Array<'off' | 'blue' | 'amber' | 'green' | 'matrix'> = ['off', 'blue', 'amber', 'green', 'matrix'];
              const currentIndex = modes.indexOf(vhsMode);
              const nextIndex = (currentIndex + 1) % modes.length;
              setVhsMode(modes[nextIndex]);
            }}
            style={{
              padding: '8px 14px',
              background: vhsMode !== 'off' ? currentTheme.blue : (isDarkTheme ? '#1a1a1a' : '#f0f0f0'),
              color: vhsMode !== 'off' ? (isDarkTheme ? currentTheme.background : '#fff') : currentTheme.blue,
              border: `1px solid ${vhsMode !== 'off' ? currentTheme.blue : (isDarkTheme ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)')}`,
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 500,
            }}
            title={`VHS Mode: ${vhsMode === 'off' ? 'Off' : vhsMode === 'blue' ? 'Blue/White CRT' : vhsMode === 'amber' ? 'Amber CRT' : vhsMode === 'green' ? 'Green CRT' : 'Matrix'}`}
          >
            <Tv size={16} />
            {vhsMode !== 'off' && <span style={{ fontSize: '10px', textTransform: 'uppercase' }}>{vhsMode}</span>}
          </button>

          <button
            onClick={() => setShowTerminalSettings(true)}
            style={{
              padding: '8px 14px',
              background: isDarkTheme ? '#1a1a1a' : '#f0f0f0',
              color: currentTheme.brightBlue,
              border: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)'}`,
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 500,
            }}
            title="Terminal Settings"
          >
            <Settings size={16} />
          </button>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px', alignItems: 'center' }}>
            {connected && sessionId && (
              <>
                <span style={{ fontSize: '13px', color: currentTheme.green, fontWeight: 600 }}>
                  ● CONNECTED
                </span>
                <button
                  onClick={handleDisconnect}
                  style={{
                    padding: '8px 18px',
                    background: currentTheme.red,
                    color: isDarkTheme ? currentTheme.background : '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                >
                  Disconnect
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      {tabs.length > 0 && (
        <div style={{
          background: isDarkTheme ? '#0a0a0a' : currentTheme.white,
          borderBottom: `1px solid rgba(255, 255, 255, 0.12)`,
          display: 'flex',
          alignItems: 'center',
          overflowX: 'auto',
          overflowY: 'hidden',
          gap: '2px',
          padding: '2px 8px',
        }}>
          <button
            onClick={() => {
              setActiveTabId(null);
              setSessionId(null);
              setConnected(false);
            }}
            style={{
              padding: '4px 10px',
              background: !activeTabId ? currentTheme.blue : 'transparent',
              color: !activeTabId ? currentTheme.background : currentTheme.brightBlack,
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 600,
              marginRight: '4px',
              flexShrink: 0,
            }}
            title="Show connections"
          >
            <Server size={12} />
            CONNECTIONS
          </button>
          {tabs.map(tab => (
            <div
              key={tab.id}
              onClick={() => switchToTab(tab.id)}
              style={{
                padding: '4px 8px',
                background: tab.id === activeTabId ? (isDarkTheme ? currentTheme.brightBlack : currentTheme.foreground) : 'transparent',
                color: tab.id === activeTabId ? (isDarkTheme ? currentTheme.foreground : currentTheme.background) : currentTheme.foreground,
                border: `1px solid ${tab.id === activeTabId ? currentTheme.brightBlack : 'transparent'}`,
                borderRadius: '4px 4px 0 0',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px',
                fontWeight: tab.id === activeTabId ? 600 : 400,
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
                minWidth: '80px',
                maxWidth: '140px',
              }}
              onMouseEnter={(e) => {
                if (tab.id !== activeTabId) {
                  e.currentTarget.style.background = isDarkTheme ? `${currentTheme.brightBlack}66` : `${currentTheme.foreground}22`;
                }
              }}
              onMouseLeave={(e) => {
                if (tab.id !== activeTabId) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <Server size={11} style={{ flexShrink: 0 }} />
              <div style={{
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {tab.profileName}
              </div>
              <button
                onClick={(e) => closeTab(tab.id, e)}
                style={{
                  padding: '1px',
                  background: 'transparent',
                  border: 'none',
                  color: tab.id === activeTabId ? currentTheme.red : currentTheme.brightBlack,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '2px',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `${currentTheme.red}33`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
                title="Close tab"
              >
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Profile List - shown when no active tab */}
        <div style={{
          flex: 1,
          display: activeTabId === null ? 'flex' : 'none',
          flexDirection: 'column',
          padding: '32px',
          overflowY: 'auto',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
          }}>
            <h2 style={{ fontSize: '24px', margin: 0, fontWeight: 600 }}>
              Saved Connections
            </h2>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleImportProfiles}
                style={{
                  padding: '10px 16px',
                  background: '#3c3c3c',
                  color: 'white',
                  border: '1px solid #555',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
                title="Import connections from JSON file"
              >
                <Download size={16} />
                Import
              </button>
              <button
                onClick={handleExportProfiles}
                disabled={profiles.length === 0}
                style={{
                  padding: '10px 16px',
                  background: profiles.length === 0 ? '#2a2a2a' : '#3c3c3c',
                  color: profiles.length === 0 ? '#666' : 'white',
                  border: '1px solid #555',
                  borderRadius: '6px',
                  cursor: profiles.length === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
                title="Export connections to JSON file (passwords excluded)"
              >
                <Upload size={16} />
                Export
              </button>
              <button
                onClick={() => openProfileModal()}
                style={{
                  padding: '10px 20px',
                  background: '#0e639c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Plus size={16} />
                New Connection
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              padding: '12px 16px',
              background: '#5a1d1d',
              border: '1px solid #cd3131',
              borderRadius: '6px',
              marginBottom: '20px',
              color: '#f48771',
              fontSize: '14px',
            }}>
              {error}
            </div>
          )}

          {profiles.length === 0 ? (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#888',
              textAlign: 'center',
            }}>
              <Server size={64} style={{ marginBottom: '16px', opacity: 0.3 }} />
              <p style={{ fontSize: '16px', margin: 0 }}>No saved connections</p>
              <p style={{ fontSize: '14px', margin: '8px 0 0 0' }}>
                Click "New Connection" to add your first server
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '16px',
            }}>
              {profiles.map((profile) => {
                const IconComponent = PROFILE_ICONS[profile.icon || 'server']?.icon || Server;

                return (<div
                  key={profile.id}
                  className="connection-card"
                  style={{
                    background: '#252526',
                    border: '1px solid #3e3e3e',
                    borderRadius: '8px',
                    padding: '20px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative',
                  }}
                  onClick={() => handleConnectWithProfile(profile)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = profile.color || '#0e639c';
                    e.currentTarget.style.background = '#2d2d2d';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#3e3e3e';
                    e.currentTarget.style.background = '#252526';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div className="connection-card-actions" style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      display: 'flex',
                      gap: '8px',
                      opacity: 0,
                      transition: 'opacity 0.2s',
                      zIndex: 10,
                    }}>
                      <button
                        onClick={(e) => cloneProfile(profile, e)}
                        style={{
                          padding: '6px',
                          background: '#3c3c3c',
                          color: '#2472c8',
                          border: '1px solid #555',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        title="Clone connection"
                      >
                        <Files size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openProfileModal(profile);
                        }}
                        style={{
                          padding: '6px',
                          background: '#3c3c3c',
                          color: '#cccccc',
                          border: '1px solid #555',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        title="Edit connection"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={(e) => deleteProfile(profile.id, e)}
                        style={{
                          padding: '6px',
                          background: '#5a1d1d',
                          color: '#f48771',
                          border: '1px solid #cd3131',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        title="Delete connection"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '12px',
                  }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      background: profile.color || '#0e639c',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      flexShrink: 0,
                    }}>
                      <IconComponent size={24} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        marginBottom: '4px',
                      }}>
                        {profile.name || profile.host}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#888',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {profile.username}@{profile.host}:{profile.port || 22}
                      </div>
                    </div>
                  </div>

                  {/* Neon pill tags */}
                  {profile.tags && profile.tags.length > 0 && (
                    <div style={{
                      marginTop: '0',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px',
                    }}>
                      {profile.tags.map((tag: string, idx: number) => (
                        <span
                          key={idx}
                          style={{
                            padding: '4px 10px',
                            background: `${profile.color || '#0e639c'}22`,
                            border: `1px solid ${profile.color || '#0e639c'}`,
                            borderRadius: '12px',
                            fontSize: '10px',
                            color: profile.color || '#0e639c',
                            textTransform: 'uppercase',
                            fontWeight: 600,
                            letterSpacing: '0.5px',
                            boxShadow: `0 0 8px ${profile.color || '#0e639c'}44`,
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
              })}
            </div>
          )}
        </div>

        {/* Terminals - One for each tab */}
        {tabs.map((tab) => (
          <div
            key={tab.id}
            ref={(el) => {
              tab.terminalRef = el;
            }}
            style={{
              flex: 1,
              padding: '8px',
              overflow: 'hidden',
              background: currentTheme.background,
              display: tab.id === activeTabId ? 'block' : 'none',
              position: 'relative',
            }}
          ></div>
        ))}

        {/* Connecting Overlay */}
        {connecting && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.95)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}>
            {/* Terminal-style SSH handshake animation */}
            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: '60px',
              marginBottom: '30px',
            }}>
              {/* Client computer */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                animation: 'slideInLeft 0.8s ease-out',
              }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  border: `3px solid ${currentTheme.blue}`,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `${currentTheme.blue}15`,
                  boxShadow: `0 0 30px ${currentTheme.blue}60`,
                  animation: 'pulse2 2s ease-in-out infinite',
                }}>
                  <PawPrint size={40} style={{ color: currentTheme.blue }} />
                </div>
                <div style={{ fontSize: '12px', color: currentTheme.brightBlack, fontWeight: 500 }}>
                  CLIENT
                </div>
              </div>

              {/* Connection packets flowing between client and server */}
              <div style={{
                position: 'relative',
                width: '200px',
                height: '4px',
                background: `${currentTheme.brightBlack}40`,
                borderRadius: '2px',
                overflow: 'visible',
              }}>
                {/* Animated data packets */}
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      left: '0',
                      top: '-6px',
                      width: '20px',
                      height: '16px',
                      background: currentTheme.cyan,
                      borderRadius: '3px',
                      boxShadow: `0 0 15px ${currentTheme.cyan}`,
                      animation: `dataFlow 1.5s ease-in-out ${i * 0.3}s infinite`,
                    }}
                  />
                ))}

                {/* SSH key exchange indicator */}
                <div style={{
                  position: 'absolute',
                  top: '-35px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '10px',
                  color: currentTheme.green,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  animation: 'fadeInOut 2s ease-in-out infinite',
                  whiteSpace: 'nowrap',
                }}>
                  SSH-2.0
                </div>
              </div>

              {/* Server */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                animation: 'slideInRight 0.8s ease-out',
              }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  border: `3px solid ${currentTheme.green}`,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `${currentTheme.green}15`,
                  boxShadow: `0 0 30px ${currentTheme.green}60`,
                  animation: 'pulse2 2s ease-in-out 0.5s infinite',
                }}>
                  <Server size={40} style={{ color: currentTheme.green }} />
                </div>
                <div style={{ fontSize: '12px', color: currentTheme.brightBlack, fontWeight: 500 }}>
                  SERVER
                </div>
              </div>
            </div>

            {/* Terminal-style progress steps */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              fontFamily: 'Monaco, monospace',
              fontSize: '12px',
              marginBottom: '20px',
            }}>
              {[
                { text: '> Initiating SSH handshake...', delay: 0 },
                { text: '> Exchanging encryption keys...', delay: 0.3 },
                { text: '> Authenticating session...', delay: 0.6 },
              ].map((step, i) => (
                <div
                  key={i}
                  style={{
                    color: currentTheme.green,
                    opacity: 0,
                    animation: `terminalLine 0.5s ease-out ${step.delay}s forwards`,
                  }}
                >
                  {step.text}
                </div>
              ))}
            </div>

            {/* Status text */}
            <div style={{
              fontSize: '18px',
              fontWeight: 600,
              color: currentTheme.cyan,
              marginBottom: '8px',
              fontFamily: 'Monaco, monospace',
              letterSpacing: '1px',
            }}>
              ESTABLISHING SECURE CONNECTION
            </div>

            {/* Animated cursor */}
            <div style={{
              fontFamily: 'Monaco, monospace',
              fontSize: '12px',
              color: currentTheme.cyan,
            }}>
              <span style={{ animation: 'blink 1s step-end infinite' }}>▊</span>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0% { transform: scale(0.8); opacity: 0; }
          50% { opacity: 0.5; }
          100% { transform: scale(1.2); opacity: 0; }
        }
        @keyframes pulse2 {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes glow {
          0% { opacity: 0.7; }
          100% { opacity: 1; }
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes fadeInOut {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-12px); }
        }
        @keyframes slideInLeft {
          0% {
            transform: translateX(-50px);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideInRight {
          0% {
            transform: translateX(50px);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes dataFlow {
          0% {
            left: 0%;
            opacity: 0;
            transform: scale(0.8);
          }
          10% {
            opacity: 1;
            transform: scale(1);
          }
          90% {
            opacity: 1;
            transform: scale(1);
          }
          100% {
            left: calc(100% - 20px);
            opacity: 0;
            transform: scale(0.8);
          }
        }
        @keyframes terminalLine {
          0% {
            opacity: 0;
            transform: translateX(-10px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>

      {/* Footer */}
      <div style={{
        padding: '8px 20px',
        background: isDarkTheme ? `${currentTheme.black}dd` : `${currentTheme.white}dd`,
        borderTop: `1px solid rgba(255, 255, 255, 0.12)`,
        fontSize: '12px',
        color: currentTheme.brightBlack,
      }}>
        Shellby v1.0.4 | SSH/SFTP Terminal by FintonLabs
      </div>

      {/* Profile Modal */}
      {showProfileModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: '#252526',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto',
            border: '1px solid #3e3e3e',
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #3e3e3e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                {editingProfile ? 'Edit Connection' : 'New Connection'}
              </h3>
              <button
                onClick={closeProfileModal}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#888',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>
                    Name (optional)
                  </label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="My Server"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: '#3c3c3c',
                      border: '1px solid #555',
                      borderRadius: '4px',
                      color: '#cccccc',
                      fontSize: '14px',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>
                      Host *
                    </label>
                    <input
                      type="text"
                      value={profileHost}
                      onChange={(e) => setProfileHost(e.target.value)}
                      placeholder="example.com"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: '#3c3c3c',
                        border: '1px solid #555',
                        borderRadius: '4px',
                        color: '#cccccc',
                        fontSize: '14px',
                      }}
                    />
                  </div>
                  <div style={{ width: '100px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>
                      Port
                    </label>
                    <input
                      type="text"
                      value={profilePort}
                      onChange={(e) => setProfilePort(e.target.value)}
                      placeholder="22"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: '#3c3c3c',
                        border: '1px solid #555',
                        borderRadius: '4px',
                        color: '#cccccc',
                        fontSize: '14px',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>
                    Username *
                  </label>
                  <input
                    type="text"
                    value={profileUsername}
                    onChange={(e) => setProfileUsername(e.target.value)}
                    placeholder="username"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: '#3c3c3c',
                      border: '1px solid #555',
                      borderRadius: '4px',
                      color: '#cccccc',
                      fontSize: '14px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>
                    Authentication Method
                  </label>
                  <select
                    value={profileAuthMethod}
                    onChange={(e) => setProfileAuthMethod(e.target.value as 'password' | 'publickey')}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: '#3c3c3c',
                      border: '1px solid #555',
                      borderRadius: '4px',
                      color: '#cccccc',
                      fontSize: '14px',
                    }}
                  >
                    <option value="password">Password</option>
                    <option value="publickey">Private Key</option>
                  </select>
                </div>

                {profileAuthMethod === 'password' ? (
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>
                      Password *
                    </label>
                    <input
                      type="password"
                      value={profilePassword}
                      onChange={(e) => setProfilePassword(e.target.value)}
                      placeholder="password"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: '#3c3c3c',
                        border: '1px solid #555',
                        borderRadius: '4px',
                        color: '#cccccc',
                        fontSize: '14px',
                      }}
                    />
                  </div>
                ) : (
                  <>
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>
                        Private Key *
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={selectKeyFile}
                          style={{
                            padding: '10px 16px',
                            background: '#3c3c3c',
                            color: '#cccccc',
                            border: '1px solid #555',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <Upload size={14} />
                          Select File
                        </button>
                        <span style={{ display: 'flex', alignItems: 'center', fontSize: '13px', color: '#888' }}>
                          {profilePrivateKey ? '✓ Key loaded' : 'No key selected'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>
                        Passphrase (if encrypted)
                      </label>
                      <input
                        type="password"
                        value={profilePassphrase}
                        onChange={(e) => setProfilePassphrase(e.target.value)}
                        placeholder="passphrase"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          background: '#3c3c3c',
                          border: '1px solid #555',
                          borderRadius: '4px',
                          color: '#cccccc',
                          fontSize: '14px',
                        }}
                      />
                    </div>
                  </>
                )}

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>
                    Color
                  </label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {PROFILE_COLORS.map(color => (
                      <div
                        key={color}
                        onClick={() => setProfileColor(color)}
                        style={{
                          width: '32px',
                          height: '32px',
                          background: color,
                          borderRadius: '4px',
                          cursor: 'pointer',
                          border: profileColor === color ? '2px solid white' : '2px solid transparent',
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>
                    Icon
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
                    {Object.entries(PROFILE_ICONS).map(([key, { icon: IconComponent, name }]) => (
                      <div
                        key={key}
                        onClick={() => setProfileIcon(key)}
                        style={{
                          width: '48px',
                          height: '48px',
                          background: profileIcon === key ? profileColor : '#3c3c3c',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          border: profileIcon === key ? `2px solid ${profileColor}` : '2px solid #555',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          if (profileIcon !== key) {
                            e.currentTarget.style.borderColor = '#888';
                            e.currentTarget.style.background = '#454545';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (profileIcon !== key) {
                            e.currentTarget.style.borderColor = '#555';
                            e.currentTarget.style.background = '#3c3c3c';
                          }
                        }}
                        title={name}
                      >
                        <IconComponent size={24} color={profileIcon === key ? 'white' : '#888'} />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>
                    Tags
                  </label>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      value={profileTagInput}
                      onChange={(e) => setProfileTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        console.log('Key down:', e.key);
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          e.stopPropagation();
                          const trimmed = profileTagInput.trim();
                          console.log('Enter pressed, tag input:', trimmed, 'current tags:', profileTags);
                          if (trimmed && !profileTags.includes(trimmed)) {
                            const newTags = [...profileTags, trimmed];
                            console.log('Adding tag, new tags:', newTags);
                            setProfileTags(newTags);
                            setProfileTagInput('');
                          }
                        }
                      }}
                      placeholder="Type tag and press Enter..."
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        background: '#3c3c3c',
                        border: '1px solid #555',
                        borderRadius: '4px',
                        color: '#cccccc',
                        fontSize: '14px',
                      }}
                    />
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const trimmed = profileTagInput.trim();
                        console.log('Add button clicked, tag input:', trimmed, 'current tags:', profileTags);
                        if (trimmed && !profileTags.includes(trimmed)) {
                          const newTags = [...profileTags, trimmed];
                          console.log('Adding tag via button, new tags:', newTags);
                          setProfileTags(newTags);
                          setProfileTagInput('');
                        }
                      }}
                      style={{
                        padding: '10px 16px',
                        background: '#0e639c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 500,
                      }}
                    >
                      Add
                    </button>
                  </div>
                  {profileTags.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {profileTags.map((tag, idx) => (
                        <span
                          key={idx}
                          style={{
                            padding: '4px 10px',
                            background: `${profileColor}22`,
                            border: `1px solid ${profileColor}`,
                            borderRadius: '12px',
                            fontSize: '11px',
                            color: profileColor,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          {tag}
                          <X
                            size={12}
                            style={{ cursor: 'pointer' }}
                            onClick={() => setProfileTags(profileTags.filter((_, i) => i !== idx))}
                          />
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #3e3e3e',
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
            }}>
              <button
                onClick={closeProfileModal}
                style={{
                  padding: '10px 20px',
                  background: '#3c3c3c',
                  color: '#cccccc',
                  border: '1px solid #555',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveProfile}
                style={{
                  padding: '10px 20px',
                  background: '#0e639c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Save size={16} />
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clipboard Modal */}
      {showClipboard && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: '#252526',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '700px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid #3e3e3e',
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #3e3e3e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                Clipboard Manager
              </h3>
              <button
                onClick={() => {
                  setShowClipboard(false);
                  setClipboardSearchQuery('');
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#888',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '16px 24px', borderBottom: '1px solid #3e3e3e' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#3c3c3c',
                border: '1px solid #555',
                borderRadius: '4px',
                padding: '8px 12px',
              }}>
                <Search size={16} style={{ color: '#888' }} />
                <input
                  type="text"
                  value={clipboardSearchQuery}
                  onChange={(e) => setClipboardSearchQuery(e.target.value)}
                  placeholder="Search clipboard history..."
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#cccccc',
                    fontSize: '14px',
                  }}
                />
              </div>
            </div>

            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px 24px',
            }}>
              {clipboardHistory.length === 0 ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '40px 20px',
                  color: '#888',
                  textAlign: 'center',
                }}>
                  <Clipboard size={48} style={{ marginBottom: '12px', opacity: 0.3 }} />
                  <p style={{ fontSize: '15px', margin: 0 }}>No clipboard history</p>
                  <p style={{ fontSize: '13px', margin: '6px 0 0 0' }}>
                    Copy text to start building your clipboard history
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {clipboardHistory
                    .filter(entry => {
                      if (!clipboardSearchQuery) return true;
                      return entry.content.toLowerCase().includes(clipboardSearchQuery.toLowerCase());
                    })
                    .map((entry) => (
                      <div
                        key={entry.id}
                        style={{
                          background: '#2d2d2d',
                          border: '1px solid #3e3e3e',
                          borderRadius: '6px',
                          padding: '12px',
                          display: 'flex',
                          gap: '12px',
                          alignItems: 'flex-start',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#323233';
                          e.currentTarget.style.borderColor = '#555';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#2d2d2d';
                          e.currentTarget.style.borderColor = '#3e3e3e';
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: '13px',
                            color: '#cccccc',
                            marginBottom: '6px',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            maxHeight: '80px',
                            overflow: 'hidden',
                          }}>
                            {entry.content.length > 200
                              ? entry.content.substring(0, 200) + '...'
                              : entry.content}
                          </div>
                          <div style={{
                            display: 'flex',
                            gap: '12px',
                            alignItems: 'center',
                            fontSize: '11px',
                            color: '#888',
                          }}>
                            <span>
                              {new Date(entry.timestamp).toLocaleString()}
                            </span>
                            <span style={{
                              padding: '2px 6px',
                              background: entry.source === 'terminal' ? '#2d5016' : '#3c3c3c',
                              borderRadius: '3px',
                              textTransform: 'uppercase',
                              fontWeight: 500,
                            }}>
                              {entry.source}
                            </span>
                            <span style={{ color: '#666' }}>
                              {entry.content.length} chars
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => copyFromClipboardHistory(entry.id)}
                            style={{
                              padding: '6px',
                              background: '#3c3c3c',
                              color: '#0dbc79',
                              border: '1px solid #555',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                            title="Copy to clipboard"
                          >
                            <Copy size={14} />
                          </button>
                          {connected && sessionId && (
                            <button
                              onClick={() => pasteFromClipboardHistory(entry.id)}
                              style={{
                                padding: '6px',
                                background: '#3c3c3c',
                                color: '#2472c8',
                                border: '1px solid #555',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                              title="Paste into terminal"
                            >
                              <CornerDownLeft size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => deleteClipboardEntry(entry.id)}
                            style={{
                              padding: '6px',
                              background: '#5a1d1d',
                              color: '#f48771',
                              border: '1px solid #cd3131',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                            title="Delete entry"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #3e3e3e',
              display: 'flex',
              gap: '12px',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{ fontSize: '13px', color: '#888' }}>
                {clipboardHistory.length} {clipboardHistory.length === 1 ? 'entry' : 'entries'}
              </span>
              <button
                onClick={() => {
                  if (confirm('Clear all clipboard history?')) {
                    clearClipboardHistory();
                  }
                }}
                disabled={clipboardHistory.length === 0}
                style={{
                  padding: '8px 16px',
                  background: clipboardHistory.length === 0 ? '#3c3c3c' : '#cd3131',
                  color: clipboardHistory.length === 0 ? '#666' : 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: clipboardHistory.length === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontWeight: 500,
                }}
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Manager Modal */}
      {showFileManager && (
        <FileManager
          sessionId={sessionId}
          onClose={() => setShowFileManager(false)}
        />
      )}

      {/* AI Assistant Sidebar */}
      <AIAssistant
        isOpen={showAI}
        onClose={() => setShowAI(false)}
        terminalContext={sessionId ? `Connected to SSH session ${sessionId}` : undefined}
      />

      {/* Snippet Manager */}
      {showSnippets && (
        <SnippetManager
          onClose={() => setShowSnippets(false)}
          onExecute={(command) => {
            if (sessionId && xtermRef.current) {
              window.electron.ssh.sendData(sessionId, command + '\n');
            }
            setShowSnippets(false);
          }}
        />
      )}

      {/* Terminal Settings Modal */}
      {showTerminalSettings && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: '#252526',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '900px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid #3e3e3e',
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #3e3e3e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                Terminal Settings
              </h3>
              <button
                onClick={() => setShowTerminalSettings(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#888',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{
              padding: '24px',
              overflowY: 'auto',
              flex: 1,
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 500 }}>
                    Font Family
                  </label>
                  <select
                    value={terminalFont}
                    onChange={(e) => setTerminalFont(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: '#3c3c3c',
                      border: '1px solid #555',
                      borderRadius: '4px',
                      color: '#cccccc',
                      fontSize: '14px',
                    }}
                  >
                    {TERMINAL_FONTS.map(font => (
                      <option key={font.value} value={font.value}>
                        {font.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 500 }}>
                    Font Size: {terminalFontSize}px
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="24"
                    value={terminalFontSize}
                    onChange={(e) => setTerminalFontSize(parseInt(e.target.value, 10))}
                    style={{
                      width: '100%',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '12px', fontSize: '13px', fontWeight: 500 }}>
                    Color Theme
                  </label>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: '10px',
                  }}>
                    {Object.entries(TERMINAL_THEMES).map(([key, theme]) => (
                      <div
                        key={key}
                        onClick={() => setTerminalTheme(key)}
                        style={{
                          padding: '12px',
                          background: terminalTheme === key ? '#3c3c3c' : '#2d2d2d',
                          border: terminalTheme === key ? '2px solid #0e639c' : '1px solid #3e3e3e',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          if (terminalTheme !== key) {
                            e.currentTarget.style.borderColor = '#555';
                            e.currentTarget.style.background = '#323233';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (terminalTheme !== key) {
                            e.currentTarget.style.borderColor = '#3e3e3e';
                            e.currentTarget.style.background = '#2d2d2d';
                          }
                        }}
                      >
                        <div style={{
                          width: '100%',
                          height: '48px',
                          background: theme.background,
                          border: `2px solid ${theme.foreground}33`,
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontFamily: 'Monaco, monospace',
                          color: theme.foreground,
                          position: 'relative',
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            display: 'flex',
                            gap: '4px',
                            fontSize: '10px',
                          }}>
                            <span style={{ color: theme.red }}>●</span>
                            <span style={{ color: theme.green }}>●</span>
                            <span style={{ color: theme.blue }}>●</span>
                            <span style={{ color: theme.yellow }}>●</span>
                            <span style={{ color: theme.magenta }}>●</span>
                            <span style={{ color: theme.cyan }}>●</span>
                          </div>
                        </div>
                        <div style={{
                          fontSize: '13px',
                          fontWeight: terminalTheme === key ? 600 : 500,
                          textAlign: 'center',
                          color: terminalTheme === key ? '#0e639c' : '#cccccc',
                        }}>
                          {theme.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #3e3e3e',
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
            }}>
              <button
                onClick={() => setShowTerminalSettings(false)}
                style={{
                  padding: '10px 20px',
                  background: '#0e639c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};
