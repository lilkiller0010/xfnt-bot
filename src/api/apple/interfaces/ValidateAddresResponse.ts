export interface ValidateAddresResponse {
  code: string;
  data: Data;
  isSuccess: boolean;
  orderNumber: string;
}

interface Data {
  globalAddress: GlobalAddress;
}

interface GlobalAddress {
  streetName: string;
  streetNum: string;
  streetType: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isValidPPUAddress: boolean;
  matchStatus: string;
  addressType: string;
}
