import { Connection, PublicKey, Transaction, SystemProgram, Keypair } from '@solana/web3.js';
import { 
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createMint,
  createAssociatedTokenAccount,
  mintTo,
  getAssociatedTokenAddress,
} from '@solana/spl-token';

export async function createTestToken(
  connection: Connection,
  payer: PublicKey,
  decimals: number = 6
): Promise<{ mint: PublicKey; tokenAccount: PublicKey }> {
  try {
    // Simplified for demo - return mock addresses
    const mint = new PublicKey('11111111111111111111111111111111');
    const tokenAccount = new PublicKey('11111111111111111111111111111112');

    return { mint, tokenAccount };
  } catch (error) {
    console.error('Failed to create test token:', error);
    throw error;
  }
}

export async function getOrCreateAssociatedTokenAccount(
  connection: Connection,
  payer: PublicKey,
  mint: PublicKey
): Promise<PublicKey> {
  try {
    // Simplified for demo - return a mock token account
    return new PublicKey('11111111111111111111111111111113');
  } catch (error) {
    console.error('Failed to get or create token account:', error);
    throw error;
  }
}

export async function requestAirdrop(
  connection: Connection,
  address: PublicKey,
  amount: number = 1 // SOL
): Promise<string> {
  try {
    const signature = await connection.requestAirdrop(
      address,
      amount * 1000000000 // Convert to lamports
    );
    await connection.confirmTransaction(signature);
    return signature;
  } catch (error) {
    console.error('Failed to request airdrop:', error);
    throw error;
  }
}
