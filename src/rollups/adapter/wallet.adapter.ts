import { Wallet } from '@project-serum/anchor';
import { Keypair, Transaction, PublicKey } from '@solana/web3.js';

export class AdaptedWallet implements Wallet {
  public payer = Keypair.fromSecretKey(
    Uint8Array.from([
      121, 122, 251, 173, 123, 1, 141, 44, 75, 160, 11, 107, 14, 238, 24, 175,
      213, 180, 116, 96, 185, 108, 36, 202, 121, 64, 84, 243, 230, 252, 143, 86,
      23, 38, 214, 28, 85, 180, 211, 69, 250, 22, 31, 72, 53, 69, 227, 12, 92,
      172, 150, 196, 4, 59, 219, 216, 77, 34, 176, 132, 80, 157, 198, 198,
    ])
  );
  signTransaction(tx: Transaction): Promise<Transaction> {
    throw new Error('Method not implemented.');
  }
  signAllTransactions(txs: Transaction[]): Promise<Transaction[]> {
    throw new Error('Method not implemented.');
  }
  get publicKey(): PublicKey {
    throw new Error('Method not implemented.');
  }
}
