import { Idl, Program, Wallet } from '@project-serum/anchor';
import { PublicKey, Connection, clusterApiUrl } from '@solana/web3.js';
import { Signer } from 'ethers';
import type {
  DevelepmentFramework,
  Workspace,
  WorkspaceArgs,
  WorkspaceShared,
} from '../types/Framework';
import { AnchorProviderAdapter } from './adapter/anchorProvider.adapter';
import { ConnectionAdapter } from './adapter/connection.adapter';
import { AdaptedWallet } from './adapter/wallet.adapter';

export default class Rollups implements DevelepmentFramework {
  getConnection(): Connection {
    const network = clusterApiUrl('devnet');
    return new ConnectionAdapter(network, Rollups.COMMITMENT);
  }
  /** @todo this dont hit on solana blockchain */
  static readonly COMMITMENT = 'processed';

  getProvider(signer?: Signer): WorkspaceShared {
    const connection = this.getConnection();
    const wallet = new AdaptedWallet();
    const provider = new AnchorProviderAdapter(
      connection,
      wallet,
      {
        commitment: Rollups.COMMITMENT,
      },
      signer
    );

    return { connection, provider, wallet };
  }
  getPublicKey(idl: Idl): PublicKey {
    throw new Error('Method not implemented.');
  }
  generateProgram(
    idl: Idl,
    programId: PublicKey,
    provider: WorkspaceShared
  ): Program<Idl> {
    throw new Error('Method not implemented.');
  }
  onWalletConnected(
    signer: Signer,
    wallet: Wallet,
    connection: Connection
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }
  getWorkspace<T extends Idl>({ idl, signer }: WorkspaceArgs<T>): Workspace<T> {
    const { connection, provider, wallet } = this.getProvider(signer);
    const programId = this.getPublicKey(idl);
    const program = new Program<T>(idl, programId, provider);

    return {
      connection,
      provider,
      wallet,
      program,
    };
  }
}
