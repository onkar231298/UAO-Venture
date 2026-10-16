import { createContext, useContext, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { Moon, Sun, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { useAccountAppearance } from "./useAccountAppearance";
import { portalPaletteTokens } from "./portalPalettes";

type AppearanceContext = ReturnType<typeof useAccountAppearance> & { toggle: () => void };
const ThemeContext = createContext<AppearanceContext | null>(null);
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
  const { user } = useAuth();
  const { customer } = useCustomerAuth();
  const staffId = (user as { id?: string } | undefined)?.id;
  const account = className.includes("customer")
    ? (customer?.id ? `customer:${customer.id}` : null)
    : (staffId ? `staff:${staffId}` : null);
  const appearance = useAccountAppearance(account);
  const { theme, palette, setTheme } = appearance;
  const tokens = useMemo(() => portalPaletteTokens(palette, theme), [palette, theme]);

  useEffect(() => {
    document.body.classList.add("bfo-portal-active");
    document.body.dataset.portalTheme = theme;
    document.body.dataset.portalPalette = palette;
    const previous = Object.keys(tokens).map((property) => ({
      property, value: document.body.style.getPropertyValue(property),
      priority: document.body.style.getPropertyPriority(property),
    }));
    Object.entries(tokens).forEach(([property, value]) => document.body.style.setProperty(property, value));
    return () => {
      document.body.classList.remove("bfo-portal-active");
      delete document.body.dataset.portalTheme;
      delete document.body.dataset.portalPalette;
      previous.forEach(({ property, value, priority }) => {
        if (value) document.body.style.setProperty(property, value, priority);
        else document.body.style.removeProperty(property);
      });
    };
  }, [theme, palette, tokens]);

  const value = useMemo(() => ({
    ...appearance,
    toggle: () => setTheme(theme === "dark" ? "light" : "dark"),
  }), [appearance, theme, setTheme]);

  return (
    <ThemeContext.Provider value={value}>
      <SidebarContext.Provider value={sidebar}>
      <div className={`bfo-portal-root ${className}`} data-portal-theme={theme} data-portal-palette={palette}
        data-sidebar-expanded={sidebarExpanded} style={tokens as CSSProperties}>
        {showToggle && <PortalThemeToggle className="bfo-theme-floating" />}
        {children}
      </div>
      </SidebarContext.Provider>
    </ThemeContext.Provider>
  );
}

export function usePortalAppearance() {
  const appearance = useContext(ThemeContext);
  if (!appearance) throw new Error("Appearance settings require a workspace theme provider.");
  return appearance;
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

export function usePortalSidebarExpanded() {
  return useContext(SidebarContext)?.expanded ?? false;
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
