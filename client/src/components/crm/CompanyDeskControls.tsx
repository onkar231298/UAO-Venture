import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CompanyDeskControls({ companies, companyId, visible, onSelect, onToggle }: {
  companies: { id: number; companyName: string }[];
  companyId?: number;
  visible: boolean;
  onSelect: (id: number) => void;
  onToggle: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2 text-sm">
      {visible && <label className="flex min-w-0 items-center gap-2">
        <span className="text-muted-foreground whitespace-nowrap">Preview company</span>
        <select aria-label="Preview company" data-testid="select-preview-company"
          className="h-8 max-w-[260px] min-w-0 rounded-md border bg-background px-2 text-sm"
          value={companyId ?? ""} onChange={(event) => onSelect(Number(event.target.value))}>
          {!companyId && <option value="">Choose a company</option>}
          {companies.map((company) => <option value={company.id} key={company.id}>{company.companyName}</option>)}
        </select>
      </label>}
      <Button type="button" variant="outline" size="sm" className="crm-company-workspace__desk-toggle"
        onClick={onToggle} aria-expanded={visible} data-testid="button-toggle-company-desk">
        {visible ? <PanelRightClose className="h-4 w-4 mr-1" /> : <PanelRightOpen className="h-4 w-4 mr-1" />}
        {visible ? "Hide people desk" : "Show people desk"}
      </Button>
    </div>
  );
}
