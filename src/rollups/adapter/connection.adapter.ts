import {
  AccountInfo,
  Commitment,
  Connection,
  GetAccountInfoConfig,
  PublicKey,
  RpcResponseAndContext,
  SendOptions,
  SignatureResult,
  TransactionSignature,
} from '@solana/web3.js';
import { Signer, utils as ethersUtils } from 'ethers';
import { AccountInfoResponse } from '../../types/Connection';
import { ConnectionType, WalletType } from '../../types/Framework';
import logger from '../utils/Logger';

export class ConnectionAdapter extends Connection implements ConnectionType {
  public getInspectBaseURL(): string {
    throw new Error('Method not implemented.');
  }
  public etherSigner?: Signer;
  public wallet?: WalletType;

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

  public sendTransaction(tx: unknown, _signers: unknown, options?: SendOptions): Promise<TransactionSignature> {
    throw new Error('Method not implemented.');
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
