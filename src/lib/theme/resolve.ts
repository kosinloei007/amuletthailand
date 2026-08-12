export type ResolvedTheme = {
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  logoUrl: string | null;
  fontFamily: string | null;
  layoutStyle: string;
};

// ใช้เมื่อร้านยังไม่ได้ตั้ง theme (Tenant.themeId เป็น null) — สีกลางๆ ให้เว็บยังใช้งานได้ปกติ
export const DEFAULT_THEME: ResolvedTheme = {
  primaryColor: "#171717",
  accentColor: "#4a4a4a",
  backgroundColor: "#ffffff",
  surfaceColor: "#f5f5f5",
  textColor: "#171717",
  logoUrl: null,
  fontFamily: null,
  layoutStyle: "classic",
};

export function resolveTheme(theme: ResolvedTheme | null | undefined): ResolvedTheme {
  return theme ?? DEFAULT_THEME;
}
