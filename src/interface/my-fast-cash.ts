export interface MyFastCashUserResponse {
  success: boolean;
  found: boolean;
  clientKey?: string;
  body?: Body;
}

export interface Body {
  creditScore: string;
  totalDebtAmount: null;
  firstName: string;
  lastName: string;
  email: string;
  dob: Date;
  zip: string;
  city: string;
  state: string;
  address: string;
  monthsAtAddress: string;
  homeOwnership: string;
  driversLicense: string;
  driversLicenseState: string;
  cellPhone: string;
  homePhone: string;
  ssn: string;
  employmentType: string;
  employerName: string;
  military: string;
  monthsEmployed: string;
  monthlyIncome: string;
  payFrequency: string;
  nextPayDate: Date;
  secondPayDate: Date;
  workPhone: string;
  workExt: null;
  payType: string;
  bankRoutingNumber: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountType: string;
  monthsAtBank: string;
}
