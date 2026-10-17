import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, ExternalLink, Link2, RefreshCw, Search, Target } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Metrics = { clicks: number; impressions: number; ctr: number; position: number };
type SeoPage = { id: string; type: "static" | "product" | "category" | "health_support" | "blog"; url: string; title: string };
type MappingRow = {
  keyword: string;
  mapping: { id: number; pageUrl: string; pageType: SeoPage["type"]; pageId?: string | null } | null;
  mappedPageExists: boolean;
  competingPages: string[];
  warning: string | null;
  metrics: Metrics;
};
type Opportunity = {
  fingerprint: string;
  category: "metadata" | "content" | "indexing" | "image" | "internal_link";
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  recommendation: string;
  sourceUrl: string;
  targetUrl?: string | null;
  evidence: Record<string, any>;
  evidenceToken: string;
  status: "open" | "in_progress" | "completed" | "dismissed";
  notes: string;
  reviewedAt?: string | null;
  history?: { id: number; status: Opportunity["status"]; notes?: string | null; createdAt: string }[];
  baselineComparison?: Record<string, number> | null;
};
type GrowthData = {
  generatedAt: string;
  period: { periodStart: string; periodEnd: string } | null;
  summary: {
    total: number;
    bySeverity: Record<string, number>;
    byStatus: Record<string, number>;
    byCategory: Record<string, number>;
  };
  pages: SeoPage[];
  keywordMappings: MappingRow[];
  opportunities: Opportunity[];
};
type KeywordReview = {
  id: number;
  keyword: string;
  replacement?: string | null;
  recommendation: "keep" | "improve" | "replace";
  status: "proposed" | "approved" | "rejected" | "applied";
  createdAt: string;
};
type CrawlerAudit = {
  generatedAt: string;
  environment: "development" | "production";
  sitemapUrlCount: number;
  totalEligiblePageCount: number;
  nextCursor: number;
  complete: boolean;
  sitemapReadComplete: boolean;
  snapshotHash: string;
  scannedPageCount: number;
  skippedPageCount: number;
  excludedPageCount: number;
  timeLimitReached: boolean;
  pages: { url: string; status: number; title: string; description: string; durationMs: number }[];
  findings: {
    fingerprint: string;
    category: string;
    severity: "critical" | "high" | "medium" | "low";
    title: string;
    description: string;
    recommendation: string;
    sourceUrl: string;
    targetUrl?: string;
  }[];
  performance: {
    environment: "development" | "production";
    requestCount: number;
    medianMs: number;
    p75Ms: number;
    slowPageCount: number;
    advisory: string;
  };
};

const statusLabel: Record<Opportunity["status"], string> = {
  open: "Open",
  in_progress: "In progress",
  completed: "Completed",
  dismissed: "Dismissed",
};
const categoryLabel: Record<Opportunity["category"], string> = {
  metadata: "Metadata",
  content: "Content",
  indexing: "Indexing",
  image: "Image",
  internal_link: "Internal link",
};
const severityClass: Record<Opportunity["severity"], string> = {
  critical: "bg-red-600 text-white",
  high: "bg-orange-100 text-orange-900",
  medium: "bg-amber-100 text-amber-900",
  low: "bg-blue-100 text-blue-900",
};
const shortUrl = (url: string) => url.replace("https://bright-organic.com", "") || "/";

