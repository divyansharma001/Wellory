export const designTokens = {
  colors: {
    background: "#f6f3ea",
    surface: "#fffdf8",
    text: "#1f2a24",
    muted: "#6c786f",
    accent: "#2f6b57",
    accentSoft: "#dff0e8",
    warning: "#b86b38",
  },
  radius: {
    card: 22,
    hero: 30,
  },
} as const;

export const apiModules = [
  {
    title: "Logging",
    description: "Text logs, voice notes, water, exercise, and weight entries.",
  },
  {
    title: "Meals",
    description: "Photo meals, manual meals, revision history, and nutrition rollups.",
  },
  {
    title: "Coach",
    description: "Grounded AI chat, weekly insights, and goal recommendations.",
  },
  {
    title: "Progress",
    description: "Day and week dashboards, adherence scoring, and trend tracking.",
  },
] as const;
