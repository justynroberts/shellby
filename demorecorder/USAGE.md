# 🎬 Using DemoRecorder in Your Projects

## For Shellby (This Project)

DemoRecorder is already set up! Just use:

```bash
# Optimize screenshots
npm run optimize-screenshots

# Record demo video (interactive)
npm run record-demo

# Convert video to GIF
npm run video-to-gif input.mp4 output.gif 5 10
```

### Shellby-Specific Guides

- `RECORDING_NOW.md` - Ready-to-go guide for Shellby with your server
- `QUICK_REFERENCE.md` - One-page cheat sheet
- `demo-server-config.json` - Your server credentials

## For Other Projects

### Copy to New Project

```bash
# Option 1: Copy the directory
cp -r demorecorder /path/to/your/new/project/

# Option 2: Create symlink (share across projects)
ln -s ~/work/terminal/demorecorder /path/to/your/project/demorecorder
```

### Add to package.json

```json
{
  "scripts": {
    "optimize-screenshots": "bash demorecorder/scripts/optimize-screenshots.sh",
    "record-demo": "bash demorecorder/scripts/record-demo.sh",
    "video-to-gif": "bash demorecorder/scripts/video-to-gif.sh"
  }
}
```

### Create Screenshots Directory

```bash
mkdir -p docs/screenshots
```

### Start Recording!

```bash
# 1. Launch your app
npm start  # or your launch command

# 2. Take screenshots (save to docs/screenshots/)
# macOS: Cmd+Shift+4, Space, Click window

# 3. Optimize
npm run optimize-screenshots

# 4. (Optional) Record video
npm run record-demo
```

## Quick Reference

### Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `optimize-screenshots.sh` | Compress PNGs | `bash demorecorder/scripts/optimize-screenshots.sh [dir]` |
| `record-demo.sh` | Interactive video guide | `bash demorecorder/scripts/record-demo.sh` |
| `video-to-gif.sh` | Convert video to GIF | `bash demorecorder/scripts/video-to-gif.sh input.mp4 output.gif` |

### Templates

| Template | Purpose |
|----------|---------|
| `recording-checklist.md` | Customize for your app's recording workflow |
| `README-sections/video-section.md` | Add video showcase to README |
| `README-sections/screenshots-section.md` | Add screenshot gallery to README |

### Guides

| Guide | Purpose |
|-------|---------|
| `quickstart.md` | 15-minute workflow for screenshots + video |
| `README.md` | Full DemoRecorder documentation |

## Examples

### Example 1: Web App

```bash
# In your web app project
cp -r ~/work/terminal/demorecorder .

# Add to package.json
npm pkg set scripts.optimize="bash demorecorder/scripts/optimize-screenshots.sh"
npm pkg set scripts.demo="bash demorecorder/scripts/record-demo.sh"

# Take screenshots of your running app
# Save to docs/screenshots/

# Optimize
npm run optimize

# Update README with template
cat demorecorder/templates/README-sections/screenshots-section.md >> README.md
```

### Example 2: Electron App

```bash
# Copy demorecorder
cp -r ~/work/terminal/demorecorder .

# Add scripts to package.json
# (same as above)

# Use the Electron screenshot capture template
# Edit demorecorder/templates/electron-screenshot-capture.js
# Customize for your app's UI

# Run automated capture
npm run build && electron demorecorder/templates/electron-screenshot-capture.js
```

### Example 3: CLI Tool

```bash
# Copy demorecorder
cp -r ~/work/terminal/demorecorder .

# For CLI tools, use asciinema instead
brew install asciinema
asciinema rec demo.cast

# Convert to GIF with asciicast2gif
npm install -g asciicast2gif
asciicast2gif demo.cast demo.gif
```

## Customization Tips

### Modify Scripts

All scripts in `demorecorder/scripts/` are standalone bash scripts.
Feel free to edit them for your needs:

- Change default directories
- Adjust compression settings
- Modify GIF parameters (FPS, size, colors)
- Add custom processing steps

### Create App-Specific Templates

Copy and customize templates for your app:

```bash
cd demorecorder/templates
cp recording-checklist.md my-app-recording.md
# Edit my-app-recording.md with your app's specific workflow
```

### Share Across Projects

Create a central location:

```bash
# Move to a shared location
mv ~/work/terminal/demorecorder ~/shared-tools/demorecorder

# Symlink in each project
cd ~/work/project1
ln -s ~/shared-tools/demorecorder demorecorder

cd ~/work/project2
ln -s ~/shared-tools/demorecorder demorecorder
```

Now updates to demorecorder apply to all projects!

## Advanced Usage

### Batch Screenshot Optimization

```bash
# Optimize all screenshots in multiple directories
for dir in docs/screenshots docs/images assets/screenshots; do
  if [ -d "$dir" ]; then
    bash demorecorder/scripts/optimize-screenshots.sh "$dir"
  fi
done
```

### Automated Video Processing

```bash
# Process multiple videos
for video in recordings/*.mov; do
  basename=$(basename "$video" .mov)
  bash demorecorder/scripts/video-to-gif.sh "$video" "gifs/${basename}.gif" 5 10
done
```

### CI/CD Integration

Add to GitHub Actions:

```yaml
# .github/workflows/docs.yml
name: Optimize Screenshots

on:
  push:
    paths:
      - 'docs/screenshots/*.png'

jobs:
  optimize:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install tools
        run: sudo apt-get install -y optipng pngquant
      - name: Optimize
        run: bash demorecorder/scripts/optimize-screenshots.sh
      - name: Commit
        run: |
          git config --global user.name 'GitHub Actions'
          git config --global user.email 'actions@github.com'
          git add docs/screenshots/
          git commit -m "Optimize screenshots" || echo "No changes"
          git push
```

## Troubleshooting

**Q**: Scripts don't work on Windows
**A**: Use Git Bash, WSL, or adapt scripts to PowerShell

**Q**: ffmpeg not found
**A**: Install: `brew install ffmpeg` (macOS) or `apt-get install ffmpeg` (Linux)

**Q**: Images already optimized
**A**: That's fine! The optimizer preserves quality and skips if no improvement

**Q**: GIF too large
**A**: Edit `video-to-gif.sh` to reduce FPS, resolution, or colors

## Support

For issues specific to DemoRecorder:
- Check the guides in `demorecorder/guides/`
- Review examples in this file
- Modify scripts as needed (they're standalone bash)

For issues with your specific app:
- Customize the templates for your use case
- Adjust recording workflows in the checklist

---

**DemoRecorder Version**: 1.0.0
**Created For**: Shellby by FintonLabs
**License**: MIT (same as parent project)
