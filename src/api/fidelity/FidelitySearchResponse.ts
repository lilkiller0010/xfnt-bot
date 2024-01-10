export interface FidelitySearchResponse {
  responseBaseInfo: ResponseBaseInfo;
}

export interface ResponseBaseInfo {
  sessionTokens: null;
  status: Status;
}

export interface Status {
  code: number;
  message: string;
  requestIdentifier: string;
  Context: string;
  Relationships: string[];
}
