import { getReports } from '../graphql/reports';
import { cartesiRollups } from '../utils/cartesi';
import { InputAddedEvent } from "@cartesi/rollups/dist/src/types/contracts/interfaces/IInput";
import {
  AccountInfo,
  clusterApiUrl,
  Commitment,
  Connection,
  GetAccountInfoConfig,
  PublicKey,
  RpcResponseAndContext,
  SendOptions,
  SerializeConfig,
  SignatureResult,
  Transaction,
  TransactionSignature,
} from '@solana/web3.js';
import { ContractReceipt, Signer, utils as ethersUtils, ethers } from 'ethers';
import { ConnectionType, WalletType } from '../types/Framework';
import logger from '../utils/Logger';
import { InputFacet } from '@cartesi/rollups';
import { Config } from '../types/Config';

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
  console.log(msg.accountKeys.map(k => k.toBase58()))

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
    throw new Error('Method not implemented.');
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
    tx.recentBlockhash = (
      await this.getRecentBlockhash(options.preflightCommitment)
    ).blockhash;

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
    const inputReportResults = await pollingReportResults(receipt, this.config.graphqlURL);
    logger.debug({ inputReportResults })
    if (inputReportResults?.find((report: any) => report.json.error)) {
      throw new Error('Unexpected error');
    }
    return txEth.hash;
  }

  public updateWallet(wallet: WalletType, signer: Signer): Promise<void> {
    throw new Error('Method not implemented.');
  }

  public requestAirdrop(toPubkey: PublicKey, lamports: number): Promise<TransactionSignature> {
    throw new Error('Method not implemented.');
  }

  public getMultipleAccountsInfo(publicKeys: PublicKey[]): Promise<(AccountInfo<Buffer> | null)[]> {
    const promises = publicKeys.map((pk) => this.getAccountInfo(pk));
    return Promise.all(promises);
  }

  // public async getAccountInfo(publicKey: PublicKey): Promise<AccountInfo<Buffer> | null> {
  //   const baseURL = this.getInspectBaseURL();

  //   const url = new URL(`${baseURL}/accountInfo/${publicKey.toBase58()}`);

  //   logger.info('Cartesi inspect url', url);
  //   const response = await fetch(url, {
  //     method: 'GET',
  //     headers: {
  //       Accept: 'application/json',
  //     },
  //   });
  //   const resp = (await response.json()) as AccountInfoResponse;
  //   const cartesiResponse = resp;
  //   if (!Array.isArray(cartesiResponse.reports) || !cartesiResponse.reports.length) {
  //     //console.log('Fallback to solana getAccountInfo')
  //     //return super.getAccountInfo(publicKey, commitmentOrConfig);
  //     return null;
  //   }
  //   const [firstReport] = cartesiResponse.reports;

  //   try {
  //     const jsonString = ethersUtils.toUtf8String(firstReport.payload);
  //     const infoData = JSON.parse(jsonString) as Record<string, unknown>;
  //     // console.log({ [publicKey.toBase58()]: infoData })
  //     return {
  //       owner: new PublicKey(infoData.owner),
  //       data: Buffer.from(infoData.data, 'base64'),
  //       executable: false, // pode ser que seja executavel
  //       lamports: +infoData.lamports,
  //     };
  //   } catch (error) {
  //     console.error(error);
  //     return null;
  //   }
  // }

  // public async getProgramAccounts(
  //   programId: PublicKey,
  //   _configOrCommitment?: GetProgramAccountsConfig | Commitment
  // ): Promise<
  //   Array<{
  //     pubkey: PublicKey;
  //     account: AccountInfo<Buffer>;
  //   }>
  // > {
  //   const baseURL = this.getInspectBaseURL();
  //   const url = `${baseURL}/programAccounts/${programId.toBase58()}`;
  //   console.log('Cartesi inspect url', url);
  //   const resp = await axios.get(url.toString());
  //   const cartesiResponse = resp.data;
  //   if (!cartesiResponse.reports || !cartesiResponse.reports.length) {
  //     //console.log('Fallback to solana getAccountInfo')
  //     //return super.getAccountInfo(publicKey, commitmentOrConfig);
  //     return [];
  //   }
  //   const accounts = cartesiResponse.reports.map((report) => {
  //     const jsonString = ethers.utils.toUtf8String(report.payload);
  //     const infoData = JSON.parse(jsonString);
  //     // console.log({ [publicKey.toBase58()]: infoData })
  //     return {
  //       pubkey: new PublicKey(infoData.key),
  //       account: {
  //         owner: new PublicKey(infoData.owner),
  //         data: Buffer.from(infoData.data, 'base64'),
  //         executable: false, // pode ser que seja executavel
  //         lamports: +infoData.lamports,
  //       },
  //     };
  //   });

  //   return accounts;
  // }
}

export async function pollingReportResults(receipt: ContractReceipt, graphqlURL: string) {
  const MAX_REQUESTS = 10;
  const inputKeys = getInputKeys(receipt);
  console.log(`InputKeys: ${JSON.stringify(inputKeys, null, 4)}`);
  for (let i = 0; i < MAX_REQUESTS; i++) {
    await delay(1000 * (i + 1));
    const reports = await getReports(graphqlURL, inputKeys);
    console.log(`Cartesi reports ${graphqlURL}: ${JSON.stringify(reports, null, 4)}`);
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