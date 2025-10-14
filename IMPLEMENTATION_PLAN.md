# Shelby - Implementation Plan
## Advanced SSH/SFTP Terminal with AI Integration

### 🎯 Core Features to Implement

## 1. SFTP Dual-Pane File Manager

### Backend (✅ Complete)
- [x] SFTPManager service with full SFTP operations
- [x] File operations: list, upload, download, delete, rename, chmod
- [x] Transfer management with progress tracking
- [x] Event-driven architecture for real-time updates

### Integration (🔄 In Progress)
- [ ] Add SFTPManager to main process
- [ ] Register SFTP IPC channels
- [ ] Expose SFTP API in preload script
- [ ] Add local filesystem APIs (Node.js fs)

### UI Components (🔄 To Build)
- [ ] Dual-pane layout (local left, remote right)
- [ ] File browser component with icons
- [ ] Breadcrumb navigation
- [ ] File operations toolbar
- [ ] Transfer queue panel (bottom)
- [ ] Progress bars for active transfers
- [ ] Drag-and-drop support

### Features
- Upload/download with progress
- Batch operations
- File preview
- Search/filter
- Keyboard shortcuts
- Context menus

---

## 2. AI Command Assistant (OpenRouter Integration)

### Setup
- [ ] Install OpenAI SDK: `npm install openai`
- [ ] Create AI settings storage
- [ ] Add API key configuration UI

### Backend
- [ ] AIManager service
- [ ] OpenRouter API integration
- [ ] Context preparation from terminal
- [ ] Response parsing and formatting

### UI Components
- [ ] AI sidebar panel (toggle with button)
- [ ] Chat interface
- [ ] Terminal context selector
- [ ] Command preview/execution
- [ ] Model selector (Claude, GPT-4, etc.)

### Features
- **Command Generation**: Natural language → shell command
- **Error Explanation**: Select error → AI explains
- **Log Analysis**: Paste logs → AI finds issues
- **Smart Suggestions**: Context-aware completions
- **Script Generation**: Task description → full script

---

## 3. Command Snippets & Macros

### Backend
- [ ] Snippets storage (electron-store)
- [ ] Parameter interpolation
- [ ] Categories/tags system

### UI
- [ ] Snippets manager modal
- [ ] Quick insert (Cmd+K)
- [ ] Parameter input dialog
- [ ] Import/export functionality

### Features
- Save frequent commands
- Parameterized snippets
- Chain commands
- Keyboard shortcuts
- Share snippet library

---

## 4. Quick Wins (Additional Features)

### Multi-Tab Sessions
- [ ] Tab bar component
- [ ] Session management
- [ ] Tab shortcuts (Cmd+1-9)

### Session Recording
- [ ] Record terminal sessions
- [ ] Playback functionality
- [ ] Export to asciinema format

### Port Forwarding
- [ ] Port forward manager UI
- [ ] Tunnel configuration storage
- [ ] One-click tunnel activation

---

## 📋 Implementation Order

### Phase 1: SFTP (Days 1-2)
1. Integrate SFTP backend
2. Build dual-pane UI
3. Add drag-and-drop
4. Test file operations

### Phase 2: AI Integration (Days 3-4)
1. Setup OpenRouter
2. Build AI sidebar
3. Implement command generation
4. Add context menu
5. Test AI features

### Phase 3: Snippets (Day 5)
1. Build snippets storage
2. Create UI
3. Add quick insert

### Phase 4: Polish & Test (Day 6)
1. Multi-tabs
2. Integration testing
3. Bug fixes
4. Documentation

---

## 🛠 Technical Architecture

### File Structure
```
src/
├── main/
│   ├── services/
│   │   ├── sftp/
│   │   │   └── SFTPManager.ts ✅
│   │   ├── ai/
│   │   │   └── AIManager.ts (to create)
│   │   └── snippets/
│   │       └── SnippetsManager.ts (to create)
│   └── index.ts (integrate services)
├── preload/
│   └── index.ts (expose APIs)
├── renderer/
│   ├── components/
│   │   ├── FileManager/ (to create)
│   │   ├── AIAssistant/ (to create)
│   │   └── SnippetsManager/ (to create)
│   └── App.tsx (main UI)
└── shared/
    └── types/
        ├── sftp.ts ✅
        ├── ai.ts (to create)
        └── snippets.ts (to create)
```

### Dependencies to Install
```json
{
  "openai": "^4.x",  // OpenRouter API
  "react-beautiful-dnd": "^13.x"  // Drag-and-drop
}
```

---

## 🎨 UI/UX Design

### SFTP Layout
```
┌─────────────────────────────────────────┐
│  🐾 Shelby          [Terminal] [SFTP]  │
├──────────────┬──────────────────────────┤
│ Local Files  │  Remote Files            │
│ 📁 Documents │  📁 /home/user           │
│ 📁 Downloads │  📁 projects             │
│ 📄 file.txt  │  📄 config.yml          │
├──────────────┴──────────────────────────┤
│ Transfers (2 active)                    │
│ ⬆️ file.zip [████████░░] 80% 2.5MB/s  │
└─────────────────────────────────────────┘
```

### AI Assistant Layout
```
┌─────────────────────────────────────────┐
│  🐾 Shelby    [Terminal] [🤖 AI]       │
├─────────────────────┬───────────────────┤
│ Terminal            │ AI Assistant      │
│ $ ls -la            │ 💬 Ask me...      │
│ total 64            │                   │
│ drwxr-xr-x  ubuntu  │ You: How to find  │
│                     │ large files?      │
│                     │                   │
│                     │ AI: Use this:     │
│                     │ ```               │
│                     │ find . -size +100M│
│                     │ ```               │
│                     │ [Execute] [Copy]  │
└─────────────────────┴───────────────────┘
```

---

## ✅ Success Criteria

### SFTP
- ✅ Browse local and remote filesystems
- ✅ Upload/download with progress
- ✅ Drag-and-drop between panes
- ✅ File operations (delete, rename, chmod)
- ✅ Transfer queue with pause/resume

### AI
- ✅ Command generation from natural language
- ✅ Error explanation
- ✅ Log analysis
- ✅ Context-aware suggestions
- ✅ Multiple model support

### Snippets
- ✅ Save and organize commands
- ✅ Parameter interpolation
- ✅ Quick insert
- ✅ Import/export

---

## 🚀 Next Steps

1. **Integrate SFTP backend** into main process
2. **Add IPC channels** for SFTP operations
3. **Build file browser UI** components
4. **Install AI SDK** and setup OpenRouter
5. **Create AI assistant** sidebar
6. **Build snippets manager**
7. **Test everything**

---

## 📚 Resources

- OpenRouter API: https://openrouter.ai/docs
- ssh2 SFTP: https://github.com/mscdex/ssh2#sftp
- React DnD: https://react-dnd.github.io/react-dnd/
- xterm.js: https://xtermjs.org/

---

**Status**: 🔄 In Progress
**Started**: 2025-10-12
**Target**: MVP in 6 days