function mergeCrawlerBatch(previous: CrawlerAudit | null, batch: CrawlerAudit, offset: number): CrawlerAudit {
  const pagesByUrl = new Map<string, CrawlerAudit["pages"][number]>();
  if (offset > 0) (previous?.pages || []).forEach(page => pagesByUrl.set(page.url, page));
  batch.pages.forEach(page => pagesByUrl.set(page.url, page));
  const pages = Array.from(pagesByUrl.values());
  const existingFindings = [
    ...(offset > 0 ? previous?.findings || [] : []),
    ...batch.findings,
  ].filter(item => item.title !== "Duplicate rendered page title" && item.title !== "Duplicate rendered meta description");
  const findingsByFingerprint = new Map(existingFindings.map(item => [item.fingerprint, item]));

  const addDuplicates = (field: "title" | "description") => {
    const groups = new Map<string, CrawlerAudit["pages"]>();
    pages.forEach(page => {
      const value = page[field].trim().toLowerCase();
      if (!value) return;
      const group = groups.get(value) || [];
      group.push(page);
      groups.set(value, group);
    });
    groups.forEach(group => {
      if (group.length < 2) return;
      group.forEach(page => findingsByFingerprint.set(`full-crawl:${field}:${page.url}`, {
        fingerprint: `full-crawl:${field}:${page.url}`,
        category: "metadata",
        severity: field === "title" ? "high" : "medium",
        title: field === "title" ? "Duplicate rendered page title" : "Duplicate rendered meta description",
        description: `${group.length} crawled pages share the same ${field}.`,
        recommendation: `Write a unique, page-specific ${field}. Review the page intent and copy first; length is secondary.`,
        sourceUrl: page.url,
      }));
    });
  };
  addDuplicates("title");
  addDuplicates("description");

  const successfulDurations = pages.filter(page => page.status >= 200 && page.status < 400).map(page => page.durationMs).sort((a, b) => a - b);
  const percentile = (ratio: number) => successfulDurations.length
    ? successfulDurations[Math.min(successfulDurations.length - 1, Math.ceil(successfulDurations.length * ratio) - 1)]
    : 0;

  return {
    ...batch,
    pages,
    scannedPageCount: pages.length,
    excludedPageCount: offset > 0 ? previous?.excludedPageCount || 0 : batch.excludedPageCount,
    timeLimitReached: Boolean(previous?.timeLimitReached || batch.timeLimitReached),
    findings: Array.from(findingsByFingerprint.values()).sort((a, b) => {
      const severityWeight = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityWeight[a.severity] - severityWeight[b.severity] || a.sourceUrl.localeCompare(b.sourceUrl);
    }),
    performance: {
      ...batch.performance,
      requestCount: successfulDurations.length,
      medianMs: percentile(0.5),
      p75Ms: percentile(0.75),
      slowPageCount: successfulDurations.filter(duration => duration > 3_000).length,
    },
  };
}

