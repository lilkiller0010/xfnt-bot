import { Credential } from '../interface/credential';
import logger from '../logger/logger';

export const generateOutputMessage = (
  crendential: Credential,
  loanAmountValue: string,
  isWelcomeBack: boolean,
  url?: string,
  referrerURL?: string,
  onCatch?: boolean,
): string => {
  const { email, ssn } = crendential;

  if (isWelcomeBack) {
    const validMessage = onCatch
      ? `EMAIL=${email} SSN=${ssn} LOAN_AMOUNT=${loanAmountValue} IS_WELCOME_BACK=${isWelcomeBack}  URL=${url} ${
          referrerURL ? `REFERRER_URL=${referrerURL} ` : ''
        } ONCATH VALID`
      : `EMAIL=${email} SSN=${ssn} LOAN_AMOUNT=${loanAmountValue} IS_WELCOME_BACK=${isWelcomeBack}  URL=${url} ${
          referrerURL ? `REFERRER_URL=${referrerURL} ` : ''
        }VALID`;

    return validMessage;
  } else {
    const invalidMessage = `EMAIL=${email} SSN=${ssn} LOAN_AMOUNT=${loanAmountValue} IS_WELCOME_BACK=${isWelcomeBack} INVALID`;

    logger.error(
      `EMAIL=${email} SSN=${ssn} LOAN_AMOUNT=${loanAmountValue} IS_WELCOME_BACK=${isWelcomeBack} INVALID`,
    );

    return invalidMessage;
  }
};
