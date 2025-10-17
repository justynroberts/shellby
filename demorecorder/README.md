# 🎬 DemoRecorder - Reusable App Showcase Toolkit

A portable toolkit for creating professional screenshots and videos for your Electron apps, web apps, or any software project.

## 📦 What's Included

- **Automated screenshot capture** - Capture key UI states automatically or manually
- **Video recording guides** - Step-by-step recording workflows
- **Image optimization** - Compress PNGs/GIFs while maintaining quality
- **Video processing** - Convert to web-optimized MP4 and create GIFs
- **Templates** - Ready-to-use README sections and documentation

## 🚀 Quick Start

### Copy to Your Project

```bash
# Copy the entire demorecorder directory to your project
cp -r demorecorder /path/to/your/project/

# Or create a symlink if you want to share across projects
ln -s ~/work/terminal/demorecorder /path/to/your/project/demorecorder
```

### Install Dependencies (Optional)

For full automation:

```bash
# macOS
brew install ffmpeg optipng pngquant

# Ubuntu/Debian
sudo apt-get install ffmpeg optipng pngquant
```

### Add to package.json

```json
{
  "scripts": {
    "optimize-screenshots": "bash demorecorder/scripts/optimize-screenshots.sh",
    "record-demo": "bash demorecorder/scripts/record-demo.sh"
  }
}
```

## 📸 Manual Screenshot Workflow

### 1. Prepare Your App

- Build and launch your app
- Set window size to ~1440x900
- Choose attractive theme/styling
- Enable Do Not Disturb mode

### 2. Capture Screenshots

**macOS**:
- `Cmd+Shift+4` → `Space` → Click window
- Or `Cmd+Shift+5` for advanced options

**Save to**: `docs/screenshots/` or your preferred location

### 3. Optimize Images

```bash
bash demorecorder/scripts/optimize-screenshots.sh
```

This will compress PNGs by 30-70% while maintaining quality.

## 🎥 Video Recording Workflow

### 1. Plan Your Demo

Use the templates in `templates/` as a starting point:
- `recording-checklist.md` - Step-by-step recording guide
- `demo-script.md` - Sample demo script template

### 2. Record

**Option A: Built-in Screen Recording (macOS)**
```bash
bash demorecorder/scripts/record-demo.sh
```

Follow the interactive guide.

**Option B: OBS Studio**
- Window Capture or Display Capture
- 1920x1080, 30-60fps, MP4 format
- Follow your demo script

### 3. Process Video

The `record-demo.sh` script will help you:
- Convert to web-optimized MP4
- Create short GIF demos (10-15 seconds)
- Optimize file sizes for GitHub/web

## 📋 Screenshot Checklist Template

Adapt this checklist for your app:

- [ ] Main interface (hero shot)
- [ ] Key feature #1
- [ ] Key feature #2
- [ ] Key feature #3
- [ ] Settings/configuration panel
- [ ] Additional features
- [ ] Dark/light mode variants (if applicable)

## 🎯 Best Practices

### Screenshots
- **Resolution**: 1920x1080 or higher
- **Format**: PNG (lossless)
- **File size**: Keep under 500KB each (use optimizer)
- **Consistency**: Same window size for all screenshots
- **Content**: Remove sensitive information
- **Text**: Ensure readable font size (14-16px minimum)

### Videos
- **Duration**: 60-90 seconds ideal for README
- **Format**: MP4 (H.264) for web
- **Resolution**: 1920x1080
- **Frame rate**: 30-60 fps
- **File size**: <50MB for GitHub, smaller is better
- **Audio**: Optional (music or voiceover)

### GIFs
- **Duration**: 8-15 seconds (focus on one feature)
- **File size**: <10MB (GitHub limit)
- **FPS**: 20-30 fps
- **Resolution**: 1024px width maximum

## 🛠️ Scripts Reference

### `optimize-screenshots.sh`

Optimizes PNG files using optipng and pngquant.

**Usage**:
```bash
bash demorecorder/scripts/optimize-screenshots.sh [directory]
```

**Default directory**: `docs/screenshots`

**Features**:
- Backs up originals to `originals/` subdirectory
- Shows before/after file sizes
- Reports total space saved
- Preserves image quality

### `record-demo.sh`

Interactive video recording helper.

**Usage**:
```bash
bash demorecorder/scripts/record-demo.sh
```

**Features**:
- Pre-recording checklist
- Guides you through screen recording
- Converts to web-optimized MP4
- Creates GIF from video segment
- Checks file sizes against GitHub limits

## 📝 README Templates

Use the templates in `templates/README-sections/` to add showcase sections to your project README:

- `video-section.md` - Video showcase with YouTube embed
- `screenshots-section.md` - Screenshot gallery
- `badges-section.md` - Status badges for your README

## 🎨 Customization

### For Electron Apps

Use `templates/electron-screenshot-capture.js` as a starting point for automated screenshot capture in Electron apps.

### For Web Apps

Use browser DevTools or extensions:
- **Full Page Screen Capture** (Chrome/Firefox extension)
- **Awesome Screenshot** (Chrome/Firefox extension)
- DevTools: Cmd+Shift+P → "Capture screenshot"

### For CLI Apps

Use **asciinema** for terminal recording:
```bash
brew install asciinema
asciinema rec demo.cast
```

## 📦 Directory Structure

```
demorecorder/
├── README.md (this file)
├── scripts/
│   ├── optimize-screenshots.sh
│   ├── record-demo.sh
│   └── video-to-gif.sh
├── templates/
│   ├── recording-checklist.md
│   ├── demo-script.md
│   ├── electron-screenshot-capture.js
│   └── README-sections/
│       ├── video-section.md
│       ├── screenshots-section.md
│       └── badges-section.md
└── guides/
    ├── quickstart.md
    ├── best-practices.md
    └── video-editing-tips.md
```

## 🎓 Examples

### Example Project Structure

After using DemoRecorder:

```
your-project/
├── demorecorder/           # This toolkit
├── docs/
│   └── screenshots/
│       ├── screenshot-1.png
│       ├── screenshot-2.png
│       ├── demo.gif
│       └── demo.mp4
├── README.md              # With showcase sections
└── package.json           # With demo scripts
```

### Example README Section

```markdown
## 🎬 Demo

[![Project Demo](docs/screenshots/screenshot-1.png)](https://youtube.com/watch?v=YOUR_VIDEO)

### Screenshots

![Main Interface](docs/screenshots/screenshot-1.png)
![Feature Overview](docs/screenshots/screenshot-2.png)
```

## 🔧 Troubleshooting

**Issue**: Screenshots too large
- **Solution**: Run `optimize-screenshots.sh` to compress

**Issue**: Video file too big
- **Solution**: Increase compression (`-crf 28`), reduce resolution, or trim duration

**Issue**: GIF too large (>10MB)
- **Solution**: Reduce FPS, resolution, duration, or color palette

**Issue**: Can't capture window on macOS
- **Solution**: Grant Screen Recording permissions in System Preferences → Security & Privacy

## 📖 Further Reading

See the `guides/` directory for:
- Detailed quickstart guide
- Best practices for screenshots and videos
- Video editing tips and tools
- Platform-specific recording instructions

## 🤝 Contributing

This toolkit was created for reuse across multiple projects. Improvements welcome!

## 📝 License

Same as parent project (MIT).

---

**Created for**: Professional app showcases, GitHub READMEs, and product demos

**Works with**: Electron apps, web apps, CLI tools, mobile apps (with emulator), and more

**Version**: 1.0.0
