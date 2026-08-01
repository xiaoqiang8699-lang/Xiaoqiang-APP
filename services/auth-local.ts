import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

import { clearHistoryForUser } from '@/services/history-store';
import type {
  AuthUser,
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
} from '@/types/auth';

const USERS_KEY = '@ai_style/users_v1';
const SESSION_SECURE_KEY = 'ai_style_session_v1';
/** 旧版明文会话，启动时迁移后删除 */
const LEGACY_SESSION_KEY = '@ai_style/session_v1';

type StoredUser = AuthUser & {
  /** 新版：SHA-256；旧版：simpleHash / 明文兼容字段名 password */
  passwordHash?: string;
  password?: string;
};

function simpleHash(input: string): string {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `h${(h >>> 0).toString(16)}`;
}

async function sha256Hash(password: string, userId: string): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${userId}:${password}`,
  );
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

function validatePhone(phone: string): string | null {
  const p = normalizePhone(phone);
  if (!/^1\d{10}$/.test(p)) return '请输入正确的 11 位手机号';
  return null;
}

function validatePassword(password: string): string | null {
  if (password.length < 6) return '密码至少 6 位';
  return null;
}

async function readUsers(): Promise<StoredUser[]> {
  const raw = await AsyncStorage.getItem(USERS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as StoredUser[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeUsers(users: StoredUser[]): Promise<void> {
  await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
}

async function writeSessionId(userId: string | null): Promise<void> {
  if (!userId) {
    try {
      await SecureStore.deleteItemAsync(SESSION_SECURE_KEY);
    } catch {
      // ignore
    }
    await AsyncStorage.removeItem(LEGACY_SESSION_KEY);
    return;
  }
  await SecureStore.setItemAsync(SESSION_SECURE_KEY, userId);
  await AsyncStorage.removeItem(LEGACY_SESSION_KEY);
}

async function readSessionId(): Promise<string | null> {
  try {
    const secure = await SecureStore.getItemAsync(SESSION_SECURE_KEY);
    if (secure) return secure;
  } catch {
    // SecureStore 不可用时回退
  }

  const legacy = await AsyncStorage.getItem(LEGACY_SESSION_KEY);
  if (!legacy) return null;
  await writeSessionId(legacy);
  return legacy;
}

function toPublicUser(user: StoredUser): AuthUser {
  return {
    id: user.id,
    phone: user.phone,
    nickname: user.nickname,
    avatarUri: user.avatarUri ?? null,
    createdAt: user.createdAt,
  };
}

async function passwordMatches(user: StoredUser, password: string): Promise<boolean> {
  if (user.passwordHash) {
    const next = await sha256Hash(password, user.id);
    if (user.passwordHash === next) return true;
  }
  // 兼容旧版 simpleHash / 明文 password 字段
  if (user.password && (user.password === simpleHash(password) || user.password === password)) {
    return true;
  }
  return false;
}

async function upgradePasswordHash(user: StoredUser, password: string): Promise<StoredUser> {
  const passwordHash = await sha256Hash(password, user.id);
  const { password: _legacy, ...rest } = user;
  return { ...rest, passwordHash };
}

export async function getSessionUser(): Promise<AuthUser | null> {
  const id = await readSessionId();
  if (!id) return null;
  const users = await readUsers();
  const found = users.find((u) => u.id === id);
  return found ? toPublicUser(found) : null;
}

export async function registerLocal(input: RegisterInput): Promise<AuthUser> {
  const phoneError = validatePhone(input.phone);
  if (phoneError) throw new Error(phoneError);
  const passwordError = validatePassword(input.password);
  if (passwordError) throw new Error(passwordError);
  const nickname = input.nickname.trim();
  if (!nickname) throw new Error('请填写昵称');
  if (nickname.length > 20) throw new Error('昵称最多 20 个字');

  const phone = normalizePhone(input.phone);
  const users = await readUsers();
  if (users.some((u) => u.phone === phone)) {
    throw new Error('该手机号已注册，请直接登录');
  }

  const id = `u_${Date.now()}`;
  const passwordHash = await sha256Hash(input.password, id);
  const user: StoredUser = {
    id,
    phone,
    nickname,
    avatarUri: null,
    createdAt: new Date().toISOString(),
    passwordHash,
  };

  users.push(user);
  await writeUsers(users);
  await writeSessionId(user.id);
  return toPublicUser(user);
}

export async function loginLocal(input: LoginInput): Promise<AuthUser> {
  const phoneError = validatePhone(input.phone);
  if (phoneError) throw new Error(phoneError);
  const passwordError = validatePassword(input.password);
  if (passwordError) throw new Error(passwordError);

  const phone = normalizePhone(input.phone);
  const users = await readUsers();
  const index = users.findIndex((u) => u.phone === phone);
  if (index < 0) {
    throw new Error('手机号或密码不正确');
  }

  const found = users[index];
  const ok = await passwordMatches(found, input.password);
  if (!ok) {
    throw new Error('手机号或密码不正确');
  }

  // 登录成功后升级为 SHA-256
  if (!found.passwordHash || found.password) {
    users[index] = await upgradePasswordHash(found, input.password);
    await writeUsers(users);
  }

  await writeSessionId(found.id);
  return toPublicUser(users[index]);
}

export async function logoutLocal(): Promise<void> {
  await writeSessionId(null);
}

export async function updateProfileLocal(
  userId: string,
  patch: UpdateProfileInput,
): Promise<AuthUser> {
  const users = await readUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index < 0) throw new Error('账号不存在，请重新登录');

  const current = users[index];
  let phone = current.phone;
  let nickname = current.nickname;
  let avatarUri = current.avatarUri ?? null;

  if (patch.phone !== undefined) {
    const phoneError = validatePhone(patch.phone);
    if (phoneError) throw new Error(phoneError);
    phone = normalizePhone(patch.phone);
    if (users.some((u) => u.phone === phone && u.id !== userId)) {
      throw new Error('该手机号已被其他账号使用');
    }
  }

  if (patch.nickname !== undefined) {
    const next = patch.nickname.trim();
    if (!next) throw new Error('请填写昵称');
    if (next.length > 20) throw new Error('昵称最多 20 个字');
    nickname = next;
  }

  if (patch.avatarUri !== undefined) {
    avatarUri = patch.avatarUri;
  }

  const next: StoredUser = {
    ...current,
    phone,
    nickname,
    avatarUri,
  };
  users[index] = next;
  await writeUsers(users);
  return toPublicUser(next);
}

export async function changePasswordLocal(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const currentError = validatePassword(currentPassword);
  if (currentError) throw new Error('请输入当前密码');
  const nextError = validatePassword(newPassword);
  if (nextError) throw new Error(nextError);

  const users = await readUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index < 0) throw new Error('账号不存在，请重新登录');

  const found = users[index];
  const ok = await passwordMatches(found, currentPassword);
  if (!ok) throw new Error('当前密码不正确');

  const passwordHash = await sha256Hash(newPassword, found.id);
  const { password: _legacy, ...rest } = found;
  users[index] = { ...rest, passwordHash };
  await writeUsers(users);
}

/**
 * 删除当前账号：清除会话、用户记录与该用户穿搭历史。
 * App Store Guideline 5.1.1(v) 要求提供账号删除能力。
 */
export async function deleteAccountLocal(userId: string): Promise<void> {
  const users = await readUsers();
  await writeUsers(users.filter((u) => u.id !== userId));
  const sessionId = await readSessionId();
  if (sessionId === userId) {
    await writeSessionId(null);
  }
  await clearHistoryForUser(userId);
}
