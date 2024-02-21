declare module 'cryptolens' {
  export const Helpers = {
    GetMachineCode(): string
  }

  export const Key;
}


declare module NodeJS {
  interface Process extends NodeJS.Process {
    pkg?: string
  }
}
