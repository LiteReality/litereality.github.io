#!/bin/bash

# Video compression script using FFmpeg
# This script will compress videos while maintaining good quality

echo "Starting video compression..."

# Function to compress a video
compress_video() {
    local input_file="$1"
    local output_file="$2"
    local crf="$3"
    
    echo "Compressing $input_file..."
    
    # Use H.264 with CRF (Constant Rate Factor) for good quality/size balance
    ffmpeg -i "$input_file" \
           -c:v libx264 \
           -crf "$crf" \
           -preset slow \
           -c:a aac \
           -b:a 128k \
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

# Create compressed directory
mkdir -p compressed

# Compress the largest files with different quality settings
# CRF 23 is a good balance (lower = better quality, higher = smaller file)
compress_video "0617_final.mp4" "compressed/0617_final_compressed.mp4" 23
compress_video "demo.mp4" "compressed/demo_compressed.mp4" 23
compress_video "video_demo/example_3-1.mp4" "compressed/example_3-1_compressed.mp4" 23

echo "Compression complete! Check the 'compressed' directory for results." 