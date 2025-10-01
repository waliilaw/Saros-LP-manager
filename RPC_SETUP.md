# RPC Endpoint Setup Guide

## ⚠️ IMPORTANT: Public Solana RPC Issue

The public Solana RPC endpoint (`https://api.devnet.solana.com`) is **often overloaded and returns 503 errors**. This causes the following issues:

- ❌ Pool metadata fails to load
- ❌ Token addresses can't auto-fill
- ❌ Transactions fail to send
- ❌ Positions can't be fetched

## ✅ Solution: Use a Reliable RPC Provider

You need to use a **free or paid RPC provider** instead of the public endpoint.

### Recommended Free RPC Providers

#### 1. **Helius** (Recommended - Best Free Tier)
- **Free tier**: 100,000 requests/day
- **Sign up**: https://www.helius.dev/
- **Devnet URL**: `https://devnet.helius-rpc.com/?api-key=YOUR_API_KEY`

#### 2. **QuickNode**
- **Free tier**: Available
- **Sign up**: https://www.quicknode.com/
- **Devnet URL**: `https://your-endpoint.solana-devnet.quiknode.pro/YOUR_API_KEY/`

#### 3. **Alchemy**
- **Free tier**: Generous limits
- **Sign up**: https://www.alchemy.com/
- **Devnet URL**: `https://solana-devnet.g.alchemy.com/v2/YOUR_API_KEY`

#### 4. **Triton**
- **Free tier**: Available
- **Sign up**: https://triton.one/
- **Devnet URL**: Provided after signup

## Setup Instructions

### Step 1: Get an API Key

1. Choose a provider from above (Helius recommended)
2. Sign up for a free account
3. Create a new project/app
4. Copy your API key

### Step 2: Create `.env.local` File

Create a file named `.env.local` in the root of your project:

```bash
# .env.local

# Replace YOUR_API_KEY with your actual API key from Helius
NEXT_PUBLIC_SOLANA_RPC_ENDPOINT=https://devnet.helius-rpc.com/?api-key=YOUR_API_KEY

# Optional: WebSocket endpoint
NEXT_PUBLIC_SOLANA_WS_ENDPOINT=wss://api.devnet.solana.com
```

### Step 3: Restart Development Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 4: Test

1. Open the app in your browser
2. Click "Load Pools"
3. Select a pool
4. Token A and Token B should now **auto-fill automatically**! ✅

## Verification

You should see in the console:
```
Pool metadata: { tokenX: "...", tokenY: "...", ... }
Auto-filled tokens: { tokenA: "...", tokenB: "..." }
```

Instead of:
```
❌ Failed to fetch pool metadata: Error: 503 Service Unavailable
❌ Pool metadata: null
```

## Production/Mainnet

For mainnet, you'll definitely need a paid RPC provider:
- Most free tiers support devnet
- Mainnet requires paid plans (but very affordable)
- Helius: ~$10-50/month depending on usage
- Worth it for reliability and speed

## Still Having Issues?

1. **Check your API key**: Make sure it's correct and has no extra spaces
2. **Check the endpoint format**: Each provider has slightly different URL formats
3. **Try a different provider**: If one is down, try another
4. **Check rate limits**: Free tiers have limits, make sure you're not exceeding them

## Example `.env.local` Files

### Helius (Recommended)
```env
NEXT_PUBLIC_SOLANA_RPC_ENDPOINT=https://devnet.helius-rpc.com/?api-key=abc123-def456-ghi789
```

### QuickNode
```env
NEXT_PUBLIC_SOLANA_RPC_ENDPOINT=https://long-rough-sea.solana-devnet.quiknode.pro/abc123def456/
```

### Alchemy
```env
NEXT_PUBLIC_SOLANA_RPC_ENDPOINT=https://solana-devnet.g.alchemy.com/v2/abc123def456ghi789
```

---

**Need Help?** Check the provider's documentation for the exact endpoint format.

