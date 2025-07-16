const redact = (obj, keysToRedact = ['password', 'token', 'authorization']) => {
  if (!obj || typeof obj !== 'object') return obj;

  return Object.fromEntries(
    Object.entries(obj).map(([key, val]) => (keysToRedact.includes(key.toLowerCase())
      ? [key, '****']
      : [key, val])),
  );
};

module.exports = redact;
