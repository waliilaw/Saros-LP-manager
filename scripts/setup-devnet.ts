import { Connection, Keypair } from '@solana/web3.js';
import { LiquidityBookServices } from '@saros-finance/dlmm-sdk/dist/services/core';
import { MODE } from '@saros-finance/dlmm-sdk/dist/types/config';
import { requestAirdrop } from '../src/lib/saros/token/utils';
import { SOLANA_RPC_ENDPOINT } from '../src/lib/saros/config';

async function main() {
  try {
    console.log('🚀 Starting devnet setup...');

    // Initialize connection
    const connection = new Connection(SOLANA_RPC_ENDPOINT);
    console.log('✅ Connected to', SOLANA_RPC_ENDPOINT);

    // Create test wallet
    const wallet = Keypair.generate();
    console.log('✅ Created test wallet:', wallet.publicKey.toString());

    // Request SOL airdrop
    console.log('📡 Requesting SOL airdrop...');
    const airdropSignature = await requestAirdrop(connection, wallet.publicKey, 2); // 2 SOL
    console.log('✅ Airdrop successful:', airdropSignature);

    // Initialize LiquidityBook services (DLMM)
    const lb = new LiquidityBookServices({
      mode: MODE.DEVNET,
      options: { rpcUrl: SOLANA_RPC_ENDPOINT },
    });
    console.log('✅ DLMM (LiquidityBook) client initialized');

    // Fetch pool addresses available on devnet
    console.log('📊 Fetching existing pool addresses (devnet)...');
    const poolAddresses = await lb.fetchPoolAddresses();
    console.log(`✅ Found ${poolAddresses.length} pools`);
    if (poolAddresses.length > 0) {
      console.log('🔗 Sample pool:', poolAddresses[0]);
    }

    console.log('\n✨ Setup check complete!');
    console.log('- Wallet (devnet):', wallet.publicKey.toString());
    console.log('- RPC:', SOLANA_RPC_ENDPOINT);

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

main();
