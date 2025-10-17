#!/bin/bash

# Automated Video Recording for macOS Apps
# Uses ffmpeg with screen capture to record a specific window

set -e

APP_NAME="${1:-Electron}"
DURATION="${2:-60}"
OUTPUT_DIR="docs/screenshots"
OUTPUT_FILE="$OUTPUT_DIR/demo-recording.mov"

echo "🎥 Automated App Video Recording"
echo "================================="
echo ""
echo "App: $APP_NAME"
echo "Duration: ${DURATION}s"
echo "Output: $OUTPUT_FILE"
echo ""

# Check for ffmpeg
if ! command -v ffmpeg &> /dev/null; then
    echo "❌ ffmpeg not found. Installing..."
    echo ""
    read -p "Install ffmpeg via Homebrew? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        brew install ffmpeg
    else
        echo "Please install ffmpeg: brew install ffmpeg"
        exit 1
    fi
fi

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ This script is for macOS only"
    exit 1
fi

echo "🔍 Looking for $APP_NAME window..."

# Get window bounds using AppleScript
WINDOW_INFO=$(osascript -e "
tell application \"System Events\"
    try
        set frontApp to first process whose name contains \"$APP_NAME\"
        set frontWindow to front window of frontApp
        set windowPosition to position of frontWindow
        set windowSize to size of frontWindow
        return (item 1 of windowPosition) & \" \" & (item 2 of windowPosition) & \" \" & (item 1 of windowSize) & \" \" & (item 2 of windowSize)
    on error
        return \"\"
    end try
end tell
" 2>/dev/null)

if [ -z "$WINDOW_INFO" ]; then
    echo "⚠️  Could not find $APP_NAME window"
    echo "Using full screen capture instead..."

    # Capture full screen
    ffmpeg -f avfoundation \
        -framerate 30 \
        -i "1:none" \
        -t "$DURATION" \
        -c:v libx264 \
        -preset ultrafast \
        -crf 18 \
        "$OUTPUT_FILE" \
        -y \
        2>&1 | grep -v "frame=" || true
else
    # Parse window info
    read X Y W H <<< "$WINDOW_INFO"

    echo "✅ Found window at: x=$X y=$Y w=$W h=$H"
    echo ""
    echo "🎬 Recording will start in 3 seconds..."
    echo "   Prepare the app for demonstration"
    echo ""

    sleep 3

    echo "🔴 Recording... ($DURATION seconds)"
    echo ""

    # Record full screen (cropping can be done in post)
    ffmpeg -f avfoundation \
        -framerate 30 \
        -i "1:none" \
        -t "$DURATION" \
        -c:v libx264 \
        -preset ultrafast \
        -crf 18 \
        -pix_fmt yuv420p \
        "$OUTPUT_FILE" \
        -y \
        2>&1 | grep -v "frame=" || true
fi

# Check if recording was successful
if [ -f "$OUTPUT_FILE" ]; then
    FILE_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
    echo ""
    echo "✅ Recording complete!"
    echo ""
    echo "📹 Video: $OUTPUT_FILE"
    echo "📊 Size: $FILE_SIZE"
    echo ""

    # Offer to convert to web-optimized MP4
    echo "Convert to web-optimized MP4? (y/n)"
    read -p "> " -n 1 -r
    echo

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🔄 Converting to web-optimized MP4..."
        OUTPUT_MP4="$OUTPUT_DIR/shellby-demo.mp4"

        ffmpeg -i "$OUTPUT_FILE" \
            -c:v libx264 \
            -preset slow \
            -crf 22 \
            -movflags +faststart \
            -vf "scale='min(1920,iw)':'min(1080,ih)':force_original_aspect_ratio=decrease" \
            "$OUTPUT_MP4" \
            -y \
            2>&1 | grep -v "frame=" || true

        if [ -f "$OUTPUT_MP4" ]; then
            MP4_SIZE=$(du -h "$OUTPUT_MP4" | cut -f1)
            echo "✅ Optimized: $OUTPUT_MP4 ($MP4_SIZE)"
        fi
    fi

    # Offer to create GIF
    echo ""
    echo "Create GIF preview? (y/n)"
    read -p "> " -n 1 -r
    echo

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Enter start time (seconds, e.g., 5): "
        read START_TIME
        echo "Enter duration (seconds, e.g., 10): "
        read GIF_DURATION

        OUTPUT_GIF="$OUTPUT_DIR/demo.gif"

        echo "🎨 Creating GIF..."
        ffmpeg -ss "$START_TIME" -t "$GIF_DURATION" -i "$OUTPUT_FILE" \
            -vf "fps=20,scale=1024:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=256[p];[s1][p]paletteuse=dither=bayer:bayer_scale=5" \
            "$OUTPUT_GIF" \
            -y \
            2>&1 | grep -v "frame=" || true

        if [ -f "$OUTPUT_GIF" ]; then
            GIF_SIZE=$(du -h "$OUTPUT_GIF" | cut -f1)
            echo "✅ GIF created: $OUTPUT_GIF ($GIF_SIZE)"

            # Check size
            GIF_SIZE_BYTES=$(stat -f%z "$OUTPUT_GIF" 2>/dev/null)
            if [ "$GIF_SIZE_BYTES" -gt 10485760 ]; then
                echo "⚠️  Warning: GIF is larger than 10MB (GitHub limit)"
            fi
        fi
    fi

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ Video recording complete!"
    echo ""
    echo "📁 Files in: $OUTPUT_DIR"
    ls -lh "$OUTPUT_DIR"/*.{mov,mp4,gif} 2>/dev/null || true

else
    echo "❌ Recording failed"
    exit 1
fi

echo ""
