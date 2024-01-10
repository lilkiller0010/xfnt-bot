import { Credential } from '../interface/credential';

export const generateOutputMessage = (
  crendential: Credential,
  url: string,
  responseMessage: string,
): string => {
  const { email } = crendential;

  const message = `EMAIL=${email} SSN=${crendential.ssn} data=${JSON.stringify(
    crendential,
  )} RESPONSE_MESSAGE=${responseMessage}
  }`;

  return message;
};
