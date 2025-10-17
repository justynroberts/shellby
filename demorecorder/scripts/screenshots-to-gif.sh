#!/bin/bash

# Create animated GIF from screenshots
# Perfect for README showcases

set -e

SCREENSHOTS_DIR="${1:-docs/screenshots}"
OUTPUT_GIF="${2:-docs/screenshots/demo.gif}"
DELAY="${3:-200}" # Delay between frames in centiseconds (200 = 2 seconds)

echo "🎨 Creating Animated GIF from Screenshots"
echo "=========================================="
echo ""

# Check for ImageMagick
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick not found"
    echo ""
    echo "Install with:"
    echo "  macOS:    brew install imagemagick"
    echo "  Ubuntu:   sudo apt-get install imagemagick"
    exit 1
fi

# Find screenshot files
SCREENSHOTS=$(ls "$SCREENSHOTS_DIR"/screenshot-*.png 2>/dev/null | sort)

if [ -z "$SCREENSHOTS" ]; then
    echo "❌ No screenshots found in $SCREENSHOTS_DIR"
    exit 1
fi

COUNT=$(echo "$SCREENSHOTS" | wc -l | tr -d ' ')
echo "📸 Found $COUNT screenshots"
echo ""

# Create temporary directory for resized images
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

echo "🔄 Resizing images for GIF..."
i=1
for img in $SCREENSHOTS; do
    basename=$(basename "$img")
    echo "   [$i/$COUNT] $basename"

    # Resize to max width 1024px, maintain aspect ratio
    convert "$img" -resize 1024x\> "$TEMP_DIR/$basename"
    ((i++))
done

echo ""
echo "🎬 Creating animated GIF..."
echo "   Delay: ${DELAY} centiseconds ($(echo "scale=1; $DELAY/100" | bc)s per frame)"

# Create GIF
convert -delay "$DELAY" -loop 0 "$TEMP_DIR"/screenshot-*.png "$OUTPUT_GIF"

# Optimize GIF
echo "🗜️  Optimizing GIF size..."
if command -v gifsicle &> /dev/null; then
    gifsicle -O3 --colors 256 "$OUTPUT_GIF" -o "$OUTPUT_GIF"
    echo "   ✅ Optimized with gifsicle"
else
    echo "   ℹ️  Install gifsicle for better optimization: brew install gifsicle"
fi

# Check result
if [ -f "$OUTPUT_GIF" ]; then
    FILE_SIZE=$(du -h "$OUTPUT_GIF" | cut -f1)
    FILE_SIZE_BYTES=$(stat -f%z "$OUTPUT_GIF" 2>/dev/null || stat -c%s "$OUTPUT_GIF" 2>/dev/null)

    echo ""
    echo "✅ GIF created successfully!"
    echo ""
    echo "📹 Output: $OUTPUT_GIF"
    echo "📊 Size: $FILE_SIZE"
    echo "🖼️  Frames: $COUNT"
    echo ""

    # Check GitHub limit
    MAX_SIZE=$((10 * 1024 * 1024))  # 10MB
    if [ "$FILE_SIZE_BYTES" -gt "$MAX_SIZE" ]; then
        echo "⚠️  Warning: GIF is larger than 10MB (GitHub limit)"
        echo ""
        echo "To reduce size:"
        echo "  1. Reduce delay: $0 $SCREENSHOTS_DIR $OUTPUT_GIF 150"
        echo "  2. Use fewer screenshots"
        echo "  3. Further optimize with gifsicle"
    else
        echo "✅ Size is within GitHub's 10MB limit"
    fi

    echo ""
    echo "📋 Add to README.md:"
    echo ""
    echo "## Demo"
    echo "![Shellby Demo]($OUTPUT_GIF)"
    echo ""
else
    echo "❌ Failed to create GIF"
    exit 1
fi
