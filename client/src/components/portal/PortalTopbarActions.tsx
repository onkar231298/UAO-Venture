import { useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import { Search, Plus, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ActionRole = "admin" | "super_admin" | "sales" | "quality" | "staff" | "customer";

export function PortalTopbarActions({ role, className = "" }: { role: string; className?: string }) {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const normalizedRole: ActionRole = role === "admin" || role === "super_admin"
    ? role
    : role === "customer"
      ? "customer"
      : role.startsWith("sales")
        ? "sales"
        : role.startsWith("quality")
          ? "quality"
          : "staff";

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const term = search.trim();
    if (!term) return;
    const query = encodeURIComponent(term);
    try {
      window.sessionStorage.setItem("bfo-portal-search", term);
    } catch {
      // The route query remains the source of truth if session storage is unavailable.
    }
    if (normalizedRole === "admin" || normalizedRole === "super_admin") {
      setLocation(`/admin/dashboard/crm/companies?search=${query}`);
    } else if (normalizedRole === "sales") {
      setLocation(`/sales/my-companies?search=${query}`);
    } else if (normalizedRole === "customer") {
      setLocation(`/customer/search?search=${query}`);
    }
  };

  const createActions = normalizedRole === "admin" || normalizedRole === "super_admin"
    ? [{ label: "Add company", description: "Create a company record", href: "/admin/dashboard/crm/companies?create=company" }]
    : normalizedRole === "sales"
      ? [
          { label: "Create sample request", description: "Open the existing sample request form", href: "/sales/sample-requests?create=sample" },
          { label: "New quality request", description: "Open the quality request workflow", href: "/sales/quality-requests?create=quality" },
        ]
      : normalizedRole === "quality"
        ? [
            { label: "New document request", description: "Create a quality document request", href: "/quality/dashboard?section=document-requests&create=document" },
            { label: "New testing record", description: "Choose a field record type", href: "/quality/dashboard?section=field-quality-records&create=record" },
            { label: "Create NCR", description: "Create a non-conformance report", href: "/quality/dashboard?section=ncrs&create=ncr" },
          ]
        : normalizedRole === "staff"
          ? [{ label: "Attendance & leave", description: "Open attendance and leave actions", href: "/staff?section=my-attendance" }]
          : [{ label: "Start an inquiry", description: "Browse products and submit an inquiry", href: "/customer/products" }];

  const canSearch = normalizedRole === "admin" || normalizedRole === "super_admin" ||
    normalizedRole === "sales" || normalizedRole === "customer";

  return (
    <div className={`bfo-topbar-actions ${className}`}>
      {canSearch && (
        <form className="bfo-global-search" role="search" onSubmit={handleSearch}>
          <Search aria-hidden="true" size={16} />
          <Input
            aria-label={normalizedRole === "customer" ? "Search products" : "Search companies and contacts"}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={normalizedRole === "customer" ? "Find products" : "Find companies or contacts"}
          />
          <kbd>Enter</kbd>
        </form>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="bfo-create-trigger">
            <Plus aria-hidden="true" size={16} />
            <span>Create</span>
            <ChevronDown aria-hidden="true" size={14} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel>Quick actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {createActions.map((action) => (
            <DropdownMenuItem
              key={action.href}
              onSelect={() => window.location.assign(action.href)}
              className="items-start py-2.5"
            >
              <span className="grid gap-0.5">
                <span className="font-medium">{action.label}</span>
                <span className="text-xs text-muted-foreground">{action.description}</span>
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
