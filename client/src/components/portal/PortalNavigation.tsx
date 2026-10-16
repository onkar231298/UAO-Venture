import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { usePortalSidebarExpanded } from "./PortalTheme";
import type { PortalNavDestination } from "./PortalMobileNav";
import "@/styles/portal-navigation.css";

function NavigationLeaf({ item, onSelect }: {
  item: PortalNavDestination;
  onSelect: (item: PortalNavDestination) => void;
}) {
  const Icon = item.icon;
  return (
    <button type="button" className={`bfo-nav-tree-leaf ${item.active ? "is-active" : ""}`}
      aria-current={item.active ? "page" : undefined} data-nav-key={item.key}
      onClick={(event) => { event.stopPropagation(); onSelect(item); }}>
      <Icon className="h-4 w-4" /><span>{item.label}</span>
      {item.badge !== undefined && <small>{item.badge}</small>}
    </button>
  );
}

function NavigationBranch({ item, items, onSelect }: {
  item: PortalNavDestination;
  items: PortalNavDestination[];
  onSelect: (item: PortalNavDestination) => void;
}) {
  const children = items.filter((candidate) => candidate.parentKey === item.key);
  const ref = useRef<HTMLDetailsElement>(null);
  const activeKeys = items.filter((candidate) => candidate.active).map((candidate) => candidate.key).join("|");
  const containsActive = (node: PortalNavDestination): boolean =>
    !!node.active || items.filter((candidate) => candidate.parentKey === node.key).some(containsActive);
  const active = containsActive(item);
  useEffect(() => { if (active && ref.current) ref.current.open = true; }, [active, activeKeys]);
  if (!children.length) return <NavigationLeaf item={item} onSelect={onSelect} />;
  return (
    <details ref={ref} className="bfo-nav-tree-branch" data-active={active} open={active || undefined}>
      <summary aria-label={`${item.label} submenu`}>
        <NavigationLeaf item={item} onSelect={onSelect} /><ChevronDown className="bfo-nav-chevron" aria-hidden="true" />
      </summary>
      <div className="bfo-nav-tree-children">
        {children.map((child) => <NavigationBranch key={child.key} item={child} items={items} onSelect={onSelect} />)}
      </div>
    </details>
  );
}

function NavigationGroup({ label, roots, items, onSelect }: {
  label: string; roots: PortalNavDestination[]; items: PortalNavDestination[];
  onSelect: (item: PortalNavDestination) => void;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  const activeKeys = items.filter((item) => item.active).map((item) => item.key).join("|");
  useEffect(() => {
    if (items.some((item) => item.active && (item.group || "Workspace") === label) && ref.current) ref.current.open = true;
  }, [activeKeys, label]);
  return (
    <details ref={ref} className="bfo-nav-tree-group" open>
      <summary>{label}<ChevronDown className="bfo-nav-chevron" aria-hidden="true" /></summary>
      <div className="bfo-nav-tree-group__items">
        {roots.map((item) => <NavigationBranch key={item.key} item={item} items={items} onSelect={onSelect} />)}
      </div>
    </details>
  );
}

export function PortalNavigationTree({ items, onSelect }: {
  items: PortalNavDestination[]; onSelect: (item: PortalNavDestination) => void;
}) {
  // Parent links refer only to destinations already authorized for this role.
  const keys = new Set(items.map((item) => item.key));
  const roots = items.filter((item) => !item.parentKey || !keys.has(item.parentKey));
  const groups = [...new Set(roots.map((item) => item.group || "Workspace"))];
  return (
    <div className="bfo-more-grid bfo-nav-tree">
      {groups.map((group) => <NavigationGroup key={group} label={group} items={items}
        roots={roots.filter((item) => (item.group || "Workspace") === group)} onSelect={onSelect} />)}
    </div>
  );
}

/** Keep the parent page link separate from its submenu disclosure. */
export function PortalSidebarBranch({ label, active, activeKey, trigger, children }: {
  label: string; active: boolean; activeKey: string; trigger: ReactNode; children: ReactNode;
}) {
  const expandedSidebar = usePortalSidebarExpanded();
  const [open, setOpen] = useState(active);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const childrenId = useId();
  useEffect(() => { if (active) setOpen(true); setPopoverOpen(false); }, [active, activeKey]);
  const arrowLabel = `${open ? "Collapse" : "Expand"} ${label} submenu`;
  return (
    <div className="bfo-sidebar-branch" data-active={active}>
      <div className="bfo-sidebar-branch__heading">
        {trigger}
        {expandedSidebar ? (
          <button type="button" className="bfo-branch-toggle" aria-label={arrowLabel}
            title={arrowLabel} aria-expanded={open} aria-controls={childrenId} onClick={() => setOpen((value) => !value)}>
            {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          </button>
        ) : (
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <button type="button" className="bfo-branch-toggle" aria-label={`Open ${label} submenu`}
                title={`Open ${label} submenu`} aria-expanded={popoverOpen}><ChevronRight size={14} /></button>
            </PopoverTrigger>
            <PopoverContent side="right" align="start" sideOffset={9} className="bfo-submenu-popover">
              <h3>{label}</h3>
              <div onClick={(event) => {
                if ((event.target as HTMLElement).closest("button")) setPopoverOpen(false);
              }}>{children}</div>
            </PopoverContent>
          </Popover>
        )}
      </div>
      {expandedSidebar && <div id={childrenId} className="bfo-sidebar-branch__children" hidden={!open}>{children}</div>}
    </div>
  );
}

/** Native group toggles predate the shared tree. Reveal the active page's ancestors. */
export function revealActiveSidebar(items: PortalNavDestination[], root: HTMLElement) {
  const active = items.find((item) => item.active);
  if (!active) return;
  const parent = items.find((item) => item.key === active.parentKey);
  const buttons = [...root.querySelectorAll<HTMLElement>(".bfo-workspace-rail nav button")];
  const target = buttons.find((button) => button.textContent?.trim() === active.label)
    || buttons.find((button) => button.textContent?.trim() === parent?.label);
  if (!target) return;
  for (let node: HTMLElement | null = target; node && node !== root; node = node.parentElement) {
    if (node instanceof HTMLDetailsElement) node.open = true;
    if (node.hidden) {
      node.hidden = false;
      const toggle = node.previousElementSibling;
      if (toggle?.matches("button[aria-expanded]")) {
        toggle.setAttribute("aria-expanded", "true");
        toggle.querySelector("svg")?.classList.remove("-rotate-90");
      }
    }
  }
}
