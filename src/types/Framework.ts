import {
  type AnchorProvider,
  type Idl,
  type Program,
  type Wallet,
} from '@project-serum/anchor';
import { type Connection, type PublicKey } from '@solana/web3.js';
import { type Signer } from 'ethers';

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
    wallet: WalletType,
    connection: ConnectionType
  ): Promise<void>;
}

export interface DevelepmentFramework extends Framework {
  getProvider(signer?: Signer): WorkspaceShared;
  getPublicKey(idl: Idl): PublicKey;

  getConnection(): Connection;

  convertEthAddress2Solana(ethAddress: string): PublicKey;
}

export interface WalletType extends Wallet {
  set publicKey(key: PublicKey);
}

export interface ConnectionType extends Connection {
  updateWallet(wallet: WalletType, signer: Signer): Promise<void>;
}
