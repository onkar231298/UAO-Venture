import { useMemo, useState } from 'react';
import './_group.css';
import { format } from 'date-fns';
import {
  Activity, BarChart3, Building2, Calculator, Calendar, CheckCircle, CheckSquare,
  ChevronDown, ClipboardCheck, ClipboardList, Clock, DollarSign, Download, Filter,
  FileText, Globe, LayoutDashboard, List, LogOut, Mail, MapPin, Menu, MoreVertical,
  Package, Plus, RefreshCw, Search, Send, Settings, ShieldAlert, ShoppingCart,
  Trash2, TrendingUp, Truck, Upload, UserPlus, Users, Warehouse, X, Kanban,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const COMPANY_STAGES = [
  { id: 'new', label: 'New', color: 'bg-gray-100 text-gray-800' },
  { id: 'contacted', label: 'Contacted', color: 'bg-blue-100 text-blue-800' },
  { id: 'qualified', label: 'Qualified', color: 'bg-cyan-100 text-cyan-800' },
  { id: 'active', label: 'Active Customer', color: 'bg-green-100 text-green-800' },
  { id: 'inactive', label: 'Inactive', color: 'bg-slate-100 text-slate-800' },
  { id: 'churned', label: 'Churned', color: 'bg-red-100 text-red-800' },
];

type Company = {
  id: number; companyName: string; primaryEmail: string; industryType: string;
  origin: string; companyStage: string; priority: string; addressCity: string;
  addressState: string; addressCountry: string; createdAt: string;
  assignedTo: string; status: string; isIrrelevant?: boolean;
  irrelevantReason?: string; irrelevantMarkedByName?: string; irrelevantMarkedAt?: string;
};

const SALES_REPS = [
  { id: 'rep-amara', firstName: 'Amara', lastName: 'Shah', email: 'amara.shah@example.test' },
  { id: 'rep-noah', firstName: 'Noah', lastName: 'Bennett', email: 'noah.bennett@example.test' },
  { id: 'rep-maya', firstName: 'Maya', lastName: 'Chen', email: 'maya.chen@example.test' },
];

const INITIAL_COMPANIES: Company[] = [
  { id: 101, companyName: 'Verdant Pantry Co.', primaryEmail: 'hello@verdantpantry.example', industryType: 'Food & Beverage', origin: 'website', companyStage: 'qualified', priority: 'hot', addressCity: 'Portland', addressState: 'Oregon', addressCountry: 'United States', createdAt: '2025-01-18', assignedTo: 'rep-amara', status: 'active' },
  { id: 102, companyName: 'Northstar Nutrition Labs', primaryEmail: 'sourcing@northstarnutrition.example', industryType: 'Nutraceuticals', origin: 'manual', companyStage: 'contacted', priority: 'warm', addressCity: 'Toronto', addressState: 'Ontario', addressCountry: 'Canada', createdAt: '2025-01-14', assignedTo: 'rep-noah', status: 'active' },
  { id: 103, companyName: 'Morrow & Field Organics', primaryEmail: 'procurement@morrowfield.example', industryType: 'Food & Beverage', origin: 'website', companyStage: 'new', priority: 'cold', addressCity: 'Bristol', addressState: 'England', addressCountry: 'United Kingdom', createdAt: '2025-01-12', assignedTo: '', status: 'pending' },
  { id: 104, companyName: 'Cedar Grove Botanicals', primaryEmail: 'team@cedargrove.example', industryType: 'Cosmetics & Personal Care', origin: 'import', companyStage: 'active', priority: 'warm', addressCity: 'Auckland', addressState: 'Auckland', addressCountry: 'New Zealand', createdAt: '2025-01-09', assignedTo: 'rep-maya', status: 'active' },
  { id: 105, companyName: 'Asterion Pharma Supply', primaryEmail: 'quality@asterionpharma.example', industryType: 'Pharmaceuticals', origin: 'manual', companyStage: 'qualified', priority: 'hot', addressCity: 'Basel', addressState: 'Basel-Stadt', addressCountry: 'Switzerland', createdAt: '2025-01-06', assignedTo: 'rep-amara', status: 'active' },
  { id: 106, companyName: 'Little Orchard Ingredients', primaryEmail: 'buying@littleorchard.example', industryType: 'Food & Beverage', origin: 'website', companyStage: 'inactive', priority: 'cold', addressCity: 'Austin', addressState: 'Texas', addressCountry: 'United States', createdAt: '2024-12-22', assignedTo: '', status: 'inactive' },
  { id: 107, companyName: 'Bluebird Wellness Group', primaryEmail: 'partners@bluebirdwellness.example', industryType: 'Nutraceuticals', origin: 'import', companyStage: 'contacted', priority: 'warm', addressCity: 'Melbourne', addressState: 'Victoria', addressCountry: 'Australia', createdAt: '2024-12-20', assignedTo: 'rep-noah', status: 'active' },
  { id: 108, companyName: 'Juniper House Care', primaryEmail: 'supply@juniperhouse.example', industryType: 'Cosmetics & Personal Care', origin: 'website', companyStage: 'new', priority: 'cold', addressCity: 'Copenhagen', addressState: 'Capital Region', addressCountry: 'Denmark', createdAt: '2024-12-18', assignedTo: '', status: 'pending' },
  { id: 109, companyName: 'Solstice Harvest Trading', primaryEmail: 'imports@solsticeharvest.example', industryType: 'Other', origin: 'manual', companyStage: 'churned', priority: 'cold', addressCity: 'Singapore', addressState: '', addressCountry: 'Singapore', createdAt: '2024-12-10', assignedTo: 'rep-maya', status: 'merged' },
  { id: 110, companyName: 'Fieldstone Naturals', primaryEmail: 'contact@fieldstonenaturals.example', industryType: 'Food & Beverage', origin: 'website', companyStage: 'active', priority: 'hot', addressCity: 'Boulder', addressState: 'Colorado', addressCountry: 'United States', createdAt: '2024-12-04', assignedTo: 'rep-amara', status: 'active' },
  { id: 111, companyName: 'Old Mill Trading House', primaryEmail: 'hello@oldmilltrading.example', industryType: 'Other', origin: 'manual', companyStage: 'new', priority: 'cold', addressCity: 'Leeds', addressState: 'England', addressCountry: 'United Kingdom', createdAt: '2024-11-28', assignedTo: 'rep-noah', status: 'inactive', isIrrelevant: true, irrelevantReason: 'Outside current ingredient sourcing focus', irrelevantMarkedByName: 'Amara Shah', irrelevantMarkedAt: '2024-12-02' },
];

const adminNavGroups = [
  { title: 'MAIN', items: [['Dashboard', LayoutDashboard]] },
  { title: 'OPERATIONS', items: [['Inventory Management', Warehouse], ['Sales Management', TrendingUp], ['Customer Inquiries', Send], ['Sample Requests', Package], ['High Volume Bids', TrendingUp], ['Quote Negotiations', DollarSign], ['Sales Orders', ShoppingCart], ['Lead Management', Users], ['Company Management', Building2], ['Duplicate Review', Activity], ['Purchase Management', ShoppingCart], ['Logistics Management', Truck], ['Accounts & Finance', Calculator]] },
  { title: 'WEBSITE & CONTENT', items: [['Website Management', Globe], ['Newsletter', Mail], ['Blog Management', FileText]] },
  { title: 'PEOPLE & COMPLIANCE', items: [['User Management', Users], ['HR Management', Clock], ['Quality Management', ClipboardCheck], ['Sales Activity Logs', ClipboardList], ['Security & Activity', ShieldAlert]] },
  { title: 'ANALYTICS', items: [['Analytics & Reports', BarChart3]] },
  { title: 'ADMIN TOOLS', items: [['Document Upload', Upload]] },
  { title: 'PROFILE', items: [['System Settings', Settings]] },
] as const;

function displayDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

export function Current() {
  const [companies, setCompanies] = useState(INITIAL_COMPANIES);
  const [selectedCompanies, setSelectedCompanies] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [activeNav, setActiveNav] = useState('Company Management');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stageFilter, setStageFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [originFilter, setOriginFilter] = useState('all');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [assignedToFilter, setAssignedToFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showNotRelevant, setShowNotRelevant] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState('10');
  const [currentPage, setCurrentPage] = useState(1);
  const [previewNotice, setPreviewNotice] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const countries = [...new Set(companies.map((company) => company.addressCountry))].sort();
  const filteredCompanies = useMemo(() => companies.filter((company) => {
    const query = searchTerm.toLowerCase();
    return (!showNotRelevant || company.isIrrelevant)
      && (showNotRelevant || !company.isIrrelevant)
      && (stageFilter === 'all' || company.companyStage === stageFilter)
      && (!query || `${company.companyName} ${company.primaryEmail} ${company.addressCity}`.toLowerCase().includes(query))
      && (originFilter === 'all' || company.origin === originFilter)
      && (industryFilter === 'all' || company.industryType.toLowerCase().includes(industryFilter))
      && (countryFilter === 'all' || company.addressCountry === countryFilter)
      && (priorityFilter === 'all' || company.priority === priorityFilter)
      && (statusFilter === 'all' || company.status === statusFilter)
      && (assignedToFilter === 'all' || (assignedToFilter === 'unassigned' ? !company.assignedTo : company.assignedTo === assignedToFilter))
      && (!dateFrom || new Date(`${company.createdAt}T12:00:00`) >= dateFrom)
      && (!dateTo || new Date(`${company.createdAt}T12:00:00`) <= dateTo);
  }), [companies, showNotRelevant, stageFilter, searchTerm, originFilter, industryFilter, countryFilter, priorityFilter, statusFilter, assignedToFilter, dateFrom, dateTo]);

  const pageSize = itemsPerPage === 'all' ? filteredCompanies.length || 1 : Number(itemsPerPage);
  const totalPages = Math.max(1, Math.ceil(filteredCompanies.length / pageSize));
  const paginatedCompanies = filteredCompanies.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const assignedCount = companies.filter((company) => company.assignedTo).length;
  const activePageTitle = activeNav === 'Company Management' ? 'Company Management' : activeNav;

  const notifyPreview = (action: string) => setPreviewNotice(`${action} is preview-only. No data was changed or sent.`);
  const handleAssign = (companyId: number, repId: string) => {
    setCompanies((current) => current.map((company) => company.id === companyId ? { ...company, assignedTo: repId } : company));
    setPreviewNotice('Local preview state updated. No data was sent or saved.');
  };
  const handleSelect = (companyId: number, checked: boolean) => {
    setSelectedCompanies((current) => checked ? [...new Set([...current, companyId])] : current.filter((id) => id !== companyId));
  };
  const handleSelectAll = (checked: boolean) => {
    const pageIds = paginatedCompanies.map((company) => company.id);
    setSelectedCompanies((current) => checked ? [...new Set([...current, ...pageIds])] : current.filter((id) => !pageIds.includes(id)));
  };
  const getStageColor = (stage: string) => COMPANY_STAGES.find((item) => item.id === stage)?.color || 'bg-gray-100 text-gray-800';
  const getPriorityColor = (priority: string) => priority === 'hot' ? 'bg-red-100 text-red-800' : priority === 'warm' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800';
  const navButton = (label: string, Icon: typeof LayoutDashboard, size: 'normal' | 'small' = 'normal') => (
    <button
      key={label}
      onClick={() => { setActiveNav(label); setSidebarOpen(false); }}
      className={`w-full flex items-center px-4 py-2 text-sm rounded-lg transition-colors ${activeNav === label ? 'bg-blue-100 text-blue-900 border border-blue-200' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
    >
      <Icon className={`mr-3 flex-shrink-0 ${size === 'small' ? 'h-4 w-4' : 'h-5 w-5'}`} />
      <span className="truncate">{label}</span>
    </button>
  );

  return (
    <div className="bfo-portal-root bfo-admin-portal" data-portal-theme={theme}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />}
        <aside className={`${sidebarOpen ? 'flex' : 'hidden'} md:flex fixed md:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-sm border-r border-gray-200 dark:border-gray-700 flex-col`}>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Bright Fame Admin Portal</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Organic Platform</p>
              </div>
              <button className="md:hidden p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setSidebarOpen(false)}><X className="h-5 w-5 text-gray-500" /></button>
            </div>
            <button className="inline-flex items-center text-sm text-green-600 hover:text-green-700 mt-3" onClick={() => notifyPreview('Website navigation')}>
              <Globe className="w-4 h-4 mr-1" />Back to Website
            </button>
          </div>
          <nav className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-6">
              {adminNavGroups.map((group) => (
                <div key={group.title}>
                  <button type="button" className="bfo-nav-group-toggle" aria-expanded="true"><span>{group.title}</span><ChevronDown size={14} /></button>
                  {group.title === 'OPERATIONS' ? <div className="space-y-1">
                    {navButton('Inventory Management', Warehouse)}
                    {navButton('Sales Management', TrendingUp)}
                    <div className="ml-6 mt-1 space-y-1">
                      {navButton('Customer Inquiries', Send, 'small')}
                      {navButton('Sample Requests', Package, 'small')}
                      {navButton('High Volume Bids', TrendingUp, 'small')}
                      {navButton('Quote Negotiations', DollarSign, 'small')}
                      {navButton('Sales Orders', ShoppingCart, 'small')}
                      {navButton('Lead Management', Users, 'small')}
                      {navButton('Company Management', Building2, 'small')}
                      {navButton('Duplicate Review', Activity, 'small')}
                    </div>
                    {navButton('Purchase Management', ShoppingCart)}
                    {navButton('Logistics Management', Truck)}
                    {navButton('Accounts & Finance', Calculator)}
                  </div> : <div className="space-y-1">
                    {group.items.map(([label, Icon]) => <div key={label}>{navButton(label, Icon)}</div>)}
                  </div>}
                </div>
              ))}
            </div>
          </nav>
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button onClick={() => notifyPreview('Log out')} className="w-full flex items-center px-4 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50 transition-colors">
              <LogOut className="mr-3 h-4 w-4" />Log out
            </button>
          </div>
        </aside>
        <main className="flex-1 overflow-auto">
          <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between px-4 py-3 md:px-6">
              <div className="flex items-center gap-3 flex-1">
                <button className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setSidebarOpen(true)}><Menu className="h-5 w-5 text-gray-600 dark:text-gray-300" /></button>
                <div className="flex-1">
                  <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{activePageTitle}</h1>
                  <p className="hidden md:block text-sm text-gray-600 dark:text-gray-400">Manage your B2B organic ingredients platform</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden lg:flex items-center gap-2 text-xs text-muted-foreground"><Search className="h-4 w-4" /><span>Quick search</span></div>
                <button className="bfo-theme-toggle" onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme">◐ <span>Theme</span></button>
                <Button variant="ghost" size="icon" aria-label="Notifications" onClick={() => notifyPreview('Notifications')}><Activity className="h-4 w-4" /></Button>
                <Badge variant="secondary" className="hidden md:inline-flex bg-green-100 text-green-800">SUPER ADMIN</Badge>
                <Avatar className="h-8 w-8"><AvatarFallback className="bg-blue-600 text-white">AD</AvatarFallback></Avatar>
              </div>
            </div>
          </header>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="container mx-auto py-6 space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold" data-testid="heading-company-management">Company Management</h1>
                  <p className="text-muted-foreground">Manage all companies - both website customers and manually added</p>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <div className="flex border rounded-lg">
                    <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('list')} data-testid="button-view-list"><List className="h-4 w-4" /></Button>
                    <Button variant={viewMode === 'kanban' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('kanban')} data-testid="button-view-kanban"><Kanban className="h-4 w-4" /></Button>
                  </div>
                  <Button variant="outline" size="icon" onClick={() => notifyPreview('Refresh')} data-testid="button-refresh-companies"><RefreshCw className="h-4 w-4" /></Button>
                  <Button variant="outline" onClick={() => notifyPreview('Download All')} data-testid="button-download-all-companies"><Download className="h-4 w-4 mr-2" />Download All</Button>
                  <Button variant="outline" onClick={() => notifyPreview('Clean Up Countries')} data-testid="button-clean-countries"><MapPin className="h-4 w-4 mr-2" />Clean Up Countries</Button>
                  <Button variant="outline" onClick={() => setShowAdvancedFilters((show) => !show)} data-testid="button-toggle-filters"><Filter className="h-4 w-4 mr-2" />Filters</Button>
                  <Button variant="outline" data-testid="button-bulk-upload" onClick={() => notifyPreview('Bulk Upload')}><Upload className="h-4 w-4 mr-2" />Bulk Upload</Button>
                  <Button data-testid="button-create-company" onClick={() => notifyPreview('Add Company')}><Plus className="h-4 w-4 mr-2" />Add Company</Button>
                </div>
              </div>

              <Tabs value={stageFilter} onValueChange={(value) => { setStageFilter(value); setCurrentPage(1); }} className="w-full">
                <TabsList className="flex flex-wrap h-auto gap-1 bg-muted p-1">
                  <TabsTrigger value="all" className="text-xs" data-testid="tab-all-stages">All</TabsTrigger>
                  {COMPANY_STAGES.map((stage) => <TabsTrigger key={stage.id} value={stage.id} className="text-xs" data-testid={`tab-stage-${stage.id}`}>{stage.label}</TabsTrigger>)}
                </TabsList>
              </Tabs>

              <Card><CardContent className="p-4">
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px] relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search companies by name, GST, email..." value={searchTerm} onChange={(event) => { setSearchTerm(event.target.value); setCurrentPage(1); }} className="pl-10" data-testid="input-search-companies" />
                  </div>
                  <Select value={originFilter} onValueChange={setOriginFilter}><SelectTrigger className="w-[150px]" data-testid="select-origin-filter"><SelectValue placeholder="Origin" /></SelectTrigger><SelectContent><SelectItem value="all">All Origins</SelectItem><SelectItem value="website">Website</SelectItem><SelectItem value="manual">Manual</SelectItem><SelectItem value="import">Imported</SelectItem></SelectContent></Select>
                  <Select value={industryFilter} onValueChange={setIndustryFilter}><SelectTrigger className="w-[180px]" data-testid="select-industry-filter"><SelectValue placeholder="Industry" /></SelectTrigger><SelectContent><SelectItem value="all">All Industries</SelectItem><SelectItem value="food">Food &amp; Beverage</SelectItem><SelectItem value="pharma">Pharmaceuticals</SelectItem><SelectItem value="cosmetics">Cosmetics &amp; Personal Care</SelectItem><SelectItem value="nutraceuticals">Nutraceuticals</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select>
                  <Select value={countryFilter} onValueChange={setCountryFilter}><SelectTrigger className="w-[160px]" data-testid="select-country-filter"><SelectValue placeholder="All Countries" /></SelectTrigger><SelectContent><SelectItem value="all">All Countries</SelectItem>{countries.map((country) => <SelectItem key={country} value={country}>{country}</SelectItem>)}</SelectContent></Select>
                </div>
                {showAdvancedFilters && <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}><SelectTrigger className="w-[150px]" data-testid="select-priority-filter"><SelectValue placeholder="Priority" /></SelectTrigger><SelectContent><SelectItem value="all">All Priorities</SelectItem><SelectItem value="hot">Hot</SelectItem><SelectItem value="warm">Warm</SelectItem><SelectItem value="cold">Cold</SelectItem></SelectContent></Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-[150px]" data-testid="select-status-filter"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All Statuses</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="merged">Merged (Duplicates)</SelectItem></SelectContent></Select>
                  <Select value={assignedToFilter} onValueChange={setAssignedToFilter}><SelectTrigger className="w-[180px]" data-testid="select-assigned-filter"><SelectValue placeholder="Assigned To" /></SelectTrigger><SelectContent><SelectItem value="all">All Assignments</SelectItem><SelectItem value="unassigned">Unassigned</SelectItem>{SALES_REPS.map((rep) => <SelectItem key={rep.id} value={rep.id}>{rep.firstName} {rep.lastName}</SelectItem>)}</SelectContent></Select>
                  <div className="flex items-center gap-2">
                    <Popover><PopoverTrigger asChild><Button variant="outline" size="sm" className="w-[130px]" data-testid="button-date-from"><Calendar className="h-3 w-3 mr-1" />{dateFrom ? format(dateFrom, 'MMM d, yyyy') : 'From Date'}</Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><CalendarComponent mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus /></PopoverContent></Popover>
                    <span className="text-muted-foreground">to</span>
                    <Popover><PopoverTrigger asChild><Button variant="outline" size="sm" className="w-[130px]" data-testid="button-date-to"><Calendar className="h-3 w-3 mr-1" />{dateTo ? format(dateTo, 'MMM d, yyyy') : 'To Date'}</Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><CalendarComponent mode="single" selected={dateTo} onSelect={setDateTo} initialFocus /></PopoverContent></Popover>
                    {(dateFrom || dateTo) && <Button variant="ghost" size="sm" onClick={() => { setDateFrom(undefined); setDateTo(undefined); }} data-testid="button-clear-dates"><X className="h-3 w-3" /></Button>}
                  </div>
                </div>}
              </CardContent></Card>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total', value: companies.length, Icon: Building2, color: 'text-gray-900' },
                  { label: 'Website', value: companies.filter((company) => company.origin === 'website').length, Icon: Globe, color: 'text-blue-600' },
                  { label: 'Assigned', value: assignedCount, Icon: Users, color: 'text-green-600' },
                  { label: 'Unassigned', value: companies.length - assignedCount, Icon: Building2, color: 'text-amber-600' },
                ].map(({ label, value, Icon, color }) => (
                  <Card key={label}><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">{label}</p><p className={`text-2xl font-bold ${color}`} data-testid={`text-${label.toLowerCase()}-companies`}>{value}</p></div><Icon className="h-8 w-8 text-muted-foreground" /></div></CardContent></Card>
                ))}
              </div>

              {selectedCompanies.length > 0 && <Card className="bg-blue-50 border-blue-200"><CardContent className="p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2"><CheckSquare className="h-5 w-5 text-blue-600" /><span className="font-medium text-blue-900">{selectedCompanies.length} companies selected</span></div>
                  <div className="flex flex-wrap items-center gap-2">
                    <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" size="sm" data-testid="button-bulk-assign"><UserPlus className="h-4 w-4 mr-2" />Assign to</Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuLabel>Assign selected companies to</DropdownMenuLabel><DropdownMenuSeparator />{SALES_REPS.map((rep) => <DropdownMenuItem key={rep.id} onClick={() => { setCompanies((current) => current.map((company) => selectedCompanies.includes(company.id) ? { ...company, assignedTo: rep.id } : company)); notifyPreview('Bulk assignment'); }}><UserPlus className="h-3 w-3 mr-2" />{rep.firstName} {rep.lastName}</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu>
                    <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => notifyPreview('Bulk Email')} data-testid="button-bulk-email"><Mail className="h-4 w-4 mr-2" />Bulk Email</Button>
                    <Button variant="outline" size="sm" onClick={() => notifyPreview('Request Quality')}><ClipboardCheck className="h-4 w-4 mr-2" />Request Quality</Button>
                    <Button variant="destructive" size="sm" onClick={() => notifyPreview('Delete Selected')} data-testid="button-bulk-delete"><Trash2 className="h-4 w-4 mr-2" />Delete Selected</Button>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedCompanies([])} data-testid="button-clear-selection"><X className="h-4 w-4 mr-1" />Clear</Button>
                  </div>
                </div>
              </CardContent></Card>}

              <div className="flex items-center gap-2">
                <Button variant={!showNotRelevant ? 'default' : 'outline'} size="sm" onClick={() => setShowNotRelevant(false)}>Active Companies</Button>
                <Button variant={showNotRelevant ? 'default' : 'outline'} size="sm" className={showNotRelevant ? 'bg-gray-600 hover:bg-gray-700' : ''} onClick={() => setShowNotRelevant(true)}>Not Relevant</Button>
              </div>

              {showNotRelevant ? <Card><CardContent className="p-0">
                <div className="overflow-x-auto -mx-4 sm:mx-0" style={{ WebkitOverflowScrolling: 'touch' }}>
                  <div className="inline-block min-w-full align-middle"><div className="overflow-hidden sm:rounded-lg">
                    <Table className="min-w-[900px]">
                      <TableHeader className="md:sticky md:top-0 md:z-10 md:bg-white md:dark:bg-gray-800"><TableRow><TableHead>Company</TableHead><TableHead>Reason</TableHead><TableHead>Flagged By</TableHead><TableHead>Flagged Date</TableHead><TableHead>Assigned Rep</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
                      <TableBody>{paginatedCompanies.map((company) => {
                        const assignedRep = SALES_REPS.find((rep) => rep.id === company.assignedTo);
                        return <TableRow key={company.id} className="opacity-75">
                          <TableCell><div className="font-medium text-gray-500">{company.companyName}</div><div className="text-xs text-gray-400">{company.primaryEmail || ''}</div></TableCell>
                          <TableCell className="text-sm text-gray-500 italic max-w-[200px] truncate">{company.irrelevantReason || <span className="text-gray-300">—</span>}</TableCell>
                          <TableCell className="text-sm">{company.irrelevantMarkedByName || '—'}</TableCell>
                          <TableCell className="text-sm">{company.irrelevantMarkedAt ? displayDate(company.irrelevantMarkedAt) : '—'}</TableCell>
                          <TableCell className="text-sm">{assignedRep ? `${assignedRep.firstName} ${assignedRep.lastName}` : <span className="text-gray-400">Unassigned</span>}</TableCell>
                          <TableCell><Button size="sm" variant="outline" className="text-green-700 border-green-300 hover:bg-green-50" onClick={() => { setCompanies((current) => current.map((item) => item.id === company.id ? { ...item, isIrrelevant: false } : item)); notifyPreview('Restore company'); }}><CheckCircle className="h-3 w-3 mr-1" />Restore</Button></TableCell>
                        </TableRow>;
                      })}</TableBody>
                    </Table>
                  </div></div>
                </div>
              </CardContent></Card> : viewMode === 'list' ? <Card><CardContent className="p-0">
                <div className="overflow-x-auto -mx-4 sm:mx-0" style={{ WebkitOverflowScrolling: 'touch' }}>
                  <div className="inline-block min-w-full align-middle"><div className="overflow-hidden sm:rounded-lg">
                    <Table className="min-w-[1000px]">
                      <TableHeader className="md:sticky md:top-0 md:z-10 md:bg-white md:dark:bg-gray-800"><TableRow>
                        <TableHead className="w-[50px]"><Checkbox checked={paginatedCompanies.length > 0 && paginatedCompanies.every((company) => selectedCompanies.includes(company.id))} onCheckedChange={(checked) => handleSelectAll(!!checked)} data-testid="checkbox-select-all" /></TableHead>
                        <TableHead>Company</TableHead><TableHead>Origin</TableHead><TableHead>Stage</TableHead><TableHead>Priority</TableHead><TableHead>Location</TableHead><TableHead>Date Added</TableHead><TableHead>Assigned To</TableHead><TableHead>Actions</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>{paginatedCompanies.map((company) => {
                        const assignedRep = SALES_REPS.find((rep) => rep.id === company.assignedTo);
                        const isSelected = selectedCompanies.includes(company.id);
                        return <TableRow key={company.id} data-testid={`row-company-${company.id}`} className={isSelected ? 'bg-blue-50' : ''}>
                          <TableCell><Checkbox checked={isSelected} onCheckedChange={(checked) => handleSelect(company.id, !!checked)} data-testid={`checkbox-company-${company.id}`} /></TableCell>
                          <TableCell><div className="flex items-start gap-2"><Building2 className="h-4 w-4 mt-1 text-muted-foreground" /><div><p className="font-medium" data-testid={`text-company-name-${company.id}`}>{company.companyName}</p>{company.primaryEmail && <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" />{company.primaryEmail}</p>}{company.industryType && <Badge variant="outline" className="mt-1 text-[10px]">{company.industryType}</Badge>}</div></div></TableCell>
                          <TableCell><Badge variant="outline" className={company.origin === 'website' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-700 border-gray-200'}>{company.origin === 'website' ? 'Website' : company.origin || 'Manual'}</Badge></TableCell>
                          <TableCell><Badge className={getStageColor(company.companyStage)}>{COMPANY_STAGES.find((stage) => stage.id === company.companyStage)?.label || 'New'}</Badge></TableCell>
                          <TableCell><Badge className={getPriorityColor(company.priority)}>{company.priority || 'warm'}</Badge></TableCell>
                          <TableCell><div className="flex items-center gap-1"><MapPin className="h-3 w-3 text-muted-foreground" /><span className="text-sm">{company.addressCity}{company.addressState && `, ${company.addressState}`}</span></div></TableCell>
                          <TableCell><span className="text-sm text-muted-foreground">{displayDate(company.createdAt)}</span></TableCell>
                          <TableCell>{assignedRep ? <span className="text-sm font-medium">{assignedRep.firstName} {assignedRep.lastName}</span> : <span className="text-sm text-amber-600">Unassigned</span>}</TableCell>
                          <TableCell><div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => notifyPreview(`View ${company.companyName}`)} data-testid={`button-view-company-${company.id}`}>View</Button>
                            <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-8 w-8 p-0" data-testid={`button-menu-${company.id}`}><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end">
                              <DropdownMenuLabel>Assign to</DropdownMenuLabel><DropdownMenuSeparator />
                              {SALES_REPS.map((rep) => <DropdownMenuItem key={rep.id} onClick={() => handleAssign(company.id, rep.id)} data-testid={`menu-assign-${rep.id}`}><UserPlus className="h-3 w-3 mr-2" />{rep.firstName} {rep.lastName}{company.assignedTo === rep.id && ' (current)'}</DropdownMenuItem>)}
                              <DropdownMenuSeparator /><DropdownMenuItem onClick={() => { setCompanies((current) => current.map((item) => item.id === company.id ? { ...item, isIrrelevant: !item.isIrrelevant } : item)); notifyPreview('Relevance flag'); }}>{company.isIrrelevant ? <><CheckCircle className="h-3 w-3 mr-2 text-green-600" />Mark as Relevant</> : <><X className="h-3 w-3 mr-2" />Mark as Not Relevant</>}</DropdownMenuItem>
                              <DropdownMenuSeparator /><DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => notifyPreview('Delete Company')} data-testid={`menu-delete-${company.id}`}><Trash2 className="h-3 w-3 mr-2" />Delete Company</DropdownMenuItem>
                            </DropdownMenuContent></DropdownMenu>
                          </div></TableCell>
                        </TableRow>;
                      })}</TableBody>
                    </Table>
                  </div></div>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 pt-4 border-t">
                  <div className="flex items-center gap-2"><span className="text-sm text-muted-foreground">Companies per page:</span><Select value={itemsPerPage} onValueChange={(value) => { setItemsPerPage(value); setCurrentPage(1); }}><SelectTrigger className="w-[80px]" data-testid="select-items-per-page"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="10">10</SelectItem><SelectItem value="25">25</SelectItem><SelectItem value="50">50</SelectItem><SelectItem value="100">100</SelectItem><SelectItem value="all">All</SelectItem></SelectContent></Select></div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><span>Showing {filteredCompanies.length ? ((currentPage - 1) * pageSize) + 1 : 0} - {Math.min(currentPage * pageSize, filteredCompanies.length)} of {filteredCompanies.length} companies</span></div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage === 1} data-testid="button-first-page">First</Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1} data-testid="button-prev-page">Previous</Button>
                    <span className="text-sm px-2">Page {currentPage} of {totalPages}</span>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages} data-testid="button-next-page">Next</Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} data-testid="button-last-page">Last</Button>
                  </div>
                </div>
              </CardContent></Card> : <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto">
                {COMPANY_STAGES.map((stage) => <Card key={stage.id} className="min-w-[220px]"><CardContent className="p-3"><div className="flex items-center justify-between mb-3"><h3 className="font-semibold text-sm">{stage.label}</h3><Badge variant="secondary">{filteredCompanies.filter((company) => company.companyStage === stage.id).length}</Badge></div><div className="space-y-2">{filteredCompanies.filter((company) => company.companyStage === stage.id).map((company) => <div key={company.id} className="rounded-lg border p-3 bg-background"><p className="font-medium text-sm">{company.companyName}</p><p className="text-xs text-muted-foreground mt-1">{company.addressCity}, {company.addressCountry}</p><div className="flex justify-between items-center mt-3"><Badge className={getPriorityColor(company.priority)}>{company.priority}</Badge><span className="text-xs text-muted-foreground">{company.assignedTo ? SALES_REPS.find((rep) => rep.id === company.assignedTo)?.firstName : 'Unassigned'}</span></div></div>)}</div></CardContent></Card>)}
              </div>}

              <footer className="border-t pt-4 text-xs text-muted-foreground">Sample data / design preview · Local-only fictional company records</footer>
            </div>
          </div>
        </main>
      </div>
      {previewNotice && <div role="status" className="fixed bottom-4 right-4 z-[100] max-w-sm rounded-lg border bg-card p-4 shadow-lg">
        <div className="flex items-start gap-3"><div className="flex-1"><p className="font-medium">Preview only</p><p className="text-sm text-muted-foreground mt-1">{previewNotice}</p></div><button aria-label="Dismiss message" onClick={() => setPreviewNotice('')}><X className="h-4 w-4" /></button></div>
      </div>}
    </div>
  );
}
