# Active Processes & Background State
**Date:** February 7, 2026  
**Time:** 11:45 PM PST

---

## Running Processes

### Next.js Dev Server
```
PID: 65219
Command: node /Users/tavinsky/.../next dev
Status: Running
Port: 3000
URL: http://localhost:3000
Started: ~11:39 PM
Uptime: ~6 minutes
```

**To kill:**
```bash
kill 65219
# or
pkill -f "next dev"
```

**To restart:**
```bash
cd /Users/tavinsky/Documents/ai/agent\ ideas/agent-tools
npm run dev
```

---

## Background Tasks

### Moltbook Auto-Reply (Inactive)
```
Status: Not running
Script: auto-reply.sh
Purpose: Check for replies on Moltbook posts
Last Run: Unknown (no process found)
```

**To start:**
```bash
cd /Users/tavinsky/Documents/ai/agent\ ideas/agent-tools
chmod +x auto-reply.sh
nohup ./auto-reply.sh > auto-reply.log 2>&1 &
```

---

## Recent Terminal Activity

### Terminal 1 (zsh)
```bash
Last: ps aux | grep "next dev" | grep -v grep | head -1
CWD:  /Users/tavinsky/Documents/ai/agent ideas
Exit: 0
```

### Terminal 2 (zsh)
```bash
Last: cd /Users/tavinsky/Documents/ai/agent\ ideas/agent-tools && tail -20 dev-server.log
CWD:  /Users/tavinsky/Documents/ai/agent ideas/agent-tools
Exit: 0
```

### Terminal 3 (npm run dev)
```bash
Last: cd /Users/tavinsky/Documents/ai/agent\ ideas/agent-tools && npm run dev &
CWD:  /Users/tavinsky/Documents/ai/agent ideas
Exit: 0
PID:  65219 (still running)
```

---

## Log Files

### dev-server.log
```
Purpose: Next.js dev server output
Status: Not found (output going to terminal, not file)
```

### auto-reply.log
```
Purpose: Moltbook auto-reply script output
Status: Not found (script not running)
```

### launch-post.log
```
Purpose: Moltbook launch post output
Status: Exists (from scheduled post)
Content: Launch post published successfully
Post ID: 7518a2d3-4db1-44a7-bcc5-7c828103aa3c
```

---

## Database State (In-Memory)

### mintedDNAs Map
```javascript
// Storage: lib/agent-dna.js
// Status: Empty (no mints yet)
// Persistence: None (resets on server restart)
```

### registeredNames Map
```javascript
// Storage: lib/agent-names.js
// Status: Empty (no registrations yet)
// Persistence: None (resets on server restart)
```

### processedTransactions Map
```javascript
// Storage: lib/dedup.js
// Status: Empty (no transactions yet)
// TTL: 24 hours
// Persistence: None (resets on server restart)
```

### rateLimitCache Map
```javascript
// Storage: In each API route
// Status: Active (tracking requests)
// TTL: 1 hour
// Persistence: None (resets on server restart)
```

---

## Moltbook State

### Account: @AgentVoicemail
```
Status: Active
Following: Unknown
Followers: Unknown
API Key: Stored in .moltbook file
```

### Posts Published
1. **Main Launch Post**
   - ID: 7518a2d3-4db1-44a7-bcc5-7c828103aa3c
   - Status: Live
   - Upvotes: 7
   - Comments: 10
   - URL: https://moltbook.com/post/7518a2d3-4db1-44a7-bcc5-7c828103aa3c

2. **Comment on Security Thread**
   - Parent: Security thread (84k comments)
   - Status: Published
   - Content: Infrastructure-focused pitch

3. **Comment on Nightly Build Thread**
   - Parent: Nightly Build thread (30k comments)
   - Status: Published
   - Content: Financial autonomy pitch

### Next Post Scheduled
```
Status: None scheduled
Tools: moltbook-post.js, moltbook-comment.js
Rate Limit: 30 minutes between posts
Last Post: ~3 hours ago
```

---

## Git State

### Local Repository
```bash
Branch: main
Remote: https://github.com/Tavinsky1/realaudio
Uncommitted Changes: No (clean working directory)
Unpushed Commits: No
```

### Last Commit
```
Author: Tavinsky1
Date: Feb 7, 2026
Message: "Update project name to agenttools in vercel.json"
Files Changed: vercel.json
```

### Untracked Files
```
.moltbook              (credentials - DO NOT COMMIT)
.env.local             (API keys - DO NOT COMMIT)
node_modules/          (.gitignore - DO NOT COMMIT)
*.log                  (.gitignore)
```

---

## Vercel State

### Production Deployment
```
URL: https://agenttools.vercel.app
Status: Live
Last Deploy: ~2 hours ago (after rename)
Commit: Latest main branch
Build: Successful
```

### Environment Variables Set
```
ASSEMBLYAI_API_KEY    ✅ Set
GROQ_API_KEY          ✅ Set
HELIUS_API_KEY        ❌ Not set (not needed yet)
```

### Alias Configuration
```
Primary: agenttools.vercel.app
Old: realaudio.vercel.app (redirects to agenttools)
Custom Domain: Not configured
```

---

## External Service Status

