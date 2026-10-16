export const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://localhost:8080',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:3000',
  'https://renderdragon.org',
  'https://www.renderdragon.org',
  'https://api.codersoft.xyz',
  'https://assets.codersoft.xyz',
  'https://assets-api-worker.powernplant101-c6b.workers.dev',
]);

const isLocalNetworkHostname = (hostname) => {
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]') return true;
  const octets = hostname.split('.').map(Number);
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) return false;
  const [first, second] = octets;
  return first === 10
    || (first === 172 && second >= 16 && second <= 31)
    || (first === 192 && second === 168)
    || (first === 100 && second >= 64 && second <= 127);
};

export const isAllowedOrigin = (origin) => {
  if (allowedOrigins.has(origin)) return true;
  try {
    const url = new URL(origin);
    return url.protocol === 'http:' && isLocalNetworkHostname(url.hostname);
  } catch {
    return false;
  }
};
