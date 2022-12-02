import { Idl } from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import { clusterApiUrl } from '@solana/web3.js';
import { Signer } from 'ethers';
import { Buffer } from 'node:buffer';
import {
  ConnectionType,
  DevelepmentFramework,
  WalletType,
  Workspace,
  WorkspaceArgs,
  WorkspaceShared,
} from '../types/Framework';
import { AnchorProviderAdapter } from './anchorProvider.adapter';
import { ConnectionAdapter } from './connection.adapter';
import { AdaptedWallet } from './wallet.adapter';

export default class Factory implements DevelepmentFramework {
  private connection?: Connection;
  private workspaceShared?: WorkspaceShared; 
  public convertEthAddress2Solana(ethAddress: string): PublicKey {
    const bytes = Buffer.from(ethAddress.slice(2), 'hex');
    const sol32bytes = Buffer.concat([bytes, Buffer.alloc(12)]);

    /** exist space to put byte to recover public key original */
    const pubKey = PublicKey.decode(sol32bytes) as PublicKey;
    return pubKey;
  }
  public getConnection(): Connection {
    if (this.connection) {
      return this.connection
    }
    const network = clusterApiUrl('devnet');
    this.connection = new ConnectionAdapter(network, Factory.COMMITMENT);
    return this.connection;
  }
  /** @todo this dont hit on solana blockchain */
  private static readonly COMMITMENT = 'processed';

  public getProvider(signer?: Signer): WorkspaceShared {
    if (this.workspaceShared) {
      const providerAdapted = this.workspaceShared.provider as AnchorProviderAdapter;
      providerAdapted.signer = signer
      return this.workspaceShared;
    }
    const connection = this.getConnection();
    const wallet: WalletType = new AdaptedWallet();
    const provider = new AnchorProviderAdapter(
      connection,
      wallet,
      {
        commitment: Factory.COMMITMENT,
      },
    );
    this.workspaceShared = { connection, provider, wallet };
    return this.workspaceShared;
  }

  public getPublicKey(idl: Idl): PublicKey {
    const metadata: unknown = idl.metadata;

    if (
      typeof metadata === 'object' &&
      metadata !== null &&
      'address' in metadata &&
      typeof metadata.address === 'string'
    ) {
      const { address } = metadata;
      return new PublicKey(address);
    }

    throw new TypeError('Invalid idl metadata');
  }
  public async onWalletConnected(
    signer: Signer,
  ): Promise<void> {
    const { connection, wallet } = this.getProvider(signer);
    const adaptedWallet = wallet as AdaptedWallet;
    const adaptedConnection = connection as ConnectionAdapter
    await Promise.all([
      signer.getAddress().then((ethAddress) => {
        adaptedWallet.publicKey = this.convertEthAddress2Solana(ethAddress);
      }),
      adaptedConnection.updateWallet(wallet, signer),
    ]);
  }

  public getWorkspace<T extends Idl>({
    idl,
    signer,
  }: WorkspaceArgs<T>): Workspace<T> {
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
