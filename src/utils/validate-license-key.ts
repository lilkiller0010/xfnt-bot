import { lki } from '../constants';
import { decode64 } from './encode-decode64';
import { getMachineId } from './get-machine-id';

export const vlk = async (userLicenceKey: string) => {
  try {
    const machineId = await getMachineId();

    if (!machineId) {
      throw new Error('Machine ID not found');
    }

    const lkis = lki.find(
      (lki) =>
        decode64(lki.l) === userLicenceKey && decode64(lki.m) === machineId,
    );

    if (!lkis) {
      throw new Error('License key not found');
    }

    const nowDate = new Date();

    const lked = new Date(lkis.e);

    if (nowDate > lked) {
      throw new Error('License key is expired');
    }

    const expires = lked.getTime() - nowDate.getTime();

    return { ...lkis, expires, isExpired: false };
  } catch (error) {
    console.error(`Error validating license key: ${(error as Error).message}`);

    // process.exit();

    throw Error((error as Error).message);
  }
};
