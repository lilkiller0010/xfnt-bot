export interface CreditCheckResponse {
  code: string;
  data: Data;
  isSuccess: boolean;
  nextPage: string;
}

export interface Data {
  activationType: string;
}
