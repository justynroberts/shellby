# 🐾 Shellby

> Modern SSH/SFTP Terminal with AI Assistant by FintonLabs

Shellby is a powerful, feature-rich SSH/SFTP terminal application built with Electron, React, and TypeScript. Named after Finton (FintonLabs' mascot), Shellby brings together essential remote server management tools in one beautiful, responsive interface.

## ✨ Features

### 🔐 Connection Management
- **Profile System** - Save and manage multiple SSH connections
- **Authentication** - Support for password and private key authentication
- **Color-Coded Profiles** - Visually organize connections with custom colors
- **Tagged Connections** - Add custom tags for easy filtering and organization
- **Jump Host Support** - Connect through bastion/jump hosts

### 💻 Terminal
- **Full xterm.js Terminal** - Professional terminal emulation with full ANSI support
- **12 Color Themes** - VS Code Dark, Dracula, Monokai, Nord, Solarized (Dark/Light), GitHub Light, One Light, Gruvbox (Dark/Light), Tokyo Night, Catppuccin
- **Custom Fonts** - Choose from 12 professional monospace fonts (Monaco, Menlo, SF Mono, Fira Code, JetBrains Mono, Cascadia Code, and more)
- **VHS Mode** - Retro CRT effects (Blue, Amber, Green, Matrix)
- **Responsive Design** - Instant keystroke response with zero lag

### 📋 Clipboard Manager
- **History Tracking** - Automatic clipboard history from terminal and system
- **Search** - Quickly find past clipboard entries
- **Dual Actions** - Copy to system clipboard or paste directly into terminal
- **Source Tagging** - Track where clipboard entries came from

### 📁 SFTP File Manager
- **Dual-Pane Interface** - Side-by-side local and remote file browsing
- **Drag & Drop** - Easy file transfers
- **Bulk Operations** - Upload/download multiple files
- **Directory Navigation** - Quick home directory access
- **Progress Tracking** - Real-time transfer progress

### 🤖 AI Assistant
- **Multiple Providers** - Support for Ollama (default), Claude, and OpenAI
- **Context-Aware** - Understands your SSH session context
- **Command Help** - Get help with commands, scripts, and troubleshooting
- **Default: Ollama + llama3.2** - Privacy-first, runs locally by default

### 📦 Command Snippets
- **230+ Built-in Snippets** - Across 17 categories
- **Categories Include:**
  - System Administration
  - Docker & Containers
  - Kubernetes
  - Git & Version Control
  - Networking & Security
  - Database Management
  - File Operations
  - Process Management
  - Text Processing
  - Performance Monitoring
  - And many more!
- **One-Click Execution** - Run commands directly in your terminal
- **Search & Filter** - Quick access to the command you need

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- For AI features: Ollama (optional, for local AI) or API keys for Claude/OpenAI

### Installation

```bash
# Clone the repository
git clone https://github.com/justynroberts/shellby.git
cd shellby

# Install dependencies
npm install

# Run in development mode
npm run dev

# Or start webpack dev server for hot reload
npm start
# Then in another terminal:
npm run dev
```

### Building for Production

```bash
# Create production build
npm run build

# Package as distributable
npm run package
```

## 🎨 Configuration

### AI Assistant Setup

By default, Shellby uses Ollama with llama3.2 running locally. To use other providers:

1. Open AI Assistant while connected to a terminal
2. Click the settings icon
3. Select provider:
   - **Ollama** (default) - `http://localhost:11434` - No API key needed
   - **Claude** - Add Anthropic API key
   - **OpenAI** - Add OpenAI API key

### Terminal Customization

Access terminal settings while connected:
- **Fonts**: 12 professional monospace options
- **Themes**: 12 carefully curated color schemes
- **Font Size**: Adjustable from 10-24px
- **VHS Mode**: Optional retro CRT effects

## 🛠️ Technology Stack

- **Electron 38** - Cross-platform desktop app framework
- **React 19** - UI framework
- **TypeScript** - Type-safe development
- **xterm.js** - Professional terminal emulation
- **ssh2** - SSH/SFTP client
- **Anthropic SDK** - Claude AI integration
- **OpenAI SDK** - GPT integration
- **Ollama** - Local AI support (default)
- **electron-store** - Persistent configuration
- **Lucide React** - Beautiful icons
- **Webpack** - Module bundling

## 📂 Project Structure

```
shellby/
├── src/
│   ├── main/                    # Electron main process
│   │   ├── services/
│   │   │   ├── ssh/            # SSH connection management
│   │   │   ├── sftp/           # SFTP operations
│   │   │   ├── ai/             # AI assistant (Ollama, Claude, OpenAI)
│   │   │   ├── clipboard/      # Clipboard history manager
│   │   │   └── connection/     # Connection profiles
│   │   ├── utils/              # Logger with rotation
│   │   └── index.ts            # Main entry point
│   │
│   ├── renderer/                # React UI
│   │   ├── components/         # FileManager, AIAssistant, Snippets
│   │   ├── assets/             # Logo and icons
│   │   ├── App.tsx             # Main application
│   │   └── index.tsx           # Renderer entry
│   │
│   ├── preload/                 # Electron preload scripts
│   │   └── index.ts
│   │
│   └── shared/                  # Shared code
│       ├── types/              # TypeScript types
│       ├── constants/          # Defaults and themes
│       └── snippets.ts         # 230+ command snippets
│
├── dist/                        # Build output
├── build/                       # App icons
└── README.md
```

## 🔒 Security & Privacy

- **No Telemetry** - Shellby doesn't track you
- **Local Storage** - All connections and data stored locally with electron-store
- **Private Keys** - Securely stored, never transmitted
- **Local AI Default** - Ollama runs on your machine by default (no data leaves your system)
- **Log Management** - Automatic log rotation with 10MB file limits (max 30MB total)
- **Secure IPC** - Context isolation and secure preload bridge

## 🐛 Performance Optimizations

Shellby is built for speed:
- ✅ Zero console.log overhead in production
- ✅ Optimized terminal rendering (no animation lag)
- ✅ Buffered logging to prevent I/O bottlenecks
- ✅ Efficient React rendering patterns
- ✅ Automatic log rotation prevents disk space issues
- ✅ Removed all expensive VHS animations from critical path
- ✅ Instant keystroke response

## 🤝 Contributing

We welcome contributions! Shellby is actively developed by FintonLabs.

1. Fork the repository
2. Create a feature branch
3. Follow TypeScript strict mode
4. Write tests for new features
5. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details

## 🐕 About FintonLabs

Shellby is created by FintonLabs, named after our mascot Finton. Check out our other tools:
- **Finsight** - Analytics and insights utility

## 💬 Support

- 🐛 Issues: [GitHub Issues](https://github.com/justynroberts/shellby/issues)
- 📧 Email: justyn@fintonlabs.com

## 🙏 Acknowledgments

Built with amazing open-source tools:
- [Electron](https://www.electronjs.org/)
- [React](https://react.dev/)
- [xterm.js](https://xtermjs.org/)
- [ssh2](https://github.com/mscdex/ssh2)
- [Ollama](https://ollama.com/)

---

**Version:** 1.0.1
**Status:** Production Ready
Made with 💚 by FintonLabs

🐾 Good terminal. Yes you are!
