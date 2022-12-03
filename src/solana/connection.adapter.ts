import { getReports } from '../graphql/reports';
import { cartesiRollups } from '../utils/cartesi';
import { InputAddedEvent } from "@cartesi/rollups/dist/src/types/contracts/interfaces/IInput";
import {
  AccountInfo,
  clusterApiUrl,
  Commitment,
  Connection,
  GetAccountInfoConfig,
  GetProgramAccountsConfig,
  PublicKey,
  RpcResponseAndContext,
  SendOptions,
  SerializeConfig,
  SignatureResult,
  SystemProgram,
  Transaction,
  TransactionSignature,
} from '@solana/web3.js';
import fetch from "cross-fetch";
import { ContractReceipt, Signer, utils as ethersUtils, ethers, BytesLike } from 'ethers';
import { ConnectionType, WalletType } from '../types/Framework';
import logger from '../utils/Logger';
import { InputFacet } from '@cartesi/rollups';
import { Config } from '../types/Config';
import { AccountInfoResponse } from '../types/Connection';
import { CartesiAccountInfoData } from '../types/CartesiAccountInfoData';

export const DEFAULT_GRAPHQL_URL = `${process.env.CARTESI_GRAPHQL_URL}`;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const toBuffer = (arr: Buffer | Uint8Array | Array<number>): Buffer => {
  if (Buffer.isBuffer(arr)) {
    return arr;
  } else if (arr instanceof Uint8Array) {
    return Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength);
  } else {
    return Buffer.from(arr);
  }
};

export function signTransaction(tx: Transaction, pubkey: PublicKey) {
  logger.debug('signTransaction...')
  const msg = tx.compileMessage()
  logger.debug(msg.accountKeys.map(k => k.toBase58()))

  // just fill the signature bytes
  const signature = Buffer.alloc(64);

  tx.addSignature(pubkey, signature);

  tx.serialize = function (_config?: SerializeConfig): Buffer {
    const signData = this.serializeMessage();
    return (this as any)._serialize(signData);
  }
  return tx;
}

export class ConnectionAdapter extends Connection implements ConnectionType {
  constructor(private config: Config) {
    const network = clusterApiUrl('devnet');
    super(network)
  }

  public getInspectBaseURL(): string {
    return this.config.inspectURL;
  }

  public etherSigner?: Signer;
  public wallet?: WalletType;
  public inputContract?: InputFacet;

  /**
   * @todo check here
   * @deprecated
   */
  public confirmTransaction(): Promise<RpcResponseAndContext<SignatureResult>> {
    const resultFake: RpcResponseAndContext<SignatureResult> = {
      value: { err: null },
      context: { slot: -1 },
    };

    return Promise.resolve(resultFake);
  }

  async getInputContract() {
    if (this.inputContract) {
      return this.inputContract;
    }
    if (!this.etherSigner) {
      throw new Error('Signer is undefined');
    }
    const { inputContract } = await cartesiRollups(this.etherSigner);
    this.inputContract = inputContract;
    return inputContract;
  }

  async sendTransaction(
    tx: any,
    _signers: any,
    options?: SendOptions,
  ): Promise<TransactionSignature> {
    logger.debug('sending transaction from adapter');
    if (!this.wallet) {
      throw new Error('Wallet is undefined');
    }
    if (!this.etherSigner) {
      throw new Error('Signer is undefined');
    }
    if (options === undefined) {
      options = {
        preflightCommitment: this.commitment
      }
    }
    tx.feePayer = this.wallet.publicKey;

    // it doesn't matter for Cartesi
    tx.recentBlockhash = 'JAnZtVsDWxSJNmpg4cLgTrrDRMVT48droqtWdEHnY141';

    tx = await this.wallet.signTransaction(tx);

    // aqui deveriamos possibilitar assinar dado o par de chaves
    // (signers ?? []).forEach((kp) => {
    //     tx.partialSign(kp);
    // });

    const rawTx = tx.serialize();
    const payload = toBuffer(rawTx).toString('base64');
    logger.debug('Cartesi Rollups payload', payload);
    const inputBytes = ethers.utils.toUtf8Bytes(payload);

    const inputContract = await this.getInputContract();

    // send transaction
    const txEth = await inputContract.addInput(inputBytes);
    logger.debug(`transaction: ${txEth.hash}`);
    logger.debug("waiting for confirmation...");
    const receipt = await txEth.wait(1);
    logger.debug('receipt ok');
    const inputReportResults = await pollingReportResults(receipt, this.config);
    logger.debug({ inputReportResults })
    if (inputReportResults?.find((report: any) => report.json.error)) {
      throw new Error('Unexpected error');
    }
    return txEth.hash;
  }

  public updateWallet(wallet: WalletType, signer: Signer): Promise<void> {
    throw new Error('Method not implemented.');
  }

