import { AnchorProvider } from '@project-serum/anchor';
import { ConfirmOptions, Signer, Transaction, TransactionSignature } from '@solana/web3.js';
export class AnchorProviderAdapter extends AnchorProvider {

  public sendAndConfirm(tx: Transaction, signers?: Signer[], opts?: ConfirmOptions): Promise<TransactionSignature> {
    return this.connection.sendTransaction(tx, signers ?? [], opts)
  }

}
