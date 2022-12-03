import { AnchorProvider, Idl, Program, Wallet } from '@project-serum/anchor';
import {
  Commitment,
  Connection,
  PublicKey,
  Transaction,
} from '@solana/web3.js';
import { Signer } from 'ethers';

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
  getOrCreateWorkspaceWithoutProgram(signer?: Signer): WorkspaceShared;
  getPublicKey(idl: Idl): PublicKey;

  getConnection(): Connection;

  convertEthAddress2Solana(ethAddress: string): PublicKey;
}

export interface CustomTransaction extends Transaction {
  _serialize?(signData: Buffer): Buffer;
}

export interface WalletType extends Wallet {
  set publicKey(key: PublicKey);
  signTransaction<TR extends Transaction>(tx: TR): Promise<Transaction>;
  signAllTransactions<TR extends Transaction>(
    txs: TR[]
  ): Promise<Transaction[]>;
}
export interface ConnectionType extends Connection {
  etherSigner?: Signer;
  wallet?: WalletType;

  getBalance(publicKey: PublicKey, commitment?: Commitment): Promise<number>;

  updateWallet(wallet: WalletType, signer: Signer): Promise<void>;

  getInspectBaseURL(): string;
}
