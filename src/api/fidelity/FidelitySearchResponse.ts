export interface FidelitySearchResponse {
  responseBaseInfo?: ResponseBaseInfo;
}

export interface ResponseBaseInfo {
  sessionTokens: null;
  status?: Status;
}

export interface Status {
  code: number;
  message: string;
  requestIdentifier: string;
  Context: string;
  Relationships: string[];
}

// code :  message

// 1200 = "Success"
// 1201 = "Authentication Not Completed"

// enum FidelityResponseMessages {
//   Success = 'Success',
//   AuthenticationNotCompleted = 'Authentication Not Completed',
//   Matchfound = 'Match found',
// }
