import { ClipboardList, Factory, PackageCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const setupAreas = [
  {
    title: "Product recipes & BOMs",
    description: "Define the ingredients and packaging needed to make each finished product.",
    icon: ClipboardList,
  },
  {
    title: "Yield & production units",
    description: "Set expected output and approved yield assumptions before materials are reserved.",
    icon: Factory,
  },
  {
    title: "Batch traceability & release",
    description: "Track material lots, quality checks, and the release of finished batches.",
    icon: PackageCheck,
  },
];

export default function ProductionManagement() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Plan internal processing runs and trace finished-product batches.
      </p>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <Factory className="h-5 w-5 text-primary" aria-hidden="true" />
            <CardTitle>Production setup is not complete</CardTitle>
            <Badge variant="outline">Setup required</Badge>
          </div>
          <CardDescription>
            Production plans and batches are not generated from this page yet. Configure and approve these
            operating rules before production can affect stock.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {setupAreas.map(({ title, description, icon: Icon }) => (
              <div key={title} className="rounded-lg border border-border bg-muted/30 p-4">
                <Icon className="mb-3 h-5 w-5 text-muted-foreground" aria-hidden="true" />
                <h3 className="text-sm font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 border-t border-border pt-4 text-sm text-muted-foreground">
            Until these rules are approved, Purchase Management will continue to flag raw-material demand for
            manual review. This page will not create production or inventory records.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
