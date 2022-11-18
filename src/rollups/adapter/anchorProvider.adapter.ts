import { AnchorProvider, Wallet } from '@project-serum/anchor';
import { ConfirmOptions, Connection } from '@solana/web3.js';
import { Signer } from 'ethers';

export class AnchorProviderAdapter extends AnchorProvider {
  constructor(
    connection: Connection,
    wallet: Wallet,
    opts: ConfirmOptions,
    public readonly signer?: Signer
  ) {
    super(connection, wallet, opts);
  }
}
