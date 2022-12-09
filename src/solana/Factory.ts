import { Idl } from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import { Signer } from 'ethers';
import { Buffer } from 'buffer';
import { CartesiConfig } from '../types/CartesiConfig';
import {
  DevelepmentFramework,
  WalletType,
  Workspace,
  WorkspaceArgs,
  WorkspaceShared,
} from '../types/Framework';
import { AnchorProviderAdapter } from './anchorProvider.adapter';
import { ConnectionAdapter } from './connection.adapter';
import { WalletAdapter } from './wallet.adapter';
import { convertEthAddress2Solana } from '../utils/cartesi';

export default class Factory implements DevelepmentFramework {
  createProgram: any;
  constructor(private config: CartesiConfig) {

  }
  private connection?: Connection;
  private workspaceShared?: WorkspaceShared;

  public createConnection(): Connection {
    return new ConnectionAdapter(this.config);
  }

  public getConnection(): Connection {
    if (this.connection) {
      return this.connection
    }
    this.connection = this.createConnection();
    return this.connection;
  }

  public createWorkspaceWithoutProgram(_signer?: Signer): WorkspaceShared {
    const connection = this.getConnection();
    const wallet: WalletType = new WalletAdapter();
    const provider = new AnchorProviderAdapter(
      connection,
      wallet,
      {},
    );
    return { connection, provider, wallet };
  }

  public getOrCreateWorkspaceWithoutProgram(signer?: Signer): WorkspaceShared {
    if (this.workspaceShared) {
      return this.workspaceShared;
    }
    this.workspaceShared = this.createWorkspaceWithoutProgram(signer);
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
    const { connection, wallet } = this.getOrCreateWorkspaceWithoutProgram(signer);
    const adaptedWallet = wallet as WalletAdapter;
    const adaptedConnection = connection as ConnectionAdapter
    await Promise.all([
      signer.getAddress().then((ethAddress) => {
        adaptedWallet.publicKey = convertEthAddress2Solana(ethAddress);
      }),
      adaptedConnection.updateWallet(wallet, signer),
    ]);
  }

  public getWorkspace<T extends Idl>({
    idl,
    signer,
  }: WorkspaceArgs<T>): Workspace<T> {
    const { connection, provider, wallet } = this.getOrCreateWorkspaceWithoutProgram(signer);
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
