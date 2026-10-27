import "dotenv/config";
import crypto from "node:crypto";
import {
  createUser,
  findUserByName,
  updateUserAvatar,
  toPublicUser,
  User,
} from "../db.js";

const SECRET =
  process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex");
if (!process.env.SESSION_SECRET) {
  console.log("[mit.mi] brak SESSION_SECRET, sesje wygasna po restarcie serwera");
}

const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 14;
const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,24}$/;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, saltHex, hashHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = crypto.scryptSync(
    password,
    Buffer.from(saltHex, "hex"),
    expected.length
  );
  return crypto.timingSafeEqual(expected, actual);
}

function sign(data: string): string {
  return crypto.createHmac("sha256", SECRET).update(data).digest("base64url");
}

export function createToken(userId: string): string {
  const payload = Buffer.from(
    JSON.stringify({ uid: userId, exp: Date.now() + TOKEN_TTL_MS })
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function readToken(token: string): string | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);
  if (
    expected.length !== given.length ||
    !crypto.timingSafeEqual(expected, given)
  ) {
    return null;
  }
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (
      typeof data.uid !== "string" ||
      typeof data.exp !== "number" ||
      data.exp < Date.now()
    ) {
      return null;
    }
    return data.uid;
  } catch {
    return null;
  }
}

export interface AuthResult {
  token: string;
  user: User;
}

export type ServiceResult<T> =
  | { success: true; data: T; status?: number }
  | { success: false; error: string; status: number };

export async function registerUser(
  rawUsername: unknown,
  rawPassword: unknown,
  rawAvatar: unknown
): Promise<ServiceResult<AuthResult>> {
  const username = String(rawUsername || "").trim();
  const password = String(rawPassword || "");
  const avatar = String(rawAvatar || "User");

  if (!USERNAME_RE.test(username)) {
    return {
      success: false,
      error: "nazwa: 3-24 znaki (litery, cyfry, _ . -)",
      status: 400,
    };
  }

  if (password.length < 8 || password.length > 128) {
    return {
      success: false,
      error: "haslo musi miec co najmniej 8 znakow",
      status: 400,
    };
  }

  const user = await createUser(username, hashPassword(password), avatar);
  if (!user) {
    return {
      success: false,
      error: "ta nazwa jest juz zajeta",
      status: 409,
    };
  }

  return {
    success: true,
    status: 201,
    data: {
      token: createToken(user.id),
      user: toPublicUser(user),
    },
  };
}

export async function loginUser(
  rawUsername: unknown,
  rawPassword: unknown
): Promise<ServiceResult<AuthResult>> {
  const username = String(rawUsername || "").trim();
  const password = String(rawPassword || "");
  const user = await findUserByName(username);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return {
      success: false,
      error: "nieprawidlowa nazwa lub haslo",
      status: 401,
    };
  }

  return {
    success: true,
    status: 200,
    data: {
      token: createToken(user.id),
      user: toPublicUser(user),
    },
  };
}

export async function updateProfileAvatar(
  userId: string,
  rawAvatar: unknown
): Promise<ServiceResult<User>> {
  const avatar = String(rawAvatar || "").trim();

  if (!avatar || avatar.length > 32) {
    return {
      success: false,
      error: "nieprawidlowa ikona",
      status: 400,
    };
  }

  const user = await updateUserAvatar(userId, avatar);
  if (!user) {
    return {
      success: false,
      error: "nie znaleziono uzytkownika",
      status: 404,
    };
  }

  return {
    success: true,
    status: 200,
    data: user,
  };
}
