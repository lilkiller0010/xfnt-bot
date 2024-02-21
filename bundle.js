'use strict';

Object.defineProperty(exports, "__esModule", { value: true });
const readline_1 = require("readline");
const app_1 = require("./app");
const utils_1 = require("./utils");
const validate_license_key_1 = require("./utils/validate-license-key");
const get_bot_config_1 = require("./utils/get-bot-config");
try {
    const readline = (0, readline_1.createInterface)({
        input: process.stdin,
        output: process.stdout,
    });
    const readLineAsync = (msg) => {
        return new Promise((resolve) => {
            readline.question(msg, (userRes) => {
                resolve(userRes);
            });
        });
    };
    const start = async () => {
        const botConfig = await (0, get_bot_config_1.getBotConfig)();
        const { machineId, licenseKey } = await (0, validate_license_key_1.validateLicenseKey)(botConfig['license-key']);
        console.log(`machineId: ${machineId}\n`);
        console.log(`licenseKey: ${licenseKey}\n`);
        setInterval(async () => {
            const licenseKey = await (0, validate_license_key_1.validateLicenseKey)(botConfig['license-key']);
            if (licenseKey.isExpired) {
                // process.exit();
            }
        }, 20000);
        const comboListFileName = await readLineAsync('Insert the COMBO_LIST FileName: ');
        readline.close();
        (0, app_1.runWebScraping)((0, utils_1.getTime)(), comboListFileName);
    };
    start();
}
catch (error) {
    console.log('high catch', error);
}
