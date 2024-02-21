import { exec } from 'child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

const comand = '(Get-CimInstance -Class Win32_ComputerSystemProduct).UUID';

export const getMachineId = async () => {
  try {
    const { stdout, stderr } = await execAsync(
      `powershell -Command "${comand}"`,
    );

    if (stderr) {
      throw new Error(`PowerShell command had errors: ${stderr}`);
    }

    return stdout.trim();
  } catch (error) {
    console.error(
      `Error executing PowerShell command: ${(error as Error).message}`,
    );
  }
};
