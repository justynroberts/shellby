# 🎬 Recording Checklist Template

Customize this checklist for your app's showcase recording.

## 📋 Pre-Recording Setup

### System Preparation
- [ ] Close unnecessary applications
- [ ] Enable "Do Not Disturb" mode
- [ ] Clean desktop (hide icons if possible)
- [ ] Disable notifications
- [ ] Check battery/power (if laptop)
- [ ] Clear browser tabs with sensitive info

### App Setup
- [ ] Build fresh: `npm run build` or equivalent
- [ ] Launch app
- [ ] Set window size: ~1440x900 or appropriate size
- [ ] Configure attractive theme/styling
- [ ] Set readable font size (14-16px if applicable)
- [ ] Clear any existing test data for clean demo

### Content Preparation
- [ ] Test data ready
- [ ] Demo files prepared
- [ ] Test accounts created (if needed)
- [ ] Interesting content to show (not empty screens)

## 📸 Screenshot Checklist

Customize this list for your app's key features:

- [ ] **Main Interface** (`screenshot-main.png`)
  - Hero shot of your app
  - Show key features visible

- [ ] **Feature 1** (`screenshot-feature-1.png`)
  - [Describe what to show]

- [ ] **Feature 2** (`screenshot-feature-2.png`)
  - [Describe what to show]

- [ ] **Feature 3** (`screenshot-feature-3.png`)
  - [Describe what to show]

- [ ] **Settings/Config** (`screenshot-settings.png`)
  - Configuration panel
  - Customization options

- [ ] **Additional Views** (`screenshot-*.png`)
  - [List other important screens]

**Capture Method**:
- macOS: Cmd+Shift+4, Space, Click window
- Windows: Win+Shift+S or Snipping Tool
- Linux: Screenshot utility or flameshot

**Save to**: `docs/screenshots/`

## 🎥 Video Recording Checklist

### Before Recording
- [ ] Recording software ready (OBS, QuickTime, etc.)
- [ ] Recording area/window selected
- [ ] Audio configured (if doing voiceover)
- [ ] Demo script prepared
- [ ] Practice run completed
- [ ] Stopwatch/timer ready (aim for 60-90 seconds)

### Recording Sequence

Customize this for your app:

**Scene 1: Introduction (5-10 seconds)**
- [ ] Show app launching or main screen
- [ ] Highlight app name/branding

**Scene 2: Key Feature 1 (15-20 seconds)**
- [ ] Demonstrate [feature name]
- [ ] Show [specific action]
- [ ] Highlight [benefit]

**Scene 3: Key Feature 2 (15-20 seconds)**
- [ ] Demonstrate [feature name]
- [ ] Show [specific action]
- [ ] Highlight [benefit]

**Scene 4: Key Feature 3 (10-15 seconds)**
- [ ] Demonstrate [feature name]
- [ ] Show [specific action]

**Scene 5: Additional Features (10-15 seconds)**
- [ ] Quick overview of other capabilities
- [ ] Show versatility

**Scene 6: Closing (5 seconds)**
- [ ] Final screen
- [ ] Call to action or GitHub link

### After Recording
- [ ] Recording saved successfully
- [ ] Review recording for errors
- [ ] Check video quality and audio
- [ ] Note any sections to re-record

## ✅ Post-Production Checklist

### Image Optimization
- [ ] Run `optimize-screenshots.sh`
- [ ] Verify file sizes <500KB each
- [ ] Check image quality maintained
- [ ] Remove any sensitive information

### Video Processing
- [ ] Trim start/end (remove dead space)
- [ ] Add title card (optional)
- [ ] Add end card with GitHub URL (optional)
- [ ] Export as MP4, 1080p, 30fps
- [ ] Create GIF excerpt (8-15 seconds)
- [ ] Verify GIF <10MB for GitHub

### Documentation
- [ ] Update README with screenshots
- [ ] Add video embed (YouTube or direct)
- [ ] Verify all image links work
- [ ] Add screenshot descriptions

### Version Control
- [ ] Add screenshots to git
- [ ] Add video/GIF if hosting in repo
- [ ] Update README
- [ ] Create commit with descriptive message
- [ ] Push to remote repository

## 💡 Tips for Great Recordings

**DO**:
- Move cursor deliberately (not too fast)
- Show real functionality (not mock-ups)
- Keep text/UI readable (14px+ fonts)
- Use attractive themes (dark themes often look better)
- Plan transitions between features
- Show concrete results/outputs

**DON'T**:
- Rush through features
- Show error messages (unless intentional)
- Include sensitive information
- Use tiny fonts
- Have cluttered screens
- Show excessive waiting/loading

## 🎯 Quality Checklist

Before publishing:
- [ ] All screenshots captured
- [ ] Images optimized
- [ ] Video recorded (if applicable)
- [ ] Video processed and optimized
- [ ] No sensitive information visible
- [ ] All links in README work
- [ ] Images render correctly on GitHub
- [ ] File sizes reasonable
- [ ] Committed to version control

---

**Ready to record?** Check off each item as you go!

**Stuck?** See the guides in `demorecorder/guides/` for detailed help.
