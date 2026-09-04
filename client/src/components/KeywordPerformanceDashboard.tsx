import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ExternalLink, Plus, Upload, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { GlobalSeoSettings } from "@shared/schema";
import SeoGrowthActionCenter from "@/components/SeoGrowthActionCenter";

type Metrics = { clicks: number; impressions: number; ctr: number; position: number; conversions: number };
type Target = Metrics & { keyword: string; previous: Metrics; recommendation: "keep" | "improve" | "replace" | "monitor"; reason: string; suggestedReplacement?: string | null };
type Period = { start: string; end: string; days: number };
type DashboardData = { period: Period | null; previousPeriod: Period | null; current: Metrics; previous: Metrics; targets: Target[]; topQueries: (Metrics & { query: string })[] };
type KeywordReview = {
  id: number;
  keyword: string;
  replacement?: string | null;
  recommendation: "keep" | "improve" | "replace";
  reason: string;
  status: "proposed" | "approved" | "rejected";
  reviewedAt?: string | null;
  createdAt: string;
};

const parseCsv = (text: string) => {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
  const parseLine = (line: string) => {
    const values: string[] = []; let value = ""; let quoted = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"' && line[i + 1] === '"') { value += '"'; i++; }
      else if (line[i] === '"') quoted = !quoted;
      else if (line[i] === "," && !quoted) { values.push(value.trim()); value = ""; }
      else value += line[i];
    }
    values.push(value.trim()); return values;
  };
  const headers = parseLine(lines.shift() || "").map((header) => header.toLowerCase());
  const index = (...names: string[]) => headers.findIndex((header) => names.includes(header));
  const number = (row: string[], names: string[]) => {
    const raw = row[index(...names)] || "0";
    const value = Number(raw.replace(/[% ,]/g, ""));
    return raw.includes("%") ? value / 100 : value;
  };
  const string = (row: string[], names: string[]) => row[index(...names)] || "";
  if (index("query", "top queries") < 0 || index("clicks") < 0 || index("impressions") < 0) throw new Error("CSV must include Query (or Top queries), Clicks, and Impressions columns.");
  return lines.map(parseLine).filter((row) => string(row, ["query", "top queries"])).map((row) => ({
    query: string(row, ["query", "top queries"]), page: string(row, ["page", "top pages"]) || null,
    clicks: Math.round(number(row, ["clicks"])), impressions: Math.round(number(row, ["impressions"])),
    ctr: number(row, ["ctr"]), position: number(row, ["position"]),
    conversions: Math.round(number(row, ["conversions"])),
  }));
};

const metricText = (name: keyof Metrics, value: number) =>
  name === "ctr" ? `${(value * 100).toFixed(2)}%` : name === "position" ? value ? value.toFixed(1) : "—" : value.toLocaleString();

