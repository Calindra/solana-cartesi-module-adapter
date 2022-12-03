import { AnchorProvider } from '@project-serum/anchor';
import { type Signer } from 'ethers';

export class AnchorProviderAdapter extends AnchorProvider {
  public signer?: Signer
}
