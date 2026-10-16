import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Moon, Sun, PanelLeftClose, PanelLeftOpen } from "lucide-react";

type PortalTheme = "dark" | "light";
const ThemeContext = createContext<{ theme: PortalTheme; toggle: () => void } | null>(null);
const SidebarContext = createContext<{ expanded: boolean; toggle: () => void } | null>(null);

export function PortalThemeProvider({
  children,
  className = "",
  showToggle = false,
}: {
  children: ReactNode;
  className?: string;
  showToggle?: boolean;
}) {
  const [sidebarExpanded, setSidebarExpanded] = useState(() => {
    try { return localStorage.getItem("bfo-sidebar-expanded") === "true"; } catch { return false; }
  });
  const sidebar = useMemo(() => ({
    expanded: sidebarExpanded,
    toggle: () => setSidebarExpanded((current) => {
      try { localStorage.setItem("bfo-sidebar-expanded", String(!current)); } catch { /* Session-only preference. */ }
      return !current;
    }),
  }), [sidebarExpanded]);
  const [theme, setTheme] = useState<PortalTheme>(() => {
    try {
      const savedTheme = localStorage.getItem("bfo-portal-theme");
      return savedTheme === "dark" ? "dark" : "light";
    } catch {
      return "light";
    }
  });

  useEffect(() => {
    document.body.classList.add("bfo-portal-active");
    document.body.dataset.portalTheme = theme;
    document.body.style.setProperty("--bfo-bg", theme === "dark" ? "#17202d" : "#F7F7F2");
    document.body.style.setProperty("--bfo-sidebar", "#172B4D");
    document.body.style.setProperty("--bfo-panel", theme === "dark" ? "#263449" : "#FFFFFF");
    document.body.style.setProperty("--bfo-panel-raised", theme === "dark" ? "#304057" : "#FFFFFF");
    document.body.style.setProperty("--bfo-input", theme === "dark" ? "#202d40" : "#FFFFFF");
    document.body.style.setProperty("--bfo-border", theme === "dark" ? "#43536a" : "#E2E5E5");
    document.body.style.setProperty("--bfo-text", theme === "dark" ? "#edf1f5" : "#24334A");
    document.body.style.setProperty("--bfo-muted", theme === "dark" ? "#aab6c5" : "#728096");
    document.body.style.setProperty("--bfo-accent", "#D5851F");
    document.body.style.setProperty("--bfo-success", "#87A96B");
    document.body.style.setProperty("--bfo-urgent", "#C94C4C");
    const semanticTokens = theme === "dark"
      ? {
          "--background": "hsl(215 32% 13%)", "--foreground": "hsl(210 20% 95%)",
          "--card": "hsl(215 27% 22%)", "--card-foreground": "hsl(210 20% 95%)",
          "--popover": "hsl(215 27% 22%)", "--popover-foreground": "hsl(210 20% 95%)",
          "--primary": "hsl(35 75% 48%)", "--primary-foreground": "hsl(0 0% 100%)",
          "--secondary": "hsl(215 22% 29%)", "--secondary-foreground": "hsl(210 20% 95%)",
          "--muted": "hsl(215 22% 29%)", "--muted-foreground": "hsl(215 15% 72%)",
          "--accent": "hsl(215 22% 29%)", "--accent-foreground": "hsl(210 20% 95%)",
          "--border": "hsl(215 20% 34%)", "--input": "hsl(215 20% 34%)", "--ring": "hsl(35 75% 48%)",
          "--sidebar-background": "hsl(215 54% 20%)", "--sidebar-foreground": "hsl(210 20% 95%)",
          "--sidebar-border": "hsl(215 20% 34%)", "--sidebar-accent": "hsl(215 22% 29%)",
          "--sidebar-accent-foreground": "hsl(210 20% 95%)", "--sidebar-primary": "hsl(35 75% 48%)",
          "--sidebar-primary-foreground": "hsl(0 0% 100%)", "--sidebar-ring": "hsl(35 75% 48%)",
          "--green-primary": "#87A96B", "--green-secondary": "#78995f",
          "--green-light": "#304057", "--green-accent": "#263449", "--green-dark": "#87A96B",
        }
      : {
          "--background": "hsl(60 20% 96%)", "--foreground": "hsl(215 34% 21%)",
          "--card": "hsl(0 0% 100%)", "--card-foreground": "hsl(215 34% 21%)",
          "--popover": "hsl(0 0% 100%)", "--popover-foreground": "hsl(215 34% 21%)",
          "--primary": "hsl(35 75% 48%)", "--primary-foreground": "hsl(0 0% 100%)",
          "--secondary": "hsl(60 20% 96%)", "--secondary-foreground": "hsl(215 34% 21%)",
          "--muted": "hsl(60 20% 96%)", "--muted-foreground": "hsl(215 12% 52%)",
          "--accent": "hsl(90 18% 93%)", "--accent-foreground": "hsl(215 34% 21%)",
          "--border": "hsl(180 5% 89%)", "--input": "hsl(180 5% 89%)", "--ring": "hsl(35 75% 48%)",
          "--sidebar-background": "hsl(215 54% 20%)", "--sidebar-foreground": "hsl(210 20% 95%)",
          "--sidebar-border": "hsl(215 20% 34%)", "--sidebar-accent": "hsl(215 22% 29%)",
          "--sidebar-accent-foreground": "hsl(210 20% 95%)", "--sidebar-primary": "hsl(35 75% 48%)",
          "--sidebar-primary-foreground": "hsl(0 0% 100%)", "--sidebar-ring": "hsl(35 75% 48%)",
          "--green-primary": "#87A96B", "--green-secondary": "#78995f",
          "--green-light": "#eef3e9", "--green-accent": "#f4f7f0", "--green-dark": "#66834f",
        };
    Object.entries(semanticTokens).forEach(([property, value]) => document.body.style.setProperty(property, value));
    return () => {
      document.body.classList.remove("bfo-portal-active");
      delete document.body.dataset.portalTheme;
      ["--bfo-bg", "--bfo-sidebar", "--bfo-panel", "--bfo-panel-raised", "--bfo-input", "--bfo-border", "--bfo-text", "--bfo-muted", "--bfo-accent", "--bfo-success", "--bfo-urgent"]
        .forEach((property) => document.body.style.removeProperty(property));
      ["--background", "--foreground", "--card", "--card-foreground", "--popover", "--popover-foreground",
        "--primary", "--primary-foreground", "--secondary", "--secondary-foreground", "--muted", "--muted-foreground",
        "--accent", "--accent-foreground", "--border", "--input", "--ring", "--sidebar-background", "--sidebar-foreground",
        "--sidebar-border", "--sidebar-accent", "--sidebar-accent-foreground", "--sidebar-primary",
        "--sidebar-primary-foreground", "--sidebar-ring", "--green-primary", "--green-secondary", "--green-light",
        "--green-accent", "--green-dark"].forEach((property) => document.body.style.removeProperty(property));
    };
  }, [theme]);

  const value = useMemo(() => ({
    theme,
    toggle: () => setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      try {
        localStorage.setItem("bfo-portal-theme", next);
      } catch {
        // Theme remains available for this session when storage is restricted.
      }
      return next;
    }),
  }), [theme]);

  return (
    <ThemeContext.Provider value={value}>
      <SidebarContext.Provider value={sidebar}>
      <div className={`bfo-portal-root ${className}`} data-portal-theme={theme} data-sidebar-expanded={sidebarExpanded}>
        {showToggle && <PortalThemeToggle className="bfo-theme-floating" />}
        {children}
      </div>
      </SidebarContext.Provider>
    </ThemeContext.Provider>
  );
}

