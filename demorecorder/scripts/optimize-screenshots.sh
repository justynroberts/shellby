#!/bin/bash

# Screenshot Optimization Script for Shellby
# Optimizes PNG files for web use while maintaining quality

set -e

SCREENSHOT_DIR="docs/screenshots"
BACKUP_DIR="docs/screenshots/originals"

echo "🎨 Shellby Screenshot Optimization Tool"
echo "========================================"
echo ""

# Check if screenshots directory exists
if [ ! -d "$SCREENSHOT_DIR" ]; then
    echo "❌ Error: $SCREENSHOT_DIR directory not found"
    exit 1
fi

# Count PNG files
PNG_COUNT=$(find "$SCREENSHOT_DIR" -maxdepth 1 -name "*.png" | wc -l)

if [ "$PNG_COUNT" -eq 0 ]; then
    echo "⚠️  No PNG files found in $SCREENSHOT_DIR"
    exit 0
fi

echo "📊 Found $PNG_COUNT PNG file(s) to optimize"
echo ""

# Create backup directory
if [ ! -d "$BACKUP_DIR" ]; then
    mkdir -p "$BACKUP_DIR"
    echo "✅ Created backup directory: $BACKUP_DIR"
fi

# Check for optimization tools
HAS_OPTIPNG=false
HAS_PNGQUANT=false
HAS_SIPS=false

if command -v optipng &> /dev/null; then
    HAS_OPTIPNG=true
    echo "✅ Found: optipng"
fi

if command -v pngquant &> /dev/null; then
    HAS_PNGQUANT=true
    echo "✅ Found: pngquant"
fi

if command -v sips &> /dev/null; then
    HAS_SIPS=true
    echo "✅ Found: sips (macOS)"
fi

if [ "$HAS_OPTIPNG" = false ] && [ "$HAS_PNGQUANT" = false ] && [ "$HAS_SIPS" = false ]; then
    echo ""
    echo "⚠️  No optimization tools found. Installing recommendations:"
    echo ""
    echo "   macOS (Homebrew):"
    echo "   brew install optipng pngquant"
    echo ""
    echo "   Linux (Ubuntu/Debian):"
    echo "   sudo apt-get install optipng pngquant"
    echo ""
    echo "   Using basic optimization only..."
    echo ""
fi

# Process each PNG file
TOTAL_SAVED=0

for file in "$SCREENSHOT_DIR"/*.png; do
    # Skip if in backup directory
    if [[ "$file" == *"/originals/"* ]]; then
        continue
    fi

    filename=$(basename "$file")
    echo ""
    echo "📸 Processing: $filename"

    # Get original size
    ORIGINAL_SIZE=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
    ORIGINAL_SIZE_KB=$((ORIGINAL_SIZE / 1024))

    # Backup original
    cp "$file" "$BACKUP_DIR/$filename"

    # Optimize with available tools
    if [ "$HAS_PNGQUANT" = true ]; then
        echo "   🔄 Running pngquant..."
        pngquant --quality=80-95 --force --output "$file" "$file" 2>/dev/null || true
    fi

    if [ "$HAS_OPTIPNG" = true ]; then
        echo "   🔄 Running optipng..."
        optipng -o2 -quiet "$file" || true
    fi

    if [ "$HAS_SIPS" = true ] && [ "$HAS_PNGQUANT" = false ]; then
        # Use sips as fallback on macOS
        echo "   🔄 Running sips compression..."
        sips -s format png -s formatOptions high "$file" --out "$file" >/dev/null 2>&1 || true
    fi

    # Get new size
    NEW_SIZE=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
    NEW_SIZE_KB=$((NEW_SIZE / 1024))
    SAVED=$((ORIGINAL_SIZE - NEW_SIZE))
    SAVED_KB=$((SAVED / 1024))
    TOTAL_SAVED=$((TOTAL_SAVED + SAVED))

    if [ "$SAVED" -gt 0 ]; then
        PERCENT=$((SAVED * 100 / ORIGINAL_SIZE))
        echo "   ✅ ${ORIGINAL_SIZE_KB}KB → ${NEW_SIZE_KB}KB (saved ${SAVED_KB}KB, -${PERCENT}%)"
    else
        echo "   ℹ️  Already optimized (${NEW_SIZE_KB}KB)"
    fi
done

TOTAL_SAVED_KB=$((TOTAL_SAVED / 1024))

echo ""
echo "========================================"
echo "✅ Optimization complete!"
echo ""
echo "📊 Total space saved: ${TOTAL_SAVED_KB}KB"
echo "📁 Original files backed up to: $BACKUP_DIR"
echo ""
echo "📋 Next steps:"
echo "   1. Review optimized screenshots in $SCREENSHOT_DIR"
echo "   2. If satisfied, you can remove backups: rm -rf $BACKUP_DIR"
echo "   3. Update README.md and commit changes"
echo ""
