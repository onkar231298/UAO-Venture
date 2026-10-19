export type PortalMode = "light" | "dark";
export type PortalPaletteId = "navy-amber" | "ocean-teal" | "forest-sage" | "plum-gold";
interface PaletteSurface {
  bg: string; panel: string; raised: string; input: string;
  text: string; muted: string; border: string; accentReadable: string;
}
export interface PortalPalette {
  id: PortalPaletteId; name: string; description: string;
  sidebar: string; accent: string; action: string;
  light: PaletteSurface; dark: PaletteSurface;
}

export const PORTAL_PALETTES: readonly PortalPalette[] = [
  {
    id: "navy-amber", name: "Navy & Amber", description: "Inky navy, crisp slate and warm amber actions.",
    sidebar: "#142B4A", accent: "#D18A28", action: "#A35C12",
    light: { bg: "#F4F7FA", panel: "#FFFFFF", raised: "#E9EEF4", input: "#FFFFFF", text: "#1E2A3A", muted: "#536477", border: "#CCD6E1", accentReadable: "#88500D" },
    dark: { bg: "#111C2B", panel: "#1D2B3F", raised: "#293B52", input: "#18273A", text: "#F4F7FC", muted: "#BECADA", border: "#3A4D66", accentReadable: "#F4BE73" },
  },
  {
    id: "ocean-teal", name: "Ocean & Teal", description: "Deep blue-green with bright, confident aqua.",
    sidebar: "#0B3945", accent: "#13A3A1", action: "#087775",
    light: { bg: "#F1F8F8", panel: "#FFFFFF", raised: "#E3F1F1", input: "#FFFFFF", text: "#17353B", muted: "#526B70", border: "#C8DDDE", accentReadable: "#08706D" },
    dark: { bg: "#0D242B", panel: "#17353D", raised: "#21444C", input: "#112C33", text: "#EAF7F7", muted: "#B3D0D2", border: "#365A61", accentReadable: "#73D4CF" },
  },
  {
    id: "forest-sage", name: "Forest & Sage", description: "Grounded evergreen with fresh, natural highlights.",
    sidebar: "#183D34", accent: "#79A95B", action: "#336B46",
    light: { bg: "#F2F7F2", panel: "#FFFFFF", raised: "#E5EFE4", input: "#FFFFFF", text: "#203B30", muted: "#52695B", border: "#C9DACB", accentReadable: "#386B3F" },
    dark: { bg: "#14271F", panel: "#20382C", raised: "#2B4637", input: "#1A3225", text: "#EDF5EC", muted: "#B9CFB9", border: "#405C49", accentReadable: "#B7D89F" },
  },
  {
    id: "plum-gold", name: "Plum & Gold", description: "Rich aubergine with polished, understated brass.",
    sidebar: "#3D2A49", accent: "#C8A05B", action: "#795178",
    light: { bg: "#F8F4F8", panel: "#FFFFFF", raised: "#F0E8F1", input: "#FFFFFF", text: "#382A40", muted: "#675A6D", border: "#DED2E1", accentReadable: "#76581F" },
    dark: { bg: "#281E31", panel: "#3C2D47", raised: "#4A3856", input: "#302338", text: "#F4EEF6", muted: "#CEBDD7", border: "#624D6A", accentReadable: "#E5C98E" },
  },
];

export function getPortalPalette(id: unknown): PortalPalette {
  return PORTAL_PALETTES.find((palette) => palette.id === id) || PORTAL_PALETTES[0];
}

/** Shared by the workspace root and body-portalled dialogs/menus. */
export function portalPaletteTokens(id: PortalPaletteId, mode: PortalMode): Record<string, string> {
  const palette = getPortalPalette(id);
  const surface = palette[mode];
  const soft = `color-mix(in srgb, ${palette.accent} 15%, ${surface.panel})`;
  return {
    "--bfo-bg": surface.bg, "--bfo-sidebar": palette.sidebar,
    "--bfo-panel": surface.panel, "--bfo-panel-raised": surface.raised,
    "--bfo-input": surface.input, "--bfo-border": surface.border,
    "--bfo-text": surface.text, "--bfo-muted": surface.muted,
    "--bfo-accent": palette.accent, "--bfo-accent-soft": soft,
    "--bfo-action": palette.action, "--bfo-on-action": "#FFFFFF",
    "--bfo-accent-readable": surface.accentReadable,
    "--bfo-sidebar-active-bg": `color-mix(in srgb, ${palette.dark.accentReadable} 24%, ${palette.sidebar})`,
    "--bfo-sidebar-text": "#EDF3F7", "--bfo-sidebar-muted": "#C1CFDA",
    "--bfo-sidebar-accent": palette.dark.accentReadable,
    "--bfo-sidebar-hover": "rgba(255,255,255,.12)",
    "--bfo-success": "#87A96B", "--bfo-urgent": "#C94C4C",
    "--background": surface.bg, "--foreground": surface.text,
    "--card": surface.panel, "--card-foreground": surface.text,
    "--popover": surface.panel, "--popover-foreground": surface.text,
    "--primary": palette.action, "--primary-foreground": "#FFFFFF",
    "--secondary": surface.raised, "--secondary-foreground": surface.text,
    "--muted": surface.raised, "--muted-foreground": surface.muted,
    "--accent": soft, "--accent-foreground": surface.text,
    "--border": surface.border, "--input": surface.border, "--ring": palette.accent,
    "--sidebar-background": palette.sidebar, "--sidebar-foreground": "#EDF3F7",
    "--sidebar-border": "rgba(255,255,255,.18)", "--sidebar-accent": "rgba(255,255,255,.12)",
    "--sidebar-accent-foreground": "#FFFFFF", "--sidebar-primary": palette.accent,
    "--sidebar-primary-foreground": "#FFFFFF", "--sidebar-ring": palette.accent,
    "--green-primary": palette.action, "--green-secondary": palette.action,
    "--green-light": soft, "--green-accent": surface.raised, "--green-dark": palette.action,
  };
}
