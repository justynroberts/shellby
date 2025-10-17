# 🚀 DemoRecorder Quick Start

Get professional screenshots and videos for your app in 15 minutes.

## 📸 Screenshot Workflow (5 minutes)

### 1. Prepare (1 min)
```bash
# Launch your app
npm run dev  # or your build/launch command

# Set window size to ~1440x900
# Choose attractive theme
```

### 2. Capture (3 min)
**macOS**: Cmd+Shift+4, Space, Click window
**Windows**: Win+Shift+S
**Linux**: flameshot or screenshot tool

Save to: `docs/screenshots/screenshot-*.png`

### 3. Optimize (1 min)
```bash
bash demorecorder/scripts/optimize-screenshots.sh
```

**Done!** You now have optimized screenshots.

## 🎥 Video Workflow (15 minutes)

### 1. Plan (2 min)
- List 3-5 key features to show
- Aim for 60-90 second total video
- Write down steps for each feature

### 2. Record (5 min)
```bash
bash demorecorder/scripts/record-demo.sh
```

Or manually:
- **macOS**: Cmd+Shift+5 → Record Window
- **Windows**: Win+G (Game Bar)
- **Linux**: SimpleScreenRecorder or OBS

### 3. Process (5 min)
```bash
# The record-demo.sh script will guide you through:
# - Converting to MP4
# - Creating GIF excerpt
# - Optimizing file sizes
```

### 4. Update README (3 min)
```markdown
## Demo

![Demo](docs/screenshots/demo.gif)

## Screenshots

![Main](docs/screenshots/screenshot-main.png)
```

## 🎯 Pro Tips

**Screenshots**:
- Capture 5-7 key screens
- Use consistent window size
- Show interesting content (not empty screens)
- Font size 14-16px minimum

**Videos**:
- Keep under 90 seconds
- Show one feature at a time
- Move cursor deliberately
- Dark themes often look better

**File Sizes**:
- PNGs: <500KB each
- GIF: <10MB (GitHub limit)
- MP4: <50MB recommended

## 📋 Minimal Checklist

- [ ] App ready to demo
- [ ] Window size set (~1440x900)
- [ ] Capture 5-7 screenshots
- [ ] Run optimizer
- [ ] (Optional) Record video
- [ ] Update README
- [ ] Commit to git

## 🛠️ One-Liner Setup

Add to your `package.json`:

```json
{
  "scripts": {
    "demo": "bash demorecorder/scripts/record-demo.sh",
    "optimize": "bash demorecorder/scripts/optimize-screenshots.sh"
  }
}
```

Then:
```bash
npm run optimize     # After screenshots
npm run demo         # For video recording
```

## 📖 Next Steps

- See `recording-checklist.md` for detailed checklist
- See `best-practices.md` for quality tips
- See templates for README sections

---

**Time Investment**: 15-20 minutes for complete showcase
**Result**: Professional demo materials for your project
