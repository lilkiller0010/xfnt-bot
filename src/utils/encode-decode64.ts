export const decode64 = (code: string) => {
  const buff = Buffer.from(code, 'base64').toString('utf-8');

  return buff;
};

export const encode64 = (code: string) => {
  const buff = Buffer.from(code, 'utf-8').toString('base64');

  return buff;
};
