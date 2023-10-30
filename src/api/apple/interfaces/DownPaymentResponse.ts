export interface DownPaymentResponse {
  code: string;
  data: Data;
  isSuccess: boolean;
}

export interface Data {
  monthlyDP: number;
  downPayment: string;
  pageHeading: string;
  pageDescription: string;
  additionalDownPaymentLabel: string;
  upperLimit: number;
  totalDownPaymentLabel: string;
  isDeviceTradeInApplicable: boolean;
  deviceFullRetailPrice: string;
  showNextUpInstallmentText: string;
  showDeviceFullPrice: boolean;
  areCarrierTradeInCreditsAvailable: boolean;
  carrierTradeInCreditsMontly: number;
  isCarrierDiscountApplicable: boolean;
  carrierDiscountMessage: string;
  totalTradeInValueText: string;
  showUpgradeEligibility: boolean;
  upgradeEligibilityLabel: string;
  upgradeEligibilityMessage: string;
  tenure: number;
  averageAmount: string;
  totalTradeInValue: string;
  monthsToBuyUp: number;
  optionDPErrorMessage: string;
  isRequiredDownPayment: boolean;
  optionalDp: number;
  skipDownpayment: boolean;
  monthlyTradeUpNote: string;
  hideLegalEndNoteFlag: boolean;
  showNextUpMonthlyPaymentFlag: boolean;
}
