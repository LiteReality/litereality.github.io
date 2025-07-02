#!/bin/bash

# Aggressive video compression script
# This will create even smaller files but with some quality loss

echo "Starting aggressive video compression..."

compress_aggressive() {
    local input_file="$1"
    local output_file="$2"
    
    echo "Compressing $input_file (aggressive mode)..."
    
    # More aggressive settings: CRF 28 (higher = smaller file, lower quality)
    # Also reducing resolution for very large files
    ffmpeg -i "$input_file" \
           -c:v libx264 \
           -crf 28 \
           -preset slow \
           -vf "scale=min(1920,iw):min(1080,ih)" \
           -c:a aac \
           -b:a 96k \
           -movflags +faststart \
           "$output_file"
    
    if [ $? -eq 0 ]; then
        echo "✅ Successfully compressed $input_file"
        echo "Original size: $(du -h "$input_file" | cut -f1)"
        echo "Compressed size: $(du -h "$output_file" | cut -f1)"
    else
        echo "❌ Failed to compress $input_file"
    fi
    echo ""
}

mkdir -p compressed_aggressive

# Compress with more aggressive settings
compress_aggressive "0617_final.mp4" "compressed_aggressive/0617_final_small.mp4"
compress_aggressive "demo.mp4" "compressed_aggressive/demo_small.mp4"

echo "Aggressive compression complete!" 