export function PortalSidebarToggle() {
  const sidebar = useContext(SidebarContext);
  if (!sidebar) return null;
  const Icon = sidebar.expanded ? PanelLeftClose : PanelLeftOpen;
  return (
    <button type="button" className="bfo-sidebar-toggle" onClick={sidebar.toggle}
      aria-expanded={sidebar.expanded} aria-label={sidebar.expanded ? "Collapse sidebar" : "Expand sidebar"}
      title={sidebar.expanded ? "Collapse sidebar" : "Expand sidebar"} data-testid="button-toggle-sidebar">
      <Icon size={19} aria-hidden="true" /><span>{sidebar.expanded ? "Collapse sidebar" : "Expand sidebar"}</span>
    </button>
  );
}

export function PortalThemeToggle({ className = "" }: { className?: string }) {
  const context = useContext(ThemeContext);
  if (!context) return null;
  const Icon = context.theme === "dark" ? Sun : Moon;
  return (
    <button
      type="button"
      className={`bfo-theme-toggle ${className}`}
      onClick={context.toggle}
      aria-label={`Switch to ${context.theme === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${context.theme === "dark" ? "light" : "dark"} mode`}
    >
      <Icon aria-hidden="true" size={16} />
      <span>{context.theme === "dark" ? "Light mode" : "Dark mode"}</span>
    </button>
  );
}
