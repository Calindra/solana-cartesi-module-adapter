import { BytesLike } from 'ethers';

interface Report {
  payload: BytesLike;
}

export interface AccountInfoResponse {
  reports?: Report[];
}
