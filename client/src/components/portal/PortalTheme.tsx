import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Moon, Sun } from "lucide-react";

type PortalTheme = "dark" | "light";
const ThemeContext = createContext<{ theme: PortalTheme; toggle: () => void } | null>(null);

export function PortalThemeProvider({
  children,
  className = "",
  showToggle = false,
}: {
  children: ReactNode;
  className?: string;
  showToggle?: boolean;
}) {
  const [theme, setTheme] = useState<PortalTheme>(() => {
    try {
      return localStorage.getItem("bfo-portal-theme") === "light" ? "light" : "dark";
    } catch {
      return "dark";
    }
  });

  useEffect(() => {
    document.body.classList.add("bfo-portal-active");
    document.body.dataset.portalTheme = theme;
    document.body.style.setProperty("--bfo-bg", theme === "dark" ? "#17191b" : "#eeece8");
    document.body.style.setProperty("--bfo-panel", theme === "dark" ? "#222527" : "#fbfaf7");
    document.body.style.setProperty("--bfo-panel-raised", theme === "dark" ? "#292c2e" : "#f1efea");
    document.body.style.setProperty("--bfo-input", theme === "dark" ? "#1b1e20" : "#fffefa");
    document.body.style.setProperty("--bfo-border", theme === "dark" ? "#393d3f" : "#d8d4cd");
    document.body.style.setProperty("--bfo-text", theme === "dark" ? "#f2f0ec" : "#272727");
    document.body.style.setProperty("--bfo-muted", theme === "dark" ? "#a4a5a2" : "#6f706e");
    document.body.style.setProperty("--bfo-accent", theme === "dark" ? "#ef7d43" : "#c95f2d");
    const semanticTokens = theme === "dark"
      ? {
          "--background": "hsl(210 4% 10%)", "--foreground": "hsl(40 15% 93%)",
          "--card": "hsl(195 4% 14%)", "--card-foreground": "hsl(40 15% 93%)",
          "--popover": "hsl(195 4% 14%)", "--popover-foreground": "hsl(40 15% 93%)",
          "--primary": "hsl(20 83% 60%)", "--primary-foreground": "hsl(23 27% 11%)",
          "--secondary": "hsl(195 6% 17%)", "--secondary-foreground": "hsl(40 15% 93%)",
          "--muted": "hsl(195 6% 17%)", "--muted-foreground": "hsl(90 2% 64%)",
          "--accent": "hsl(27 6% 19%)", "--accent-foreground": "hsl(40 15% 93%)",
          "--border": "hsl(195 5% 24%)", "--input": "hsl(195 5% 24%)", "--ring": "hsl(20 83% 60%)",
          "--sidebar-background": "hsl(210 4% 11%)", "--sidebar-foreground": "hsl(40 15% 93%)",
          "--sidebar-border": "hsl(195 5% 24%)", "--sidebar-accent": "hsl(195 6% 17%)",
          "--sidebar-accent-foreground": "hsl(40 15% 93%)", "--sidebar-primary": "hsl(20 83% 60%)",
          "--sidebar-primary-foreground": "hsl(23 27% 11%)", "--sidebar-ring": "hsl(20 83% 60%)",
          "--green-primary": "#ef7d43", "--green-secondary": "#dc7040",
          "--green-light": "#3a302a", "--green-accent": "#292623", "--green-dark": "#bd5b32",
        }
      : {
          "--background": "hsl(40 13% 92%)", "--foreground": "hsl(0 0% 15%)",
          "--card": "hsl(45 33% 98%)", "--card-foreground": "hsl(0 0% 15%)",
          "--popover": "hsl(45 33% 98%)", "--popover-foreground": "hsl(0 0% 15%)",
          "--primary": "hsl(19 63% 48%)", "--primary-foreground": "hsl(30 100% 98%)",
          "--secondary": "hsl(45 20% 93%)", "--secondary-foreground": "hsl(0 0% 15%)",
          "--muted": "hsl(45 20% 93%)", "--muted-foreground": "hsl(90 1% 44%)",
          "--accent": "hsl(22 53% 93%)", "--accent-foreground": "hsl(23 30% 18%)",
          "--border": "hsl(40 11% 83%)", "--input": "hsl(40 11% 83%)", "--ring": "hsl(19 63% 48%)",
          "--sidebar-background": "hsl(45 27% 96%)", "--sidebar-foreground": "hsl(0 0% 15%)",
          "--sidebar-border": "hsl(40 11% 83%)", "--sidebar-accent": "hsl(45 20% 93%)",
          "--sidebar-accent-foreground": "hsl(0 0% 15%)", "--sidebar-primary": "hsl(19 63% 48%)",
          "--sidebar-primary-foreground": "hsl(30 100% 98%)", "--sidebar-ring": "hsl(19 63% 48%)",
          "--green-primary": "#c95f2d", "--green-secondary": "#b65228",
          "--green-light": "#f1e2d7", "--green-accent": "#f6eee8", "--green-dark": "#98451f",
        };
    Object.entries(semanticTokens).forEach(([property, value]) => document.body.style.setProperty(property, value));
    return () => {
      document.body.classList.remove("bfo-portal-active");
      delete document.body.dataset.portalTheme;
      ["--bfo-bg", "--bfo-panel", "--bfo-panel-raised", "--bfo-input", "--bfo-border", "--bfo-text", "--bfo-muted", "--bfo-accent"]
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
      <div className={`bfo-portal-root ${className}`} data-portal-theme={theme}>
        {showToggle && <PortalThemeToggle className="bfo-theme-floating" />}
        {children}
      </div>
    </ThemeContext.Provider>
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