export default function KeywordPerformanceDashboard() {
  const [days, setDays] = useState(28);
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery<DashboardData>({ queryKey: ["/api/admin/seo/keyword-performance", { days }] });
  const { data: reviews = [] } = useQuery<KeywordReview[]>({ queryKey: ["/api/admin/seo/keyword-reviews"] });
  const { data: seoSettings } = useQuery<GlobalSeoSettings>({ queryKey: ["/api/admin/seo/settings"] });
  const primaryKeywords = (seoSettings?.primaryKeywords || "").split(",").map(keyword => keyword.trim()).filter(Boolean);
  const importMutation = useMutation({
    mutationFn: () => apiRequest("/api/admin/seo/keyword-performance/import", { method: "POST", body: JSON.stringify({ periodStart, periodEnd, rows }) }),
    onSuccess: () => { toast({ title: `Imported ${rows.length} Search Console rows` }); setRows([]); queryClient.invalidateQueries({ queryKey: ["/api/admin/seo/keyword-performance"] }); },
    onError: (error: Error) => toast({ title: "Import failed", description: error.message, variant: "destructive" }),
  });
  const reviewMutation = useMutation({
    mutationFn: ({ target, decision }: { target: Target; decision: "keep" | "improve" | "replace" }) => apiRequest("/api/admin/seo/keyword-reviews", { method: "POST", body: JSON.stringify({ keyword: target.keyword, replacement: decision === "replace" ? target.suggestedReplacement : null, recommendation: decision, reason: target.reason, status: "approved", metrics: target }) }),
    onSuccess: (_created, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/seo/keyword-reviews"] });
      toast({
        title: `${variables.decision[0].toUpperCase()}${variables.decision.slice(1)} decision saved`,
        description: variables.decision === "replace"
          ? `Replacement approved: ${variables.target.suggestedReplacement}`
          : "The selected review decision is now recorded.",
      });
    },
    onError: (error: Error) => toast({ title: "Could not record review", description: error.message, variant: "destructive" }),
  });
  const keywordMutation = useMutation({
    mutationFn: (keywords: string[]) => {
      if (!seoSettings) throw new Error("SEO settings are still loading.");
      return apiRequest("/api/admin/seo/settings", {
        method: "PUT",
        body: JSON.stringify({ ...seoSettings, primaryKeywords: keywords.join(", ") }),
      });
    },
    onSuccess: () => {
      setNewKeyword("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/seo/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/seo/keyword-performance"] });
      toast({ title: "Target keywords updated" });
    },
    onError: (error: Error) => toast({ title: "Could not update keywords", description: error.message, variant: "destructive" }),
  });
  const addKeyword = () => {
    const keyword = newKeyword.trim().replace(/\s+/g, " ");
    if (!keyword) return;
    if (keyword.includes(",")) {
      toast({ title: "Add one keyword at a time", description: "Do not include commas.", variant: "destructive" });
      return;
    }
    if (primaryKeywords.some(existing => existing.toLowerCase() === keyword.toLowerCase())) {
      toast({ title: "Keyword already exists", variant: "destructive" });
      return;
    }
    keywordMutation.mutate([...primaryKeywords, keyword]);
  };
  const removeKeyword = (keyword: string) => keywordMutation.mutate(primaryKeywords.filter(existing => existing !== keyword));
  const uploadFile = async (file?: File) => {
    if (!file) return;
    try { const parsed = parseCsv(await file.text()); if (!parsed.length || parsed.length > 5000) throw new Error("CSV must contain between 1 and 5,000 data rows."); setRows(parsed); toast({ title: `${parsed.length} rows ready`, description: "Choose the period and explicitly import them." }); }
    catch (error: any) { setRows([]); toast({ title: "CSV could not be read", description: error.message, variant: "destructive" }); }
  };
  const stats: { key: keyof Metrics; label: string }[] = [{ key: "clicks", label: "Clicks" }, { key: "impressions", label: "Impressions" }, { key: "ctr", label: "CTR" }, { key: "position", label: "Avg. position" }, { key: "conversions", label: "Conversions" }];
  const latestReviewByKeyword = new Map<string, KeywordReview>();
  reviews.forEach((review) => {
    const key = review.keyword.trim().toLowerCase();
    if (!latestReviewByKeyword.has(key)) latestReviewByKeyword.set(key, review);
  });
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-semibold">Keyword performance</h2><p className="text-sm text-muted-foreground">Imported Google Search Console snapshots; recommendations require human review.</p>{data?.period ? <p className="mt-1 text-xs text-muted-foreground">Current: {data.period.start} to {data.period.end}{data.previousPeriod ? ` · Previous: ${data.previousPeriod.start} to ${data.previousPeriod.end}` : ""}</p> : null}</div><div className="flex gap-2">{[28, 90].map(value => <Button key={value} variant={days === value ? "default" : "outline"} onClick={() => setDays(value)}>{value} days</Button>)}</div></div>
    <div className="grid grid-cols-1 gap-3 md:grid-cols-5">{stats.map(({ key, label }) => { const current = data?.current[key] || 0, previous = data?.previous[key] || 0; const delta = previous ? ((current - previous) / previous) * 100 : 0; return <Card key={key}><CardContent className="p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="text-2xl font-bold">{metricText(key, current)}</p><p className="text-xs text-muted-foreground">{previous ? `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}% vs prior` : "No prior comparison"}</p></CardContent></Card>; })}</div>
    <SeoGrowthActionCenter />
    <Card><CardHeader><CardTitle>Target keywords</CardTitle><CardDescription>Add the search terms you want this dashboard to monitor. Removing a keyword stops future monitoring but does not delete imported Search Console data.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="flex max-w-xl gap-2"><Input value={newKeyword} onChange={event => setNewKeyword(event.target.value)} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); addKeyword(); } }} placeholder="e.g. organic herbal ingredients supplier" maxLength={500} /><Button onClick={addKeyword} disabled={!newKeyword.trim() || keywordMutation.isPending || !seoSettings}><Plus className="mr-1 h-4 w-4" />Add keyword</Button></div><div className="flex flex-wrap gap-2">{primaryKeywords.length ? primaryKeywords.map(keyword => <Badge key={keyword} variant="secondary" className="gap-1 py-1.5 pl-3 pr-1 text-sm">{keyword}<button type="button" className="rounded-sm p-0.5 hover:bg-muted-foreground/20" aria-label={`Remove ${keyword}`} disabled={keywordMutation.isPending} onClick={() => removeKeyword(keyword)}><X className="h-3.5 w-3.5" /></button></Badge>) : <p className="text-sm text-muted-foreground">No target keywords added yet.</p>}</div></CardContent></Card>
    <Card><CardHeader><CardTitle>Target keyword recommendations</CardTitle><CardDescription>Choose a decision for each keyword. The selected button remains highlighted as the latest recorded review; approved replacements are not applied to global settings automatically.</CardDescription></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Keyword</TableHead><TableHead>Clicks / impressions</TableHead><TableHead>CTR / position</TableHead><TableHead>Recommendation</TableHead><TableHead>Reason</TableHead><TableHead>Human decision</TableHead></TableRow></TableHeader><TableBody>{isLoading ? <TableRow><TableCell colSpan={6}>Loading performance…</TableCell></TableRow> : data?.targets.length ? data.targets.map(target => {
      const latestReview = latestReviewByKeyword.get(target.keyword.trim().toLowerCase());
      return <TableRow key={target.keyword}><TableCell className="font-medium">{target.keyword}</TableCell><TableCell>{target.clicks} / {target.impressions}</TableCell><TableCell>{metricText("ctr", target.ctr)} / {metricText("position", target.position)}</TableCell><TableCell><Badge variant={target.recommendation === "replace" ? "destructive" : "secondary"}>{target.recommendation}</Badge></TableCell><TableCell className="max-w-xs text-sm">{target.reason}{target.suggestedReplacement ? <span className="mt-1 block font-medium">Suggested: {target.suggestedReplacement}</span> : null}</TableCell><TableCell><div className="flex gap-1">{(["keep", "improve", "replace"] as const).map(decision => {
        const selected = latestReview?.recommendation === decision;
        return <Button key={decision} size="sm" variant={selected ? "default" : "outline"} disabled={reviewMutation.isPending || (decision === "replace" && !target.suggestedReplacement)} onClick={() => reviewMutation.mutate({ target, decision })}>{selected ? <Check className="mr-1 h-3.5 w-3.5" /> : null}{decision}</Button>;
      })}</div>{latestReview ? <p className="mt-1 text-xs text-muted-foreground">Latest decision saved{latestReview.replacement ? `: ${latestReview.replacement}` : ""}</p> : null}</TableCell></TableRow>;
    }) : <TableRow><TableCell colSpan={6}>No global target keywords are configured yet.</TableCell></TableRow>}</TableBody></Table></CardContent></Card>
    <Card><CardHeader><CardTitle>Top actual search queries</CardTitle><CardDescription>Queries from the selected current period, ranked by clicks.</CardDescription></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Query</TableHead><TableHead>Clicks</TableHead><TableHead>Impressions</TableHead><TableHead>CTR</TableHead><TableHead>Position</TableHead><TableHead>Conversions</TableHead></TableRow></TableHeader><TableBody>{data?.topQueries.length ? data.topQueries.map(query => <TableRow key={query.query}><TableCell>{query.query}</TableCell><TableCell>{query.clicks}</TableCell><TableCell>{query.impressions}</TableCell><TableCell>{metricText("ctr", query.ctr)}</TableCell><TableCell>{metricText("position", query.position)}</TableCell><TableCell>{query.conversions}</TableCell></TableRow>) : <TableRow><TableCell colSpan={6}>No imported query data for this period.</TableCell></TableRow>}</TableBody></Table></CardContent></Card>
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" />Import Search Console CSV</CardTitle><CardDescription>Supports Query/Top queries, Clicks, Impressions, CTR, Position, Page/Top pages, and Conversions. Percentages are parsed as percentages.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="grid gap-4 md:grid-cols-3"><div><Label>Period start</Label><Input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} /></div><div><Label>Period end</Label><Input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} /></div><div><Label>CSV file</Label><Input type="file" accept=".csv,text/csv" onChange={e => uploadFile(e.target.files?.[0])} /></div></div><div className="flex flex-wrap items-center gap-3"><Button disabled={!periodStart || !periodEnd || !rows.length || importMutation.isPending} onClick={() => importMutation.mutate()}>{importMutation.isPending ? "Importing…" : `Import ${rows.length || ""} rows`}</Button><a className="inline-flex items-center text-sm text-primary underline" href="https://search.google.com/search-console" target="_blank" rel="noreferrer">Open Google Search Console <ExternalLink className="ml-1 h-3 w-3" /></a></div></CardContent></Card>
  </div>;
}