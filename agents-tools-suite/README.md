# Agents Tools Suite

A collection of infrastructure tools for autonomous AI agents.

Each tool is self-contained, documented, and ready for agent consumption.

## Tools

| Tool | Status | Description |
|------|--------|-------------|
| [AgentVoicemail](../README.md) | ✅ Live | Process voicemails, extract intent |
| [AgentFails](./agentfails/README.md) | 🚧 Building | Failure analytics & insights |

## Architecture

All tools follow the same pattern:

```
agents-tools-suite/
├── tool-name/
│   ├── README.md          # Tool-specific documentation
│   ├── openapi.yaml       # OpenAPI specification
│   ├── src/               # Source code
│   └── examples/          # Usage examples
```

## Shared Components

Common utilities in `shared/`:
- `solana.js` - Payment verification
- `pricing.js` - Dynamic pricing oracle
- `security.js` - Rate limiting, validation

## Payment Model

All tools use the same crypto-native payment model:
- Free tier for testing
- Pay per use with SOL
- Dynamic USD pricing
- No accounts, no humans

## Adding a New Tool

1. Create folder: `mkdir agents-tools-suite/new-tool`
2. Write OpenAPI spec: `openapi.yaml`
3. Implement API endpoints
4. Add examples in `examples/`
5. Update this README
