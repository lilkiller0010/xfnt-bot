import { Credential } from '../interface/credential';

type GenerateOutputMessage = {
  credential: Credential;
  searchResponseMessage: string;
  otp?: boolean;
  phoneLast4Digit?: string[];
  isCompleteRegister?: boolean;
};

export const generateOutputMessage = ({
  credential,
  searchResponseMessage,
  otp,
  phoneLast4Digit,
  isCompleteRegister,
}: GenerateOutputMessage): string => {
  const message = `SSN=${
    credential.ssn
  } SearchResponseMessage=${searchResponseMessage} ${
    otp ? `REQUIREOTP ` : ''
  } ${
    phoneLast4Digit ? `PHONELAST4DIGIT=${phoneLast4Digit.toString()} ` : ''
  } ${isCompleteRegister ? `isCompleteRegister ` : ''}data=${JSON.stringify(
    credential,
  )}`;

  return message;
};

// {
//   "additionalInfo": null,
//   "appEntry": false,
//   "authenticationFullPageURL": null,
//   "authenticationModalURL": null,
//   "authenticationSuccess": false,
//   "authenticationViewBean": {
//       "addMobileNumberUrl": "https://oam.wellsfargo.com/oamo/interdiction/addmobilenumber?_x=FmN-7VsqqOoo1XM2w-rKuNSbdBeFH6jB",
//       "authMethodViewBeans": {
//           "textOTPViewBean": {
//               "authMethodType": "OTP",
//               "cancelInterdictionURL": "https://oam.wellsfargo.com/oamo/interdiction/cancelauthentication?screenName=SMS&_x=ddsmndMmVeyt4AGLKJxo-drrmrYqOdmN",
//               "destinationType": "SMS",
//               "name": "textOTPViewBean",
//               "submitInterdictionURL": "https://oam.wellsfargo.com/oamo/interdiction/sendotp?_x=omTV7l2L-CnyAjOVo8d1_g9b1brK5CSJ",
//               "textPhoneList": [
//                   {
//                       "displayLabel": "Mobile ***-***-0567",
//                       "displayNumber": "***-***-0567",
//                       "displayNumberType": "Mobile",
//                       "eligibleForAuthentication": true,
//                       "phoneId": "f41340a8-978f-40f7-9b6b-0adbedbd7732",
//                       "phoneType": "MOBILE",
//                       "sendCodeType": "PHONE"
//                   },
//                   {
//                       "displayLabel": "Mobile ***-***-7998",
//                       "displayNumber": "***-***-7998",
//                       "displayNumberType": "Mobile",
//                       "eligibleForAuthentication": true,
//                       "phoneId": "8f4b1b90-35bc-4696-b905-0688dbeddeeb",
//                       "phoneType": "MOBILE",
//                       "sendCodeType": "PHONE"
//                   }
//               ]
//           },
//           "callOTPViewBean": {
//               "authMethodType": "OTP",
//               "callPhoneList": [
//                   {
//                       "displayLabel": "Mobile ***-***-0567",
//                       "displayNumber": "***-***-0567",
//                       "displayNumberType": "Mobile",
//                       "eligibleForAuthentication": true,
//                       "phoneId": "f41340a8-978f-40f7-9b6b-0adbedbd7732",
//                       "phoneType": "MOBILE",
//                       "sendCodeType": "PHONE"
//                   },
//                   {
//                       "displayLabel": "Mobile ***-***-7998",
//                       "displayNumber": "***-***-7998",
//                       "displayNumberType": "Mobile",
//                       "eligibleForAuthentication": true,
//                       "phoneId": "8f4b1b90-35bc-4696-b905-0688dbeddeeb",
//                       "phoneType": "MOBILE",
//                       "sendCodeType": "PHONE"
//                   }
//               ],
//               "cancelInterdictionURL": "https://oam.wellsfargo.com/oamo/interdiction/cancelauthentication?screenName=VRU&_x=rFSGpi6-VkLFG0I-ITMWWL4Er3jcndPu",
//               "destinationType": "VRU",
//               "name": "callOTPViewBean",
//               "submitInterdictionURL": "https://oam.wellsfargo.com/oamo/interdiction/sendotp?_x=omTV7l2L-CnyAjOVo8d1_g9b1brK5CSJ"
//           }
//       },
//       "callOtpAvailable": true,
//       "cancelInterdictionURL": null,
//       "cvvAvailable": false,
//       "eligibleToAddMobileNumber": true,
//       "emailOtpAvailable": false,
//       "fobAvailable": false,
//       "key": "",
//       "newPhoneId": null,
//       "ocsOtpAvailable": false,
//       "oowPhoneNumber": null,
//       "otpFobPhoneNumber": "1-866-609-3037",
//       "piiAvailable": false,
//       "pinAvailable": false,
//       "pinCvvAvailable": false,
//       "pushOtpAvailable": false,
//       "spanishPhoneNumber": "1-800-956-4442",
//       "submitInterdictionURL": null,
//       "textOtpAvailable": true
//   },
//   "cancelInterdictionURL": "https://oam.wellsfargo.com/oamo/interdiction/cancelauthentication?screenName=LANDING_SCREEN&_x=EIBnN18Q4-NKuoYer5pcAJPGIO0Gxtz_",
//   "customerLanguageType": "ENGLISH",
//   "deviceType": "7P",
//   "eventId": "PASSWORD_CHANGE",
//   "hierarchyFlow": true,
//   "preLogin": true,
//   "priviligedView": false,
//   "showInterdictionContent": true,
//   "status": "SUCCESS",
//   "submitInterdictionURL": null
// }
