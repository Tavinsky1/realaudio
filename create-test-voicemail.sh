#!/bin/bash

# Create Test Voicemail Audio using macOS Text-to-Speech

echo "🎙️ Creating test voicemail audio..."

# Sample voicemail message
MESSAGE="Hi, this is John calling about tomorrow's project meeting. 
I wanted to confirm the time - I think we said 2 PM but just wanted to double check. 
Also, I have some updates on the budget that I'd like to discuss. 
Could you give me a call back when you get a chance? 
My number is 555-0123. Thanks, talk to you soon."

# Output file
OUTPUT_FILE="test-voicemail.aiff"
MP3_FILE="test-voicemail.mp3"

# Use macOS 'say' command with a realistic voice
say -v "Alex" -o "$OUTPUT_FILE" "$MESSAGE"

echo "✅ Created: $OUTPUT_FILE"

# Try to convert to MP3 if ffmpeg is available
if command -v ffmpeg &> /dev/null; then
    ffmpeg -i "$OUTPUT_FILE" -acodec libmp3lame -ab 128k -y "$MP3_FILE" 2>/dev/null
    echo "✅ Converted to MP3: $MP3_FILE"
    rm "$OUTPUT_FILE"
    echo ""
    echo "🎵 Audio file ready: $MP3_FILE"
else
    echo "⚠️  ffmpeg not installed - using AIFF format"
    echo "   Install ffmpeg: brew install ffmpeg"
    echo ""
    echo "🎵 Audio file ready: $OUTPUT_FILE"
fi

echo ""
echo "Next steps:"
echo "1. Upload this file to a public URL (see options below)"
echo "2. Test with: node test-api-real.js http://localhost:3000"
echo ""
echo "Upload options:"
echo "  • https://tmpfiles.org (quick, 1-hour limit)"
echo "  • https://file.io (one-time download)"
echo "  • Your own S3/Cloudflare/etc"
