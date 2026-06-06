export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export const ACCESS_TOKEN_EXPIRES_IN = "8h";
export const REFRESH_TOKEN_EXPIRES_IN = "30d";
