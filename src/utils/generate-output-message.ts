import { Credential } from '../interface/credential';

export const generateOutputMessage = (
  crendential: Credential,
  url: string,
  driverLicenceGenerated: string,
  downPayment?: string,
): string => {
  const { email } = crendential;

  const message = `EMAIL=${email} SSN=${crendential.ssn} data=${JSON.stringify(
    crendential,
  )} driverLicenceGenerated=${driverLicenceGenerated} ${
    downPayment ? `DOWNPAYMENT=${downPayment}` : ''
  }`;

  return message;
};
