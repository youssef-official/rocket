// Local stub — payments removed in OSS build.
export const paypal = {
  createOrder: async () => ({ id: 'local' }),
  captureOrder: async () => ({ status: 'COMPLETED' }),
};
