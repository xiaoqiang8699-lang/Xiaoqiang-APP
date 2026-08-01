export type AuthUser = {
  id: string;
  phone: string;
  nickname: string;
  /** 本地头像可选；无则用首字占位 */
  avatarUri?: string | null;
  createdAt: string;
};

export type RegisterInput = {
  phone: string;
  password: string;
  nickname: string;
};

export type LoginInput = {
  phone: string;
  password: string;
};

export type UpdateProfileInput = {
  nickname?: string;
  phone?: string;
  avatarUri?: string | null;
};

export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
};
