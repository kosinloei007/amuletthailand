// ธีมตั้งต้น 3 แบบ ตามตัวอย่างใน docs/theming.md

export type ThemeSeed = {
  name: string;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  fontFamily: string;
  layoutStyle: string;
};

export const themes: ThemeSeed[] = [
  {
    name: "ทองวัด",
    primaryColor: "#8a5a2b",
    accentColor: "#c9a227",
    backgroundColor: "#faf6ee",
    surfaceColor: "#ffffff",
    textColor: "#2b2118",
    fontFamily: "Noto Serif Thai",
    layoutStyle: "gold-temple",
  },
  {
    name: "มินิมอลขาว-ดำ",
    primaryColor: "#111111",
    accentColor: "#4a4a4a",
    backgroundColor: "#ffffff",
    surfaceColor: "#f5f5f5",
    textColor: "#111111",
    fontFamily: "Noto Sans Thai",
    layoutStyle: "minimal",
  },
  {
    name: "แดง-มงคล",
    primaryColor: "#b3122e",
    accentColor: "#d4af37",
    backgroundColor: "#fff8f0",
    surfaceColor: "#ffffff",
    textColor: "#2b1010",
    fontFamily: "Noto Serif Thai",
    layoutStyle: "classic",
  },
];
