
/* eslint-disable */
const { Connection, Keypair } = require('@solana/web3.js');
const { LiquidityBookServices, MODE } = require('@saros-finance/dlmm-sdk');

const RPC = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';

async function requestAirdrop(connection, pubkey, amount = 1) {
  const sig = await connection.requestAirdrop(pubkey, amount * 1_000_000_000);
  await connection.confirmTransaction(sig);
  return sig;
}

(async () => {
  try {
    console.log('🚀 Devnet setup check...');
    const connection = new Connection(RPC);
    console.log('✅ RPC:', RPC);

    const wallet = Keypair.generate();
    console.log('🔑 Temp wallet:', wallet.publicKey.toString());

    process.stdout.write('📡 Airdrop 1 SOL... ');
    try {
      await requestAirdrop(connection, wallet.publicKey, 1);
      console.log('done');
    } catch (e) {
      console.log('skipped (faucet blocked)');
    }

    const lb = new LiquidityBookServices({
      mode: MODE.DEVNET,
      options: { rpcUrl: RPC },
    });
    console.log('✅ DLMM client ready');

    process.stdout.write('📊 Fetching pool addresses... ');
    const pools = await lb.fetchPoolAddresses();
    console.log(`found ${pools.length}`);
    if (pools.length) console.log('🔗 Sample pool:', pools[0]);

    console.log('\n✨ Setup OK');
  } catch (e) {
    console.error('❌ Setup failed');
    console.error(e);
    process.exit(1);
  }
})();
