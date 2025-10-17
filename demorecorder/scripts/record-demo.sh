#!/bin/bash

# Shellby Demo Video Recording Script
# Helps automate demo video recording using macOS screen recording

set -e

OUTPUT_DIR="docs/screenshots"
TEMP_DIR="/tmp/shellby-recording"

echo "🎬 Shellby Demo Video Recording Helper"
echo "======================================"
echo ""

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "⚠️  This script is designed for macOS. For other platforms:"
    echo "   - Linux: Use recordmydesktop, SimpleScreenRecorder, or OBS"
    echo "   - Windows: Use OBS Studio or built-in Game Bar"
    exit 1
fi

# Check for ffmpeg (needed for video processing)
if ! command -v ffmpeg &> /dev/null; then
    echo "❌ ffmpeg not found. Install with:"
    echo "   brew install ffmpeg"
    echo ""
    read -p "Continue without video processing? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Create directories
mkdir -p "$OUTPUT_DIR"
mkdir -p "$TEMP_DIR"

echo "📋 Recording Checklist:"
echo ""
echo "Before starting the recording, ensure:"
echo "  ✓ Shellby is built: npm run build"
echo "  ✓ Shellby is running: npm run dev"
echo "  ✓ Window size is appropriate: ~1440x900"
echo "  ✓ Terminal theme is set (Dracula/Tokyo Night recommended)"
echo "  ✓ Font size is readable: 14-16px"
echo "  ✓ Do Not Disturb mode is ON"
echo "  ✓ Test server credentials are ready"
echo ""

read -p "Press Enter when Shellby is ready to record..."
echo ""

echo "📹 Recording Instructions:"
echo ""
echo "  1. Use Cmd+Shift+5 to open Screen Recording"
echo "  2. Select 'Record Selected Window'"
echo "  3. Click on the Shellby window"
echo "  4. Click 'Record' button"
echo "  5. Follow the demo script (see docs/RECORDING_CHECKLIST.md)"
echo "  6. Click Stop button in menu bar when done"
echo "  7. Video will be saved to Desktop or Movies folder"
echo ""

read -p "Press Enter to open Screen Recording tool..."

# Open the screen recording tool
open -a "Screenshot"  # This opens Cmd+Shift+5 on macOS 10.14+

echo ""
echo "⏳ Waiting for you to complete the recording..."
echo "   (This script will continue after you press Enter)"
echo ""

read -p "Press Enter when recording is complete..."

echo ""
echo "📁 Where did you save the recording?"
echo "   1. Desktop"
echo "   2. Movies"
echo "   3. Other location (I'll specify)"
echo ""

read -p "Enter choice (1-3): " location_choice

case $location_choice in
    1)
        SEARCH_DIR="$HOME/Desktop"
        ;;
    2)
        SEARCH_DIR="$HOME/Movies"
        ;;
    3)
        read -p "Enter the full path to the video file: " VIDEO_FILE
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

# Find the most recent .mov file if not specified
if [ -z "$VIDEO_FILE" ]; then
    echo ""
    echo "🔍 Looking for recent screen recordings in $SEARCH_DIR..."
    VIDEO_FILE=$(find "$SEARCH_DIR" -name "Screen Recording*.mov" -type f -print0 | xargs -0 ls -t | head -n 1)

    if [ -z "$VIDEO_FILE" ]; then
        echo "❌ No screen recordings found. Please specify the path:"
        read -p "Video file path: " VIDEO_FILE
    else
        echo "✅ Found: $(basename "$VIDEO_FILE")"
    fi
fi

# Verify file exists
if [ ! -f "$VIDEO_FILE" ]; then
    echo "❌ Error: Video file not found: $VIDEO_FILE"
    exit 1
fi

FILENAME=$(basename "$VIDEO_FILE")
echo ""
echo "🎬 Processing video: $FILENAME"
echo ""

# Check if ffmpeg is available for processing
if command -v ffmpeg &> /dev/null; then
    echo "Would you like to:"
    echo "  1. Convert to web-optimized MP4"
    echo "  2. Create a short GIF demo (10-15 seconds)"
    echo "  3. Both"
    echo "  4. Skip processing (keep original)"
    echo ""

    read -p "Enter choice (1-4): " process_choice

    case $process_choice in
        1|3)
            echo ""
            echo "🔄 Converting to MP4..."
            OUTPUT_MP4="$OUTPUT_DIR/shellby-demo.mp4"
            ffmpeg -i "$VIDEO_FILE" \
                -c:v libx264 \
                -preset slow \
                -crf 22 \
                -c:a aac \
                -b:a 128k \
                -movflags +faststart \
                -vf "scale='min(1920,iw)':'min(1080,ih)':force_original_aspect_ratio=decrease" \
                "$OUTPUT_MP4" \
                -y \
                2>&1 | grep -v "frame=" || true

            if [ -f "$OUTPUT_MP4" ]; then
                MP4_SIZE=$(du -h "$OUTPUT_MP4" | cut -f1)
                echo "✅ MP4 created: $OUTPUT_MP4 ($MP4_SIZE)"
            fi
            ;;
    esac

    case $process_choice in
        2|3)
            echo ""
            echo "🎨 Creating GIF demo..."
            echo ""
            echo "For best results, specify a short segment (e.g., 5-15 seconds)"
            read -p "Start time (e.g., 00:00:05 or 5): " start_time
            read -p "Duration in seconds (e.g., 10): " duration

            OUTPUT_GIF="$OUTPUT_DIR/demo.gif"

            # Create high-quality GIF using ffmpeg
            ffmpeg -ss "$start_time" -t "$duration" -i "$VIDEO_FILE" \
                -vf "fps=20,scale=1024:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=256[p];[s1][p]paletteuse=dither=bayer:bayer_scale=5" \
                "$OUTPUT_GIF" \
                -y \
                2>&1 | grep -v "frame=" || true

            if [ -f "$OUTPUT_GIF" ]; then
                GIF_SIZE=$(du -h "$OUTPUT_GIF" | cut -f1)
                echo "✅ GIF created: $OUTPUT_GIF ($GIF_SIZE)"

                # Check if GIF is too large for GitHub
                GIF_SIZE_BYTES=$(stat -f%z "$OUTPUT_GIF" 2>/dev/null || stat -c%s "$OUTPUT_GIF" 2>/dev/null)
                MAX_SIZE=$((10 * 1024 * 1024))  # 10MB

                if [ "$GIF_SIZE_BYTES" -gt "$MAX_SIZE" ]; then
                    echo "⚠️  Warning: GIF is larger than 10MB (GitHub limit)"
                    echo "   Consider reducing duration or quality"
                fi
            fi
            ;;
    esac
else
    echo "ℹ️  Skipping video processing (ffmpeg not available)"
    echo "   Moving original file to output directory..."
    cp "$VIDEO_FILE" "$OUTPUT_DIR/shellby-demo-original.mov"
fi

echo ""
echo "======================================"
echo "✅ Recording processing complete!"
echo ""
echo "📁 Output files in: $OUTPUT_DIR"
echo ""

# List output files
echo "📹 Generated files:"
ls -lh "$OUTPUT_DIR"/*.{mp4,gif,mov} 2>/dev/null | awk '{print "   " $9 " (" $5 ")"}'

echo ""
echo "📋 Next steps:"
echo "   1. Review the video/GIF"
echo "   2. Upload video to YouTube (optional)"
echo "   3. Update README.md with video/screenshot links"
echo "   4. Commit media files to git"
echo ""
echo "💡 Tip: To create GIF from video later, use:"
echo "   npm run create-gif"
echo ""
