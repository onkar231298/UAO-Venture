import { useState, type ComponentType } from "react";
import { MoreHorizontal, X } from "lucide-react";
import { PortalOverlay } from "./PortalOverlay";

export interface PortalNavDestination {
  key: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  onSelect: () => void;
  active?: boolean;
  badge?: string | number;
}

export function PortalMobileNav({
  items,
  primaryKeys,
}: {
  items: PortalNavDestination[];
  primaryKeys: string[];
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const primaryItems = primaryKeys
    .map((key) => items.find((item) => item.key === key))
    .filter((item): item is PortalNavDestination => !!item);

  const selectItem = (item: PortalNavDestination) => {
    item.onSelect();
    setMoreOpen(false);
  };

  return (
    <>
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
            <div className="bfo-more-grid">
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    type="button"
                    key={item.key}
                    className={item.active ? "is-active" : ""}
                    onClick={() => selectItem(item)}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                    {item.badge !== undefined && <small>{item.badge}</small>}
                  </button>
                );
              })}
            </div>
      </PortalOverlay>
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
        <button type="button" onClick={() => setMoreOpen(true)} aria-expanded={moreOpen}>
          <MoreHorizontal className="h-[18px] w-[18px]" />
          <span>More</span>
        </button>
      </nav>
    </>
  );
}
