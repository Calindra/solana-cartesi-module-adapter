import { Keypair, type PublicKey, type Transaction } from '@solana/web3.js';
import { Buffer } from 'node:buffer';
import { type CustomTransaction, type WalletType } from '../types/Framework';
import logger from '../utils/Logger';

export class AdaptedWallet implements WalletType {
  public readonly payer = Keypair.fromSecretKey(
    Uint8Array.from([
      121, 122, 251, 173, 123, 1, 141, 44, 75, 160, 11, 107, 14, 238, 24, 175,
      213, 180, 116, 96, 185, 108, 36, 202, 121, 64, 84, 243, 230, 252, 143, 86,
      23, 38, 214, 28, 85, 180, 211, 69, 250, 22, 31, 72, 53, 69, 227, 12, 92,
      172, 150, 196, 4, 59, 219, 216, 77, 34, 176, 132, 80, 157, 198, 198,
    ])
  );

  public set publicKey(key: PublicKey) {
    this.publicKey = key;
  }

  private getMsgBase58(tx: Transaction): string[] {
    const msg = tx.compileMessage();
    const msgBase58 = msg.accountKeys.map((key) => key.toBase58());

    logger.debug(msgBase58);

    return msgBase58;
  }

  private resetSignature(tx: Transaction): Buffer {
    const signature = Buffer.alloc(64);
    tx.addSignature(this.payer.publicKey, signature);
    return signature;
  }

  private changeSerialize(tx: CustomTransaction): void {
    tx.serialize = function (): Buffer {
      const signData = this.serializeMessage();
      if (this._serialize) {
        return this._serialize(signData);
      }

      throw new TypeError('Invalid transaction');
    };
  }

  public async signTransaction(tx: CustomTransaction): Promise<Transaction> {
    logger.debug('signTransaction...');

    await Promise.all([
      this.getMsgBase58(tx),
      this.resetSignature(tx),
      this.changeSerialize(tx),
    ]);

    return tx;
  }
  public async signAllTransactions(
    txs: CustomTransaction[]
  ): Promise<Transaction[]> {
    const result = await Promise.all(txs.map((tx) => this.signTransaction(tx)));

    return result;
  }
}
