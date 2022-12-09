import { Keypair, type PublicKey, type Transaction } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { type CustomTransaction, type WalletType } from '../types/Framework';
import logger from '../utils/Logger';

export class WalletAdapter implements WalletType {
  public payer = Keypair.fromSecretKey(
    Uint8Array.from([
      121, 122, 251, 173, 123, 1, 141, 44, 75, 160, 11, 107, 14, 238, 24, 175,
      213, 180, 116, 96, 185, 108, 36, 202, 121, 64, 84, 243, 230, 252, 143, 86,
      23, 38, 214, 28, 85, 180, 211, 69, 250, 22, 31, 72, 53, 69, 227, 12, 92,
      172, 150, 196, 4, 59, 219, 216, 77, 34, 176, 132, 80, 157, 198, 198,
    ])
  );

  private _publicKey: PublicKey = this.payer.publicKey;

  public set publicKey(key: PublicKey) {
    this._publicKey = key;
  }

  public get publicKey() {
    return this._publicKey;
  }

  private logAccountKeys(tx: Transaction) {
    const msg = tx.compileMessage();
    const msgBase58 = msg.accountKeys.map((key) => key.toBase58());
    logger.debug(msgBase58);
  }

  private addBlankSignature(tx: Transaction): Buffer {
    // We decided to trust the msg_sender that comes in the metadata payload of the smart contract inside the Cartesi Machine
    // This way the user doesn't need to interact twice with the MetaMask. The first one to sign the payload and the other one to send.
    // Just fill the signature bytes
    const signature = Buffer.alloc(64);
    tx.addSignature(this.publicKey, signature);
    return signature;
  }

  private changeSerializeMethod(tx: CustomTransaction): void {
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
    //this.logAccountKeys(tx)
    this.addBlankSignature(tx)
    this.changeSerializeMethod(tx)
    return tx;
  }
  public async signAllTransactions(
    txs: CustomTransaction[]
  ): Promise<Transaction[]> {
    const result = await Promise.all(txs.map((tx) => this.signTransaction(tx)));

    return result;
  }
}