  public async requestAirdrop(toPubkey: PublicKey, lamports: number): Promise<TransactionSignature> {
    // Public Key that give me SOL on devnet
    // https://explorer.solana.com/tx/4aTCJyxNstBdxEJmH2CiTeBghMusTQ66ox7iGPMARSUoiKjBCsAvKwAuJa2kcAn2kJuyCpc9pyrhfTwZs8Zkfn6r?cluster=devnet
    const fromPubkey = new PublicKey("9B5XszUGdMaxCZ7uSQhPzdks5ZQSmWxrmzCSvtJ6Ns6g");
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey,
        toPubkey,
        lamports
      })
    )
    return await this.sendTransaction(transaction, []);
  }

  public getMultipleAccountsInfo(publicKeys: PublicKey[]): Promise<(AccountInfo<Buffer> | null)[]> {
    const promises = publicKeys.map((pk) => this.getAccountInfo(pk));
    return Promise.all(promises);
  }

  private async clientHttpGet<T>(url: string) {
    const urlx = new URL(url);
    const response = await fetch(urlx, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });
    return await response.json() as T;
  }

  private parseBytesLikeToKeyAndAccountInfo(payload: BytesLike): { key: string, account: AccountInfo<Buffer> } | null {
    try {
      const jsonString = ethersUtils.toUtf8String(payload);
      const infoData = JSON.parse(jsonString) as CartesiAccountInfoData;
      return {
        key: infoData.key,
        account: {
          owner: new PublicKey(infoData.owner),
          data: Buffer.from(infoData.data, 'base64'),
          executable: false, // pode ser que seja executavel
          lamports: +infoData.lamports,
        }
      };
    } catch (error) {
      logger.error(error);
      return null;
    }
  }

  public async getAccountInfo(publicKey: PublicKey, _commitmentOrConfig?: Commitment | GetAccountInfoConfig): Promise<AccountInfo<Buffer> | null> {
    const baseURL = this.getInspectBaseURL();
    const url = `${baseURL}/accountInfo/${publicKey.toBase58()}`;
    const cartesiResponse = await this.clientHttpGet<AccountInfoResponse>(url);
    if (!Array.isArray(cartesiResponse.reports) || !cartesiResponse.reports.length) {
      return null;
    }
    const [firstReport] = cartesiResponse.reports;
    return this.parseBytesLikeToKeyAndAccountInfo(firstReport.payload)?.account ?? null;
  }

  public async getProgramAccounts(
    programId: PublicKey,
    _configOrCommitment?: GetProgramAccountsConfig | Commitment
  ): Promise<
    Array<{
      pubkey: PublicKey;
      account: AccountInfo<Buffer>;
    }>
  > {
    const baseURL = this.getInspectBaseURL();
    const url = `${baseURL}/programAccounts/${programId.toBase58()}`;
    logger.debug('Cartesi inspect url', url);

    const cartesiResponse = await this.clientHttpGet<AccountInfoResponse>(url.toString());
    if (!cartesiResponse.reports || !cartesiResponse.reports.length) {
      // fallback?
      return [];
    }
    const accounts = cartesiResponse.reports.map(report => {
      return this.parseBytesLikeToKeyAndAccountInfo(report.payload);
    }).filter(a => !!a).map(obj => {
      return {
        pubkey: new PublicKey(obj!.key),
        account: obj!.account
      }
    })

    return accounts;
  }

  public async getBalance(publicKey: PublicKey, commitment?: Commitment | undefined): Promise<number> {
    const accountInfo = await this.getAccountInfo(publicKey, commitment);
    return accountInfo?.lamports || 0;
  }

}

export async function pollingReportResults(receipt: ContractReceipt, config: Config) {
  const MAX_REQUESTS = config.report.maxRetry;
  const inputKeys = getInputKeys(receipt);
  for (let i = 0; i < MAX_REQUESTS; i++) {
    await delay(config.report.baseDelay * (i + 1));
    const reports = await getReports(config.graphqlURL, inputKeys);
    if (reports.length > 0) {
      return reports.map((r: any) => {
        const strJson = ethers.utils.toUtf8String(r.payload);
        return {
          ...r,
          json: JSON.parse(strJson)
        };
      })
    }
  }
}


export type InputKeys = {
  epoch_index?: number;
  input_index?: number;
};

/**
* Retrieve InputKeys from an InputAddedEvent
* @param receipt Blockchain transaction receipt
* @returns input identification keys
*/
export const getInputKeys = (receipt: ContractReceipt): InputKeys => {
  // get InputAddedEvent from transaction receipt
  const event = receipt.events?.find((e) => e.event === "InputAdded");

  if (!event) {
    throw new Error(
      `InputAdded event not found in receipt of transaction ${receipt.transactionHash}`
    );
  }

  const inputAdded = event as InputAddedEvent;
  return {
    epoch_index: inputAdded.args.epochNumber.toNumber(),
    input_index: inputAdded.args.inputIndex.toNumber(),
  };
};