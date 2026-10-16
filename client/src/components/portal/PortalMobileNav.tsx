import { useEffect, useRef, useState, type ComponentType } from "react";
import { MoreHorizontal, X } from "lucide-react";
import { PortalOverlay } from "./PortalOverlay";
import { PortalThemeToggle, PortalSidebarToggle } from "./PortalTheme";
import { PortalNavigationTree, revealActiveSidebar } from "./PortalNavigation";

export interface PortalNavDestination {
  key: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  onSelect: () => void;
  active?: boolean;
  badge?: string | number;
  group?: string;
  parentKey?: string;
}

export function PortalMobileNav({
  items,
  primaryKeys,
  showThemeToggle = false,
}: {
  items: PortalNavDestination[];
  primaryKeys: string[];
  showThemeToggle?: boolean;
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const markerRef = useRef<HTMLSpanElement>(null);
  const activeKeys = items.filter((item) => item.active).map((item) => item.key).join("|");
  useEffect(() => {
    const root = markerRef.current?.closest<HTMLElement>(".bfo-portal-root");
    if (root) revealActiveSidebar(items, root);
  }, [activeKeys]);
  const primaryItems = primaryKeys
    .map((key) => items.find((item) => item.key === key))
    .filter((item): item is PortalNavDestination => !!item);
  const utilities = items.filter((item) =>
    /settings|profile|website-home|logout/i.test(item.key) ||
    /^(Back to Website|Log ?out|Settings|Profile Settings|System Settings|Email Settings)$/i.test(item.label));

  const selectItem = (item: PortalNavDestination) => {
    item.onSelect();
    setMoreOpen(false);
  };

  return (
    <>
      <span ref={markerRef} hidden />
      <PortalSidebarToggle />
      <PortalOverlay open={moreOpen} onOpenChange={setMoreOpen}
        title="All workspace destinations" className="bfo-more-sheet">
            <div className="bfo-more-heading">
              <div>
                <p className="bfo-eyebrow">Workspace</p>
                <h2>All destinations</h2>
              </div>
              <button type="button" aria-label="Close destinations" onClick={() => setMoreOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <PortalNavigationTree items={items} onSelect={selectItem} />
            {showThemeToggle && <div className="bfo-more-utilities"><PortalThemeToggle /></div>}
      </PortalOverlay>
      <nav className="bfo-desktop-destinations" aria-label="Workspace destinations">
        <button type="button" onClick={() => setMoreOpen(true)} aria-expanded={moreOpen} aria-label="Open all workspace destinations" title="All destinations">
          <MoreHorizontal className="h-[18px] w-[18px]" />
        </button>
      </nav>
      <nav className="bfo-utility-dock" aria-label="Workspace account utilities">
        {utilities.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.key} type="button" onClick={() => selectItem(item)}
              aria-label={item.label} title={item.label}>
              <Icon className="h-4 w-4" /><span>{item.label}</span>
            </button>
          );
        })}
        {showThemeToggle && <PortalThemeToggle />}
      </nav>
      <nav className="bfo-mobile-dock" aria-label="Mobile workspace navigation">
        {primaryItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              type="button"
              key={item.key}
              className={item.active ? "is-active" : ""}
              aria-current={item.active ? "page" : undefined}
              onClick={() => selectItem(item)}
            >
              <Icon className="h-[18px] w-[18px]" />
              <span>{item.label}</span>
              {item.badge !== undefined && <i>{item.badge}</i>}
            </button>
          );
        })}
        <button type="button" onClick={() => setMoreOpen(true)} aria-expanded={moreOpen} aria-label="Open all workspace destinations">
          <MoreHorizontal className="h-[18px] w-[18px]" />
          <span>More</span>
        </button>
      </nav>
    </>
  );
}
