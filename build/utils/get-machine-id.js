"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMachineId = void 0;
const child_process_1 = require("child_process");
const node_util_1 = require("node:util");
const execAsync = (0, node_util_1.promisify)(child_process_1.exec);
const comand = '(Get-CimInstance -Class Win32_ComputerSystemProduct).UUID';
const getMachineId = async () => {
    try {
        const { stdout, stderr } = await execAsync(`powershell -Command "${comand}"`);
        if (stderr) {
            throw new Error(`PowerShell command had errors: ${stderr}`);
        }
        return stdout.trim();
    }
    catch (error) {
        console.error(`Error executing PowerShell command: ${error.message}`);
    }
};
exports.getMachineId = getMachineId;
