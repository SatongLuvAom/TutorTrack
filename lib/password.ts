import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

const KEY_LENGTH = 64;
const PASSWORD_SCHEME = "scrypt";
export const DEMO_PASSWORD = "TutorTrackDemo123!";
export const LEGACY_DEMO_PASSWORD_HASH = "placeholder-password-hash-auth-phase";

export function canUseLegacyDemoPassword(email: string): boolean {
  if (!email.endsWith("@tutortrack.test")) {
    return false;
  }

  return (
    process.env.NODE_ENV !== "production" ||
    process.env.ALLOW_DEMO_PASSWORD_LOGIN === "true"
  );
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("base64url");
  const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;

  return `${PASSWORD_SCHEME}$${salt}$${derivedKey.toString("base64url")}`;
}

export async function verifyPassword(
  password: string,
  storedHash: string | null | undefined,
  options: { allowLegacyDemoHash?: boolean } = {},
): Promise<boolean> {
  if (!storedHash) {
    return false;
  }

  if (storedHash === LEGACY_DEMO_PASSWORD_HASH) {
    return options.allowLegacyDemoHash === true && password === DEMO_PASSWORD;
  }

  const [scheme, salt, encodedHash] = storedHash.split("$");
  if (scheme !== PASSWORD_SCHEME || !salt || !encodedHash) {
    return false;
  }

  const expected = Buffer.from(encodedHash, "base64url");
  const actual = (await scrypt(password, salt, expected.length)) as Buffer;

  return (
    actual.length === expected.length && timingSafeEqual(actual, expected)
  );
}
