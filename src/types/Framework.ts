import type {
  AnchorProvider,
  Idl,
  Program,
  Wallet,
} from '@project-serum/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import type { Signer } from 'ethers';

export interface WorkspaceShared {
  provider: AnchorProvider;
  wallet: Wallet;
  connection: Connection;
}

export interface Workspace<T extends Idl> extends WorkspaceShared {
  program: Program<T>;
}

export interface WorkspaceArgs<T extends Idl> {
  signer?: Signer;
  idl: T;
}

export interface Framework {
  getWorkspace<T extends Idl>(args: WorkspaceArgs<T>): Workspace<T>;
  onWalletConnected(
    signer: Signer,
    wallet: Wallet,
    connection: Connection
  ): Promise<void>;
}

export interface DevelepmentFramework extends Framework {
  getProvider(signer?: Signer): WorkspaceShared;
  getPublicKey(idl: Idl): PublicKey;
  generateProgram(
    idl: Idl,
    programId: PublicKey,
    provider: WorkspaceShared
  ): Program<Idl>;

  getConnection(): Connection;
}