export default function SeoGrowthActionCenter() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("active");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [opportunitySearch, setOpportunitySearch] = useState("");
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [opportunityStatus, setOpportunityStatus] = useState<Opportunity["status"]>("open");
  const [opportunityNotes, setOpportunityNotes] = useState("");
  const [mappingRow, setMappingRow] = useState<MappingRow | null>(null);
  const [pageSearch, setPageSearch] = useState("");
  const [selectedPage, setSelectedPage] = useState<SeoPage | null>(null);
  const [replacementReview, setReplacementReview] = useState<KeywordReview | null>(null);
  const [crawlerReport, setCrawlerReport] = useState<CrawlerAudit | null>(null);
  const [crawlerPauseRequested, setCrawlerPauseRequested] = useState(false);
  const crawlerReportRef = useRef<CrawlerAudit | null>(null);
  const crawlerPauseRequestedRef = useRef(false);

  const { data, isLoading, error } = useQuery<GrowthData>({ queryKey: ["/api/admin/seo/growth-opportunities"] });
  const { data: reviews = [] } = useQuery<KeywordReview[]>({ queryKey: ["/api/admin/seo/keyword-reviews"] });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/seo/growth-opportunities"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/seo/keyword-performance"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/seo/keyword-reviews"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/seo/settings"] });
  };
  const statusMutation = useMutation({
    mutationFn: ({ opportunity, status, notes }: { opportunity: Opportunity; status: Opportunity["status"]; notes: string }) =>
      apiRequest(`/api/admin/seo/opportunities/${opportunity.fingerprint}`, {
        method: "PATCH",
        body: JSON.stringify({ status, notes: notes || null, evidence: opportunity.evidence, evidenceToken: opportunity.evidenceToken }),
      }),
    onSuccess: () => {
      refresh();
      setSelectedOpportunity(null);
      toast({ title: "SEO opportunity updated" });
    },
    onError: (mutationError: Error) => toast({ title: "Could not update opportunity", description: mutationError.message, variant: "destructive" }),
  });
  const mappingMutation = useMutation({
    mutationFn: ({ keyword, page }: { keyword: string; page: SeoPage }) =>
      apiRequest("/api/admin/seo/keyword-page-mappings", {
        method: "PUT",
        body: JSON.stringify({ keyword, pageUrl: page.url, pageType: page.type, pageId: page.id }),
      }),
    onSuccess: () => {
      refresh();
      setMappingRow(null);
      toast({ title: "Preferred page assigned" });
    },
    onError: (mutationError: Error) => toast({ title: "Could not assign page", description: mutationError.message, variant: "destructive" }),
  });
  const applyReplacementMutation = useMutation({
    mutationFn: (review: KeywordReview) => apiRequest(`/api/admin/seo/keyword-reviews/${review.id}/apply`, { method: "POST" }),
    onSuccess: () => {
      refresh();
      setReplacementReview(null);
      toast({ title: "Keyword replacement applied", description: "Primary Keywords and recommendations have been refreshed." });
    },
    onError: (mutationError: Error) => {
      setReplacementReview(null);
      toast({ title: "Could not apply replacement", description: mutationError.message, variant: "destructive" });
    },
  });
  const crawlerMutation = useMutation({
    mutationFn: async (startingOffset: number) => {
      let offset = startingOffset;
      let accumulated = startingOffset === 0 ? null : crawlerReportRef.current;
      crawlerPauseRequestedRef.current = false;
      setCrawlerPauseRequested(false);
      while (true) {
        const response = await apiRequest("/api/admin/seo/crawler-audit", {
          method: "POST",
          body: JSON.stringify({
            offset,
            ...(accumulated ? { snapshotHash: accumulated.snapshotHash } : {}),
          }),
        });
        const batch = await response.json() as CrawlerAudit;
        accumulated = mergeCrawlerBatch(accumulated, batch, offset);
        crawlerReportRef.current = accumulated;
        setCrawlerReport(accumulated);
        if (batch.complete || batch.nextCursor <= offset || crawlerPauseRequestedRef.current) return accumulated;
        offset = batch.nextCursor;
      }
    },
    onSuccess: report => {
      crawlerReportRef.current = report;
      setCrawlerReport(report);
      setCrawlerPauseRequested(false);
      crawlerPauseRequestedRef.current = false;
      toast(report.complete
        ? { title: "Full sitemap crawl complete", description: `Checked ${report.nextCursor.toLocaleString()} eligible sitemap URLs.` }
        : { title: "Crawl paused", description: `${report.skippedPageCount.toLocaleString()} sitemap URLs remain. Continue whenever you are ready.` });
    },
    onError: (mutationError: Error) => {
      setCrawlerPauseRequested(false);
      crawlerPauseRequestedRef.current = false;
      if (mutationError.message.includes("SITEMAP_CHANGED")) {
        crawlerReportRef.current = null;
        setCrawlerReport(null);
        toast({ title: "Sitemap changed during the crawl", description: "The partial report was cleared. Start a new full crawl for a consistent result.", variant: "destructive" });
        return;
      }
      toast({ title: "Crawler audit failed", description: mutationError.message, variant: "destructive" });
    },
  });

  const filteredOpportunities = useMemo(() => {
    const search = opportunitySearch.trim().toLowerCase();
    return (data?.opportunities || []).filter((opportunity) => {
      if (statusFilter === "active" && !["open", "in_progress"].includes(opportunity.status)) return false;
      if (statusFilter !== "all" && statusFilter !== "active" && opportunity.status !== statusFilter) return false;
      if (severityFilter !== "all" && opportunity.severity !== severityFilter) return false;
      if (categoryFilter !== "all" && opportunity.category !== categoryFilter) return false;
      return !search || `${opportunity.title} ${opportunity.description} ${opportunity.sourceUrl}`.toLowerCase().includes(search);
    });
  }, [data, statusFilter, severityFilter, categoryFilter, opportunitySearch]);
  const matchingPages = useMemo(() => {
    const search = pageSearch.trim().toLowerCase();
    return (data?.pages || []).filter((page) => !search || `${page.title} ${page.url} ${page.type}`.toLowerCase().includes(search)).slice(0, 50);
  }, [data, pageSearch]);
  const approvedReplacements = reviews.filter((review) => review.recommendation === "replace" && review.replacement && review.status === "approved");

  const editOpportunity = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity);
    setOpportunityStatus(opportunity.status);
    setOpportunityNotes(opportunity.notes || "");
  };
  const editMapping = (row: MappingRow) => {
    setMappingRow(row);
    setPageSearch("");
    setSelectedPage(row.mapping ? data?.pages.find((page) => page.url === row.mapping?.pageUrl) || null : null);
  };
  const startCrawlerAudit = () => {
    const existing = crawlerReportRef.current;
    const canContinue = Boolean(existing && !existing.complete && existing.skippedPageCount > 0);
    const offset = canContinue && existing ? existing.nextCursor : 0;
    if (offset === 0) {
      crawlerReportRef.current = null;
      setCrawlerReport(null);
    }
    crawlerPauseRequestedRef.current = false;
    setCrawlerPauseRequested(false);
    crawlerMutation.mutate(offset);
  };
  const pauseCrawlerAfterBatch = () => {
    crawlerPauseRequestedRef.current = true;
    setCrawlerPauseRequested(true);
  };

  if (isLoading) return <Card><CardContent className="py-10 text-center text-muted-foreground">Scanning indexable pages and Search Console evidence…</CardContent></Card>;
  if (error || !data) return <Card><CardContent className="py-10 text-center text-destructive">The SEO opportunity scan could not be loaded.</CardContent></Card>;

  return <div className="space-y-6">
    <div>
      <h2 className="text-xl font-semibold">SEO growth action center</h2>
      <p className="text-sm text-muted-foreground">Prioritized findings from current site content and imported Search Console evidence. Nothing is published automatically.</p>
    </div>

    <Card>
      <CardHeader className="flex flex-col items-start justify-between gap-4 sm:flex-row">
        <div>
          <CardTitle>Public HTML crawler audit</CardTitle>
          <CardDescription>Checks actual public HTML and same-site links, including sitemap, robots, canonical, headings, image alt attributes, and JSON-LD. Read-only; it does not change SEO settings or page content.</CardDescription>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button onClick={startCrawlerAudit} disabled={crawlerMutation.isPending}>
            <RefreshCw className={`mr-2 h-4 w-4 ${crawlerMutation.isPending ? "animate-spin" : ""}`} />
            {crawlerMutation.isPending ? "Crawling…" : crawlerReport && !crawlerReport.complete && crawlerReport.skippedPageCount > 0 ? "Continue full crawl" : crawlerReport && !crawlerReport.complete ? "Retry full crawl" : "Run full sitemap crawl"}
          </Button>
          {crawlerMutation.isPending ? <Button variant="outline" onClick={pauseCrawlerAfterBatch}>
            {crawlerPauseRequested ? "Pausing after this batch…" : "Pause after batch"}
          </Button> : null}
        </div>
      </CardHeader>
      {crawlerReport ? <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Sitemap URLs checked", value: `${crawlerReport.nextCursor.toLocaleString()} / ${crawlerReport.totalEligiblePageCount.toLocaleString()}` },
            { label: "Sitemap URLs", value: crawlerReport.sitemapUrlCount.toLocaleString() },
            { label: "Findings", value: crawlerReport.findings.length.toLocaleString() },
            { label: `${crawlerReport.performance.environment === "production" ? "Production" : "Development"} p75 response`, value: `${crawlerReport.performance.p75Ms.toLocaleString()} ms` },
          ].map(item => <div key={item.label} className="rounded-md border p-3"><p className="text-xs text-muted-foreground">{item.label}</p><p className="text-lg font-semibold">{item.value}</p></div>)}
        </div>
        <div>
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>{crawlerMutation.isPending ? "Full crawl in progress" : !crawlerReport.sitemapReadComplete ? "Sitemap coverage incomplete" : crawlerReport.complete ? "Full sitemap crawl complete" : "Crawl paused"}</span>
            <span>{crawlerReport.totalEligiblePageCount ? Math.round((crawlerReport.nextCursor / crawlerReport.totalEligiblePageCount) * 100) : 100}%</span>
          </div>
          <div role="progressbar" aria-label="Sitemap crawl progress" aria-valuemin={0} aria-valuemax={crawlerReport.totalEligiblePageCount} aria-valuenow={crawlerReport.nextCursor} className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary transition-all" style={{ width: `${crawlerReport.totalEligiblePageCount ? Math.min(100, (crawlerReport.nextCursor / crawlerReport.totalEligiblePageCount) * 100) : 100}%` }} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Latest batch completed {new Date(crawlerReport.generatedAt).toLocaleString()}. Median response {crawlerReport.performance.medianMs.toLocaleString()} ms across {crawlerReport.performance.requestCount} successful page responses. {crawlerReport.performance.advisory}
          {crawlerReport.skippedPageCount > 0 ? ` ${crawlerReport.skippedPageCount.toLocaleString()} eligible sitemap URLs remain; the crawl continues in separate batches.` : ""}
          {!crawlerReport.sitemapReadComplete ? " The sitemap was empty or one or more sitemap files could not be read, so full coverage is not confirmed." : ""}
          {crawlerReport.timeLimitReached ? " A batch reached its 90-second safety limit; the crawl resumes from its next unfinished URL." : ""}
          {crawlerReport.excludedPageCount > 0 ? ` ${crawlerReport.excludedPageCount.toLocaleString()} restricted, robots-blocked, or static URLs were excluded from fetching.` : ""}
        </p>
        {crawlerReport.findings.length ? <div className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
          {crawlerReport.findings.slice(0, 40).map(item => <div key={item.fingerprint} className="rounded-md border p-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={severityClass[item.severity]}>{item.severity}</Badge>
              <Badge variant="outline">{item.category.replaceAll("_", " ")}</Badge>
              <span className="font-medium">{item.title}</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
            <p className="mt-1 text-sm">{item.recommendation}</p>
            <a className="mt-1 inline-flex max-w-full items-center gap-1 truncate text-xs text-primary underline" href={item.sourceUrl} target="_blank" rel="noreferrer">
              {shortUrl(item.sourceUrl)} <ExternalLink className="h-3 w-3 shrink-0" />
            </a>
            {item.targetUrl ? <p className="truncate text-xs text-muted-foreground">Target: {shortUrl(item.targetUrl)}</p> : null}
          </div>)}
          {crawlerReport.findings.length > 40 ? <p className="py-2 text-center text-sm text-muted-foreground">Showing the first 40 of {crawlerReport.findings.length} findings.</p> : null}
        </div> : <p className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">{crawlerReport.complete ? "No issues were found in the full sitemap crawl." : "No issues were found in the pages checked so far."}</p>}
      </CardContent> : <CardContent className="pt-0 text-sm text-muted-foreground">
        The full sitemap is processed in batches of up to 300 pages with low request concurrency. You can pause after a batch and continue later. Development timings are labeled as diagnostic only; use the production build for representative response-time measurements.
      </CardContent>}
    </Card>

    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {[
        { label: "Open actions", value: (data.summary.byStatus.open || 0) + (data.summary.byStatus.in_progress || 0), icon: AlertTriangle },
        { label: "Critical", value: data.summary.bySeverity.critical || 0, icon: AlertTriangle },
        { label: "High impact", value: data.summary.bySeverity.high || 0, icon: Target },
        { label: "Completed", value: data.summary.byStatus.completed || 0, icon: CheckCircle2 },
        { label: "Mapped keywords", value: data.keywordMappings.filter((row) => row.mapping && row.mappedPageExists).length, icon: Link2 },
      ].map(({ label, value, icon: Icon }) => <Card key={label}><CardContent className="flex items-center justify-between p-4"><div><p className="text-sm text-muted-foreground">{label}</p><p className="text-2xl font-bold">{value}</p></div><Icon className="h-5 w-5 text-primary" /></CardContent></Card>)}
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Keyword → preferred page</CardTitle>
        <CardDescription>Give each target keyword one canonical landing page. Search Console evidence warns when several pages compete.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>Keyword</TableHead><TableHead>Preferred page</TableHead><TableHead>Evidence</TableHead><TableHead>Coverage</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>{data.keywordMappings.length ? data.keywordMappings.map((row) => <TableRow key={row.keyword}>
            <TableCell className="font-medium">{row.keyword}</TableCell>
            <TableCell>{row.mapping ? <a href={row.mapping.pageUrl} target="_blank" rel="noreferrer" className="text-primary underline">{shortUrl(row.mapping.pageUrl)}</a> : <span className="text-muted-foreground">Not assigned</span>}</TableCell>
            <TableCell className="text-sm">{row.metrics.impressions.toLocaleString()} impressions · {row.metrics.clicks.toLocaleString()} clicks<br/><span className="text-muted-foreground">{(row.metrics.ctr * 100).toFixed(2)}% CTR · position {row.metrics.position ? row.metrics.position.toFixed(1) : "—"}</span></TableCell>
            <TableCell>{row.warning ? <Badge variant="destructive">{row.warning}</Badge> : <Badge variant="secondary">Mapped</Badge>}{row.competingPages.length > 1 ? <div className="mt-1 text-xs text-muted-foreground">{row.competingPages.map(shortUrl).join(", ")}</div> : null}</TableCell>
            <TableCell><Button size="sm" variant="outline" onClick={() => editMapping(row)}>Assign page</Button></TableCell>
          </TableRow>) : <TableRow><TableCell colSpan={5}>Add target keywords above to start mapping pages.</TableCell></TableRow>}</TableBody>
        </Table>
      </CardContent>
    </Card>

    {approvedReplacements.length ? <Card className="border-amber-300">
      <CardHeader><CardTitle>Approved replacements awaiting application</CardTitle><CardDescription>Applying is a separate confirmed action. It replaces the original entry in Primary Keywords.</CardDescription></CardHeader>
      <CardContent className="space-y-2">{approvedReplacements.map((review) => <div key={review.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3"><div><span className="line-through text-muted-foreground">{review.keyword}</span><span className="mx-2">→</span><strong>{review.replacement}</strong></div><Button size="sm" onClick={() => setReplacementReview(review)}>Review and apply</Button></div>)}</CardContent>
    </Card> : null}

    <Card>
      <CardHeader><CardTitle>SEO opportunities</CardTitle><CardDescription>Review the evidence, assign a status, and record notes. Heuristic suggestions are labelled and always require human judgment.</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 md:grid-cols-4">
          <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search findings…" value={opportunitySearch} onChange={(event) => setOpportunitySearch(event.target.value)} /></div>
          <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Open + in progress</SelectItem><SelectItem value="all">All statuses</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="dismissed">Dismissed</SelectItem></SelectContent></Select>
          <Select value={severityFilter} onValueChange={setSeverityFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All severities</SelectItem><SelectItem value="critical">Critical</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="low">Low</SelectItem></SelectContent></Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All categories</SelectItem>{Object.entries(categoryLabel).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
        </div>
        <p className="text-xs text-muted-foreground">Showing {Math.min(filteredOpportunities.length, 100)} of {filteredOpportunities.length} matching findings</p>
        <Table>
          <TableHeader><TableRow><TableHead>Priority</TableHead><TableHead>Opportunity</TableHead><TableHead>Page</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>{filteredOpportunities.slice(0, 100).map((opportunity) => <TableRow key={opportunity.fingerprint}>
            <TableCell><Badge className={severityClass[opportunity.severity]}>{opportunity.severity}</Badge></TableCell>
            <TableCell className="max-w-lg"><p className="font-medium">{opportunity.title}</p><p className="text-sm text-muted-foreground">{opportunity.description}</p></TableCell>
            <TableCell><a href={opportunity.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex max-w-xs items-center gap-1 truncate text-sm text-primary underline">{shortUrl(opportunity.sourceUrl)}<ExternalLink className="h-3 w-3 shrink-0" /></a></TableCell>
            <TableCell><Badge variant="outline">{statusLabel[opportunity.status]}</Badge></TableCell>
            <TableCell><Button size="sm" variant="outline" onClick={() => editOpportunity(opportunity)}>Review</Button></TableCell>
          </TableRow>)}</TableBody>
        </Table>
      </CardContent>
    </Card>

    <Dialog open={!!selectedOpportunity} onOpenChange={(open) => !open && setSelectedOpportunity(null)}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader><DialogTitle>{selectedOpportunity?.title}</DialogTitle><DialogDescription>{selectedOpportunity?.description}</DialogDescription></DialogHeader>
        {selectedOpportunity ? <div className="space-y-4">
          <div className="rounded-md bg-muted p-3"><p className="text-sm font-medium">Recommended action</p><p className="text-sm">{selectedOpportunity.recommendation}</p></div>
          {selectedOpportunity.evidence?.query ? <div className="rounded-md border p-3 text-sm"><p><strong>Imported query:</strong> {selectedOpportunity.evidence.query}</p><p><strong>Measured evidence:</strong> {selectedOpportunity.evidence.impressions} impressions, {selectedOpportunity.evidence.clicks} clicks, {(Number(selectedOpportunity.evidence.ctr) * 100).toFixed(2)}% CTR</p>{selectedOpportunity.evidence.questions?.length ? <div className="mt-2"><strong>Questions for a factual content brief:</strong><ul className="list-disc pl-5">{selectedOpportunity.evidence.questions.map((question: string) => <li key={question}>{question}</li>)}</ul></div> : null}</div> : null}
          {selectedOpportunity.evidence?.heuristic ? <p className="text-xs text-amber-700">Heuristic suggestion: confirm the context is genuinely relevant before editing content.</p> : null}
          {selectedOpportunity.baselineComparison && Object.keys(selectedOpportunity.baselineComparison).length ? <div className="rounded-md border p-3 text-sm"><p className="font-medium">Change since the saved baseline</p><p className="text-muted-foreground">{Object.entries(selectedOpportunity.baselineComparison).map(([key, value]) => `${key}: ${value >= 0 ? "+" : ""}${Number(value).toFixed(2)}`).join(" · ")}</p></div> : null}
          {selectedOpportunity.history?.length ? <div className="rounded-md border p-3 text-sm"><p className="mb-2 font-medium">Review history</p><div className="space-y-2">{selectedOpportunity.history.map((event) => <div key={event.id}><span className="font-medium">{statusLabel[event.status]}</span><span className="text-muted-foreground"> · {new Date(event.createdAt).toLocaleString()}</span>{event.notes ? <p className="text-muted-foreground">{event.notes}</p> : null}</div>)}</div></div> : null}
          <div><Label>Status</Label><Select value={opportunityStatus} onValueChange={(value) => setOpportunityStatus(value as Opportunity["status"])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(statusLabel).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
          <div><Label>Review notes</Label><Textarea value={opportunityNotes} onChange={(event) => setOpportunityNotes(event.target.value)} maxLength={5000} placeholder="Record what should change, why it was dismissed, or what was completed." /></div>
        </div> : null}
        <DialogFooter><Button variant="outline" onClick={() => setSelectedOpportunity(null)}>Cancel</Button><Button disabled={statusMutation.isPending || !selectedOpportunity} onClick={() => selectedOpportunity && statusMutation.mutate({ opportunity: selectedOpportunity, status: opportunityStatus, notes: opportunityNotes })}>{statusMutation.isPending ? "Saving…" : "Save review"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={!!mappingRow} onOpenChange={(open) => !open && setMappingRow(null)}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader><DialogTitle>Assign a preferred page</DialogTitle><DialogDescription>Choose one canonical page for “{mappingRow?.keyword}”. This does not change the page content.</DialogDescription></DialogHeader>
        <Input placeholder="Search products, categories, blogs, or URLs…" value={pageSearch} onChange={(event) => setPageSearch(event.target.value)} />
        <div className="max-h-80 space-y-1 overflow-y-auto rounded-md border p-2">{matchingPages.map((page) => <button key={page.url} type="button" onClick={() => setSelectedPage(page)} className={`w-full rounded-md p-2 text-left text-sm ${selectedPage?.url === page.url ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}><span className="block font-medium">{page.title}</span><span className="block truncate text-xs opacity-75">{page.type} · {shortUrl(page.url)}</span></button>)}</div>
        <DialogFooter><Button variant="outline" onClick={() => setMappingRow(null)}>Cancel</Button><Button disabled={!selectedPage || !mappingRow || mappingMutation.isPending} onClick={() => mappingRow && selectedPage && mappingMutation.mutate({ keyword: mappingRow.keyword, page: selectedPage })}>{mappingMutation.isPending ? "Saving…" : "Assign page"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>

    <AlertDialog open={!!replacementReview} onOpenChange={(open) => !open && setReplacementReview(null)}>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>Apply this keyword replacement?</AlertDialogTitle><AlertDialogDescription>This will replace “{replacementReview?.keyword}” with “{replacementReview?.replacement}” in Primary Keywords. It will not edit page content or metadata.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction disabled={applyReplacementMutation.isPending} onClick={() => replacementReview && applyReplacementMutation.mutate(replacementReview)}>Apply replacement</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>;
}