"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vlk = void 0;
const constants_1 = require("../constants");
const encode_decode64_1 = require("./encode-decode64");
const get_machine_id_1 = require("./get-machine-id");
const vlk = async (userLicenceKey) => {
    try {
        const machineId = await (0, get_machine_id_1.getMachineId)();
        if (!machineId) {
            throw new Error('Machine ID not found');
        }
        const lkis = constants_1.lki.find((lki) => (0, encode_decode64_1.decode64)(lki.l) === userLicenceKey && (0, encode_decode64_1.decode64)(lki.m) === machineId);
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
    }
    catch (error) {
        console.error(`Error validating license key: ${error.message}`);
        // process.exit();
        throw Error(error.message);
    }
};
exports.vlk = vlk;
