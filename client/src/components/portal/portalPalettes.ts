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
    id: "navy-amber", name: "Navy & Amber", description: "Classic navy with warm, clear action colours.",
    sidebar: "#172B4D", accent: "#D5851F", action: "#9C5B0F",
    light: { bg: "#F7F7F2", panel: "#FFFFFF", raised: "#F0F2EE", input: "#FFFFFF", text: "#24334A", muted: "#59697B", border: "#DCE2E6", accentReadable: "#8D5109" },
    dark: { bg: "#17202D", panel: "#263449", raised: "#304057", input: "#202D40", text: "#EDF1F5", muted: "#B4C0CF", border: "#43536A", accentReadable: "#F3BF76" },
  },
  {
    id: "ocean-teal", name: "Ocean & Teal", description: "Deep ocean blue with balanced teal highlights.",
    sidebar: "#103B4A", accent: "#12949A", action: "#08777D",
    light: { bg: "#F1F7F8", panel: "#FFFFFF", raised: "#E8F1F3", input: "#FFFFFF", text: "#143742", muted: "#4F6872", border: "#D4E3E7", accentReadable: "#076A70" },
    dark: { bg: "#10272E", panel: "#1B3942", raised: "#254954", input: "#133039", text: "#EAF6F7", muted: "#AFCDD1", border: "#3D5B65", accentReadable: "#71D5D6" },
  },
  {
    id: "forest-sage", name: "Forest & Sage", description: "Grounded forest green and gentle sage accents.",
    sidebar: "#173C35", accent: "#5D8B52", action: "#3D6F3C",
    light: { bg: "#F2F6F1", panel: "#FFFFFF", raised: "#E8EFE5", input: "#FFFFFF", text: "#243D33", muted: "#52665A", border: "#D7E2D5", accentReadable: "#3C6838" },
    dark: { bg: "#172B24", panel: "#243E31", raised: "#2E4B3B", input: "#1B3328", text: "#EDF5EA", muted: "#B7CDB6", border: "#47614E", accentReadable: "#B0D69E" },
  },
  {
    id: "plum-gold", name: "Plum & Gold", description: "Rich plum surfaces with restrained gold details.",
    sidebar: "#35263F", accent: "#BA9653", action: "#805078",
    light: { bg: "#F8F4F7", panel: "#FFFFFF", raised: "#F0E8F0", input: "#FFFFFF", text: "#392B43", muted: "#6D5C74", border: "#E1D7E4", accentReadable: "#735814" },
    dark: { bg: "#281F30", panel: "#3B2D45", raised: "#493652", input: "#302337", text: "#F5EFF8", muted: "#CFBBD8", border: "#604B6A", accentReadable: "#E3C58D" },
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
