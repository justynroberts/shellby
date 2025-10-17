#!/bin/bash

# Convert Video to High-Quality GIF
# Usage: ./video-to-gif.sh input.mp4 [output.gif] [start_time] [duration]

set -e

if [ $# -lt 1 ]; then
    echo "Usage: $0 input_video [output.gif] [start_time] [duration]"
    echo ""
    echo "Examples:"
    echo "  $0 demo.mp4                          # Convert entire video"
    echo "  $0 demo.mp4 output.gif               # Specify output name"
    echo "  $0 demo.mp4 output.gif 5 10          # Start at 5s, duration 10s"
    echo "  $0 demo.mp4 output.gif 00:00:05 10   # Same with timestamp"
    exit 1
fi

INPUT="$1"
OUTPUT="${2:-demo.gif}"
START="${3:-0}"
DURATION="${4:-}"

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "❌ Error: ffmpeg is required but not installed"
    echo ""
    echo "Install with:"
    echo "  macOS:    brew install ffmpeg"
    echo "  Ubuntu:   sudo apt-get install ffmpeg"
    exit 1
fi

# Check if input file exists
if [ ! -f "$INPUT" ]; then
    echo "❌ Error: Input file not found: $INPUT"
    exit 1
fi

echo "🎨 Converting video to GIF"
echo "=========================="
echo ""
echo "Input:    $INPUT"
echo "Output:   $OUTPUT"
echo "Start:    ${START}s"
if [ -n "$DURATION" ]; then
    echo "Duration: ${DURATION}s"
fi
echo ""

# Build ffmpeg command
FFMPEG_CMD="ffmpeg"

# Add start time if specified
if [ "$START" != "0" ]; then
    FFMPEG_CMD="$FFMPEG_CMD -ss $START"
fi

# Add duration if specified
if [ -n "$DURATION" ]; then
    FFMPEG_CMD="$FFMPEG_CMD -t $DURATION"
fi

# Add input file
FFMPEG_CMD="$FFMPEG_CMD -i \"$INPUT\""

# Add filters for high-quality GIF
# - fps=20: 20 frames per second (good balance)
# - scale=1024:-1: Width 1024px, height auto
# - palettegen: Generate optimal color palette
# - paletteuse: Apply palette with dithering
FFMPEG_CMD="$FFMPEG_CMD -vf \"fps=20,scale=1024:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=256[p];[s1][p]paletteuse=dither=bayer:bayer_scale=5\""

# Output file
FFMPEG_CMD="$FFMPEG_CMD \"$OUTPUT\" -y"

# Execute
echo "🔄 Processing..."
eval $FFMPEG_CMD 2>&1 | grep -v "frame=" || true

# Check if output was created
if [ -f "$OUTPUT" ]; then
    FILE_SIZE=$(stat -f%z "$OUTPUT" 2>/dev/null || stat -c%s "$OUTPUT" 2>/dev/null)
    FILE_SIZE_MB=$((FILE_SIZE / 1024 / 1024))
    FILE_SIZE_KB=$((FILE_SIZE / 1024))

    echo ""
    echo "✅ GIF created successfully!"
    echo ""
    echo "File: $OUTPUT"

    if [ $FILE_SIZE_MB -gt 0 ]; then
        echo "Size: ${FILE_SIZE_MB}MB"
    else
        echo "Size: ${FILE_SIZE_KB}KB"
    fi

    # Warn if too large for GitHub
    MAX_SIZE=$((10 * 1024 * 1024))  # 10MB
    if [ "$FILE_SIZE" -gt "$MAX_SIZE" ]; then
        echo ""
        echo "⚠️  Warning: File is larger than 10MB (GitHub limit)"
        echo ""
        echo "To reduce size, try:"
        echo "  1. Shorter duration: $0 $INPUT $OUTPUT $START 8"
        echo "  2. Lower FPS (edit script): fps=15 instead of fps=20"
        echo "  3. Smaller width (edit script): scale=800:-1 instead of 1024"
        echo "  4. Fewer colors (edit script): max_colors=128 instead of 256"
    fi
else
    echo "❌ Error: Failed to create GIF"
    exit 1
fi

echo ""
