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
    // Create mint account
    const mintAuthority = Keypair.generate();
    const mint = await createMint(
      connection,
      payer as any, // Temporary type cast until we fix wallet adapter
      mintAuthority.publicKey,
      mintAuthority.publicKey,
      decimals,
      TOKEN_PROGRAM_ID
    );

    // Get associated token account
    const tokenAccount = await getAssociatedTokenAddress(
      mint,
      payer,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    // Create token account if it doesn't exist
    const account = await createAssociatedTokenAccount(
      connection,
      payer as any,
      mint,
      payer,
      undefined,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    // Mint some tokens
    await mintTo(
      connection,
      payer as any,
      mint,
      tokenAccount,
      mintAuthority,
      1000000000, // 1000 tokens with 6 decimals
      [],
      undefined,
      TOKEN_PROGRAM_ID
    );

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
    const tokenAccount = await getAssociatedTokenAddress(
      mint,
      payer,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    try {
      await createAssociatedTokenAccount(
        connection,
        payer as any,
        mint,
        payer,
        undefined,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
    } catch (error: any) {
      // Account already exists
      if (error.message?.includes('already in use')) {
        return tokenAccount;
      }
      throw error;
    }

    return tokenAccount;
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