### AssemblyAI
```
Status: Active
API Key: Valid
Free Tier: Active ($100 credit)
Usage: <$1 (mostly testing)
```

### Groq
```
Status: Active
API Key: Valid
Free Tier: Active (generous limits)
Usage: <100 requests (testing only)
```

### Solana RPC
```
Primary: https://api.mainnet-beta.solana.com
Backup: https://solana-api.projectserum.com
Status: Both operational
Rate Limit: Unknown (public endpoints)
```

### Helius (Not Set Up Yet)
```
Status: No API key
Purpose: cNFT indexing (for AgentDNA)
Required: Only when minting real cNFTs
Free Tier: Yes (generous)
```

---

## Credentials & Secrets

### Location: .moltbook (DO NOT COMMIT)
```json
{
  "api_key": "moltbook_api_key_here",
  "username": "AgentVoicemail"
}
```

### Location: .env.local (DO NOT COMMIT)
```bash
ASSEMBLYAI_API_KEY=your_key_here
GROQ_API_KEY=your_key_here
# HELIUS_API_KEY=not_set_yet
```

### Service Wallet Private Key
```
Location: NOT IN REPOSITORY (good!)
Method: Manually imported to Vercel env vars
Never commit wallet private keys!
```

---

## Next Session Checklist

### Before Starting Work
- [ ] Check if dev server is still running (kill if needed)
- [ ] Pull latest from GitHub (in case changes on another machine)
- [ ] Check Vercel deployment status
- [ ] Review Moltbook post engagement
- [ ] Check service wallet balance

### When Resuming Development
- [ ] Start dev server: `npm run dev`
- [ ] Review PROJECT_STATUS.md for strategic direction
- [ ] Review TECHNICAL_STATE.md for what's broken/working
- [ ] Check any overnight Moltbook replies

### Before Deploying Changes
- [ ] Test locally first
- [ ] Commit with descriptive message
- [ ] Push to main branch
- [ ] Wait for Vercel auto-deploy (~1 minute)
- [ ] Test in production
- [ ] Check Vercel logs for errors

---

## Emergency Contacts & References

### If Something Breaks

**Vercel Dashboard:**
https://vercel.com/dashboard

**GitHub Repo:**
https://github.com/Tavinsky1/realaudio

**Moltbook Profile:**
https://moltbook.com/u/AgentVoicemail

**Solana Explorer (Service Wallet):**
https://explorer.solana.com/address/8yQSRrGn9hSUG1n5vTidMWjVpGmBgEvrT8sWTA3WZqY

**AssemblyAI Dashboard:**
https://www.assemblyai.com/app/

**Groq Console:**
https://console.groq.com/

---

## Cleanup Commands

### Stop All Background Processes
```bash
# Kill dev server
pkill -f "next dev"

# Kill any moltbook scripts
pkill -f "moltbook"

# Kill auto-reply
pkill -f "auto-reply"

# Verify nothing left
ps aux | grep -E "next|moltbook|auto-reply" | grep -v grep
```

### Clean Build Artifacts
```bash
cd /Users/tavinsky/Documents/ai/agent\ ideas/agent-tools

# Remove build cache
rm -rf .next/

# Remove node_modules (if reinstalling)
rm -rf node_modules/

# Remove log files
rm -f *.log

# Reinstall dependencies
npm install
```

### Reset Git State
```bash
# Discard uncommitted changes
git reset --hard HEAD

# Pull latest
git pull origin main

# Clean untracked files (BE CAREFUL!)
git clean -fd
```

---

## Final State Summary

### ✅ Safe to Pause
- No payments received yet (no customer data to lose)
- No database to maintain (in-memory only)
- All code committed and pushed
- Production deployment stable
- Moltbook posts published

### ⚠️ Before Accepting First Payment
- MUST migrate to persistent database
- MUST test in production with real transaction
- MUST have monitoring in place
- MUST have backup plan

### 📊 Current Metrics
- GitHub Stars: 0 (not promoted yet)
- Moltbook Followers: Unknown
- Production Uptime: 100% (since launch)
- Payment Processing: 0 transactions
- Revenue: $0

---

**Document Status:** Complete  
**Last Updated:** February 7, 2026, 11:45 PM PST  
**Next Review:** When resuming development

---

## Quick Reference Commands

```bash
# Start dev server
cd /Users/tavinsky/Documents/ai/agent\ ideas/agent-tools && npm run dev

# Check production status
curl https://agenttools.vercel.app/api/health

# Check Moltbook post engagement
cd /Users/tavinsky/Documents/ai/agent\ ideas/agent-tools
node moltbook-post.js --check 7518a2d3-4db1-44a7-bcc5-7c828103aa3c

# Test DNA generation
curl -X POST http://localhost:3000/api/dna/generate \
  -H "Content-Type: application/json" \
  -d '{"agent_id":"test","model":"claude"}'

# Check service wallet balance
curl "https://api.mainnet-beta.solana.com" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getTokenAccountsByOwner","params":["8yQSRrGn9hSUG1n5vTidMWjVpGmBgEvrT8sWTA3WZqY",{"mint":"EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"},{"encoding":"jsonParsed"}]}'
```
