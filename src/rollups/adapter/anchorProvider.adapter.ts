import { type Wallet } from '@project-serum/anchor';
import { AnchorProvider } from '@project-serum/anchor';
import { type ConfirmOptions, type Connection } from '@solana/web3.js';
import { type Signer } from 'ethers';

export class AnchorProviderAdapter extends AnchorProvider {
  public constructor(
    connection: Connection,
    wallet: Wallet,
    opts: ConfirmOptions,
    public readonly signer?: Signer
  ) {
    super(connection, wallet, opts);
  }
}
