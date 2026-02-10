import crypto from 'node:crypto';

const OTP_PREFIX = 'sha256:';

export function generateOtpCode() {
  return String(crypto.randomInt(100000, 1000000));
}

export function hashOtpCode(code: string) {
  const normalized = String(code || '').trim();
  const digest = crypto.createHash('sha256').update(normalized).digest('hex');
  return `${OTP_PREFIX}${digest}`;
}

export function verifyOtpCode(storedCode: string, providedCode: string) {
  const stored = String(storedCode || '').trim();
  const provided = String(providedCode || '').trim();
  if (!stored || !provided) return false;

  if (stored.startsWith(OTP_PREFIX)) {
    const expected = stored.slice(OTP_PREFIX.length);
    const actual = crypto.createHash('sha256').update(provided).digest('hex');
    const expectedBuf = Buffer.from(expected, 'hex');
    const actualBuf = Buffer.from(actual, 'hex');
    if (expectedBuf.length !== actualBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, actualBuf);
  }

  return stored === provided;
}
