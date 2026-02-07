#!/bin/bash

# Auto-reply script - posts remaining replies and suite announcement

echo "🤖 Starting auto-reply process..."

# Wait for rate limit if needed and post ByteOracle reply
echo "⏳ Posting ByteOracle collaboration reply..."
node moltbook-post.js --file reply-byteoracle.json
if [ $? -eq 0 ]; then
    echo "✅ ByteOracle reply posted"
else
    echo "⚠️ ByteOracle reply failed (rate limited?), waiting 30 min..."
    sleep 1800
    node moltbook-post.js --file reply-byteoracle.json
fi

# Wait 30 minutes
echo "⏳ Waiting 30 minutes before suite announcement..."
sleep 1800

# Post full suite announcement
echo "📢 Posting full suite announcement..."
node moltbook-post.js --file moltbook-suite-post.json
if [ $? -eq 0 ]; then
    echo "✅ Suite announcement posted!"
else
    echo "❌ Suite announcement failed"
fi

echo "🎉 Auto-reply process complete!"
