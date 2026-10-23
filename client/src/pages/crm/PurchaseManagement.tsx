import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import RoleBasedRoute from "@/components/RoleBasedRoute";
import Header from "@/components/Header";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, ArrowDownToLine, ClipboardList, FileText, Plus, RefreshCw, Search, ShieldCheck, ShoppingCart, Truck, Users } from "lucide-react";
import { PurchaseVendors, PurchaseRequisitions, PurchaseOrders, PurchaseFulfillment, type Product, type Vendor, type Requisition } from "@/components/purchase/PurchaseWorkspace";

export default function PurchaseManagement() {
  const { user } = useAuth();
  const [tab, setTab] = useState("fulfillment");
  const role = (user as any)?.role || "";
  const canPurchase = ["admin", "super_admin", "purchase_manager", "purchase_executive"].includes(role);
  const canSync = ["admin", "super_admin", "purchase_manager"].includes(role);
  const { data: overview, isLoading, isError, refetch } = useQuery<any>({ queryKey: ["/api/purchase/overview"] });
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/purchase/overview"] });
    ["/api/purchase/vendors", "/api/purchase/requisitions", "/api/purchase/fulfillment", "/api/purchase-orders"].forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
  };
  const sync = useMutation({
    mutationFn: async () => (await apiRequest("/api/purchase/fulfillment/sync-confirmed", { method: "POST", body: "{}" })).json(),
    onSuccess: (result: any) => { refresh(); window.alert(`Synchronized ${result.salesOrdersChecked} confirmed Sales Orders; ${result.requirementsCreatedOrUpdated} requirements updated.`); },
  });
  return <RoleBasedRoute allowedRoles={["super_admin", "admin", "purchase_manager", "purchase_executive"]}>
    <div className="min-h-[100dvh] bg-background"><Header />
      <main className="mx-auto max-w-[1440px] px-4 py-6 md:px-8">
        <div className="mb-6 flex flex-col justify-between gap-4 border-b border-border pb-5 md:flex-row md:items-end">
          <div><p className="mb-2 text-xs font-semibold uppercase tracking-[.19em] text-primary">Atlas Ingredients · Operations</p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Purchase management</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Trace every sourcing decision to its Sales Order. Supplier eligibility is product- and scope-specific.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
            {canSync && <Button size="sm" disabled={sync.isPending} onClick={() => sync.mutate()}><RefreshCw className={`mr-2 h-4 w-4 ${sync.isPending ? "animate-spin" : ""}`} />{sync.isPending ? "Syncing…" : "Sync confirmed SOs"}</Button>}
          </div>
        </div>
        {sync.isError && <Notice error message={(sync.error as Error).message} />}
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
          {[
            ["Purchase orders", overview?.purchaseOrders, ShoppingCart],
            ["Draft orders", overview?.draftPurchaseOrders, FileText],
            ["Active suppliers", overview?.activeVendors, Users],
            ["Awaiting review", overview?.vendorsAwaitingApproval, ShieldCheck],
            ["Open requisitions", overview?.openRequisitions, ClipboardList],
          ].map(([label, value, Icon]: any) => <div key={label} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between text-muted-foreground"><span className="text-xs">{label}</span><Icon className="h-4 w-4" /></div>
            <div className="mt-2 font-mono text-2xl font-semibold">{isLoading ? "—" : value ?? "—"}</div>
          </div>)}
        </div>
        {overview?.purchaseApprovalMatrixConfigured === false && <div className="mb-5 flex gap-3 rounded-md border border-amber-300/70 bg-amber-50/70 px-4 py-3 text-sm text-amber-950">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><p><strong>Draft-only control.</strong> No PO approval matrix is configured. New purchase orders remain Draft; issue, GRN, payment and receipt controls are intentionally unavailable.</p>
        </div>}
        {isError && <Notice error message="Purchase overview could not be loaded." retry={() => refetch()} />}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-5 flex h-auto w-full justify-start overflow-x-auto rounded-lg bg-muted/70 p-1">
            <TabsTrigger value="fulfillment">SO fulfillment</TabsTrigger><TabsTrigger value="requisitions">Requisitions & offers</TabsTrigger>
            <TabsTrigger value="orders">Purchase orders</TabsTrigger><TabsTrigger value="vendors">Suppliers</TabsTrigger>
          </TabsList>
          <TabsContent value="fulfillment"><PurchaseFulfillment canPurchase={canPurchase} canSync={canSync} onChanged={refresh} /></TabsContent>
          <TabsContent value="requisitions"><PurchaseRequisitions role={role} onChanged={refresh} /></TabsContent>
          <TabsContent value="orders"><PurchaseOrders role={role} onChanged={refresh} /></TabsContent>
          <TabsContent value="vendors"><PurchaseVendors role={role} onChanged={refresh} /></TabsContent>
        </Tabs>
        <p className="mt-8 border-t border-border pt-4 text-xs text-muted-foreground">Customer identities are not shown in Purchase Management. Coordinate only by Sales Order number.</p>
      </main>
    </div>
  </RoleBasedRoute>;
}

function Notice({ message, error, retry }: { message: string; error?: boolean; retry?: () => void }) {
  return <div role={error ? "alert" : undefined} className={`mb-4 rounded-md border px-4 py-3 text-sm ${error ? "border-destructive/40 bg-destructive/5 text-destructive" : "border-border bg-muted/50"}`}>
    <div className="flex items-center justify-between gap-3"><span>{message}</span>{retry && <Button variant="outline" size="sm" onClick={retry}>Retry</Button>}</div>
  </div>;
}
