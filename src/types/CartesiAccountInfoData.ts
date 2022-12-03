import { PublicKeyInitData } from "@solana/web3.js";

export interface CartesiAccountInfoData {
  lamports: string;
  data: string;
  owner: PublicKeyInitData;
  key: string;
}
