"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBotConfig = void 0;
const fs_1 = __importDefault(require("fs"));
const BOT_CONFIG_FILE_NAME = 'bot-config.json';
const getBotConfig = async () => {
    try {
        const file = await fs_1.default.promises.readFile(BOT_CONFIG_FILE_NAME, {
            encoding: 'utf8',
        });
        const botConfig = JSON.parse(file);
        if (botConfig['hits-folder-name'] &&
            botConfig['license-key'] &&
            botConfig.proxy &&
            botConfig.openBrowser) {
            let proxy = botConfig.proxy;
            let proxyValidator = new RegExp(/^(?:(\w+)(?::(\w+))?@)?((?:\d{1,3})(?:\.\d{1,3}){3})(?::(\d{1,5}))?$/);
            if (!proxyValidator.test(proxy)) {
                throw Error('Please check proxy format in bot-config.json');
            }
            const openBrowserValidValues = ['yes', 'no'];
            if (!openBrowserValidValues.includes(botConfig.openBrowser)) {
                throw Error('openBrowser option is invalid');
            }
        }
        else {
            throw Error('Please check bot-config.json file.');
        }
        return botConfig;
    }
    catch (error) {
        console.error('A error occurred while reading bot config file.');
        console.error(error.message);
        // process.exit();
        throw Error(error.message);
    }
};
exports.getBotConfig = getBotConfig;
