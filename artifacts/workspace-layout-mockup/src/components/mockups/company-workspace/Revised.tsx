import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity, BarChart3, Building2, Calculator, CheckCircle2,
  ClipboardCheck, ClipboardList, Clock3, Download, Filter, FileText,
  Globe2, LayoutDashboard, List, LogOut, Mail, MapPin, Menu, MoreHorizontal,
  Package, Plus, RefreshCw, Search, Send, Settings2, ShieldAlert, ShoppingCart,
  Sun, Moon, Trash2, Truck, Upload, Users, Warehouse, X, Kanban,
} from 'lucide-react';
import './revised.css';

type Company = {
  id: number; companyName: string; primaryEmail: string; industryType: string;
  origin: string; companyStage: string; priority: string; addressCity: string;
  addressState: string; addressCountry: string; createdAt: string; assignedTo: string;
  status: string; isIrrelevant?: boolean; irrelevantReason?: string;
  irrelevantMarkedByName?: string; irrelevantMarkedAt?: string;
};
type Contact = { companyId: number; name: string; role: string; email: string; phone: string; primary?: boolean };
type DialogInfo = { title: string; message: string; form?: boolean };

const STAGES = [
  { id: 'new', label: 'New' }, { id: 'contacted', label: 'Contacted' },
  { id: 'qualified', label: 'Qualified' }, { id: 'active', label: 'Active Customer' },
  { id: 'inactive', label: 'Inactive' }, { id: 'churned', label: 'Churned' },
];
const REPS = [
  { id: 'rep-amara', firstName: 'Amara', lastName: 'Shah' },
  { id: 'rep-noah', firstName: 'Noah', lastName: 'Bennett' },
  { id: 'rep-maya', firstName: 'Maya', lastName: 'Chen' },
];
const NAV_GROUPS = [
  { title: 'Main', items: [['Dashboard', LayoutDashboard]] },
  { title: 'Operations', items: [['Inventory Management', Warehouse], ['Sales Management', Activity], ['Customer Inquiries', Send], ['Sample Requests', Package], ['High Volume Bids', BarChart3], ['Quote Negotiations', Calculator], ['Sales Orders', ShoppingCart], ['Lead Management', Users], ['Company Management', Building2], ['Duplicate Review', ClipboardCheck], ['Purchase Management', ShoppingCart], ['Logistics Management', Truck], ['Accounts & Finance', Calculator]] },
  { title: 'Website & Content', items: [['Website Management', Globe2], ['Newsletter', Mail], ['Blog Management', FileText]] },
  { title: 'People & Compliance', items: [['User Management', Users], ['HR Management', Clock3], ['Quality Management', ClipboardCheck], ['Sales Activity Logs', ClipboardList], ['Security & Activity', ShieldAlert]] },
  { title: 'Analytics', items: [['Analytics & Reports', BarChart3]] },
  { title: 'Admin Tools', items: [['Document Upload', Upload]] },
  { title: 'Profile', items: [['System Settings', Settings2]] },
] as const;
const INITIAL: Company[] = [
  { id:101, companyName:'Verdant Pantry Co.', primaryEmail:'hello@verdantpantry.example', industryType:'Food & Beverage', origin:'website', companyStage:'qualified', priority:'hot', addressCity:'Portland', addressState:'Oregon', addressCountry:'United States', createdAt:'2025-01-18', assignedTo:'rep-amara', status:'active' },
  { id:102, companyName:'Northstar Nutrition Labs', primaryEmail:'sourcing@northstarnutrition.example', industryType:'Nutraceuticals', origin:'manual', companyStage:'contacted', priority:'warm', addressCity:'Toronto', addressState:'Ontario', addressCountry:'Canada', createdAt:'2025-01-14', assignedTo:'rep-noah', status:'active' },
  { id:103, companyName:'Morrow & Field Organics', primaryEmail:'procurement@morrowfield.example', industryType:'Food & Beverage', origin:'website', companyStage:'new', priority:'cold', addressCity:'Bristol', addressState:'England', addressCountry:'United Kingdom', createdAt:'2025-01-12', assignedTo:'', status:'pending' },
  { id:104, companyName:'Cedar Grove Botanicals', primaryEmail:'team@cedargrove.example', industryType:'Cosmetics & Personal Care', origin:'import', companyStage:'active', priority:'warm', addressCity:'Auckland', addressState:'Auckland', addressCountry:'New Zealand', createdAt:'2025-01-09', assignedTo:'rep-maya', status:'active' },
  { id:105, companyName:'Asterion Pharma Supply', primaryEmail:'quality@asterionpharma.example', industryType:'Pharmaceuticals', origin:'manual', companyStage:'qualified', priority:'hot', addressCity:'Basel', addressState:'Basel-Stadt', addressCountry:'Switzerland', createdAt:'2025-01-06', assignedTo:'rep-amara', status:'active' },
  { id:106, companyName:'Little Orchard Ingredients', primaryEmail:'buying@littleorchard.example', industryType:'Food & Beverage', origin:'website', companyStage:'inactive', priority:'cold', addressCity:'Austin', addressState:'Texas', addressCountry:'United States', createdAt:'2024-12-22', assignedTo:'', status:'inactive' },
  { id:107, companyName:'Bluebird Wellness Group', primaryEmail:'partners@bluebirdwellness.example', industryType:'Nutraceuticals', origin:'import', companyStage:'contacted', priority:'warm', addressCity:'Melbourne', addressState:'Victoria', addressCountry:'Australia', createdAt:'2024-12-20', assignedTo:'rep-noah', status:'active' },
  { id:108, companyName:'Juniper House Care', primaryEmail:'supply@juniperhouse.example', industryType:'Cosmetics & Personal Care', origin:'website', companyStage:'new', priority:'cold', addressCity:'Copenhagen', addressState:'Capital Region', addressCountry:'Denmark', createdAt:'2024-12-18', assignedTo:'', status:'pending' },
  { id:109, companyName:'Solstice Harvest Trading', primaryEmail:'imports@solsticeharvest.example', industryType:'Other', origin:'manual', companyStage:'churned', priority:'cold', addressCity:'Singapore', addressState:'', addressCountry:'Singapore', createdAt:'2024-12-10', assignedTo:'rep-maya', status:'merged' },
  { id:110, companyName:'Fieldstone Naturals', primaryEmail:'contact@fieldstonenaturals.example', industryType:'Food & Beverage', origin:'website', companyStage:'active', priority:'hot', addressCity:'Boulder', addressState:'Colorado', addressCountry:'United States', createdAt:'2024-12-04', assignedTo:'rep-amara', status:'active' },
  { id:111, companyName:'Old Mill Trading House', primaryEmail:'hello@oldmilltrading.example', industryType:'Other', origin:'manual', companyStage:'new', priority:'cold', addressCity:'Leeds', addressState:'England', addressCountry:'United Kingdom', createdAt:'2024-11-28', assignedTo:'rep-noah', status:'inactive', isIrrelevant:true, irrelevantReason:'Outside current ingredient sourcing focus', irrelevantMarkedByName:'Amara Shah', irrelevantMarkedAt:'2024-12-02' },
];
const CONTACTS: Contact[] = [
  { companyId:101,name:'Lena Ortiz',role:'Strategic Sourcing Lead',email:'lena.ortiz@verdantpantry.example',phone:'+1 503 555 0181',primary:true },
  { companyId:101,name:'Dylan Pierce',role:'Quality & Compliance',email:'dylan.pierce@verdantpantry.example',phone:'+1 503 555 0144' },
  { companyId:101,name:'Nia Okafor',role:'Product Development',email:'',phone:'+1 503 555 0192' },
  { companyId:102,name:'Sofia Laurent',role:'Director, Ingredient Sourcing',email:'sofia.laurent@northstarnutrition.example',phone:'+1 416 555 0130',primary:true },
  { companyId:102,name:'Ethan Park',role:'Regulatory Affairs',email:'ethan.park@northstarnutrition.example',phone:'' },
  { companyId:102,name:'Mira Singh',role:'Product Formulation',email:'',phone:'+1 416 555 0182' },
  { companyId:103,name:'Oliver Grant',role:'Procurement Manager',email:'oliver.grant@morrowfield.example',phone:'+44 117 555 0136',primary:true },
  { companyId:103,name:'Amelia Rowe',role:'Co-founder',email:'',phone:'+44 117 555 0190' },
  { companyId:104,name:'Tane Williams',role:'Ingredient Buyer',email:'tane.williams@cedargrove.example',phone:'+64 9 555 0140',primary:true },
  { companyId:104,name:'Priya Reddy',role:'Formulation Scientist',email:'priya.reddy@cedargrove.example',phone:'' },
  { companyId:105,name:'Dr. Elise Weber',role:'Quality Director',email:'elise.weber@asterionpharma.example',phone:'+41 61 555 0162',primary:true },
  { companyId:105,name:'Jonas Frei',role:'Sourcing Specialist',email:'',phone:'+41 61 555 0199' },
  { companyId:106,name:'Maeve Collins',role:'Purchasing',email:'maeve.collins@littleorchard.example',phone:'+1 512 555 0160',primary:true },
  { companyId:106,name:'Jules Bennett',role:'Operations',email:'',phone:'' },
  { companyId:107,name:'Ari Thomas',role:'Partnerships Lead',email:'ari.thomas@bluebirdwellness.example',phone:'+61 3 5550 0131',primary:true },
  { companyId:107,name:'Sienna Wong',role:'Product Quality',email:'sienna.wong@bluebirdwellness.example',phone:'' },
  { companyId:108,name:'Freja Madsen',role:'Supply Chain Manager',email:'freja.madsen@juniperhouse.example',phone:'+45 33 555 0146',primary:true },
  { companyId:108,name:'Emil Sørensen',role:'Product Development',email:'',phone:'+45 33 555 0171' },
  { companyId:109,name:'Ravi Tan',role:'Imports Manager',email:'ravi.tan@solsticeharvest.example',phone:'+65 6555 0172',primary:true },
  { companyId:109,name:'Chloe Lim',role:'Commercial Director',email:'',phone:'' },
  { companyId:110,name:'Sage Miller',role:'Founder & Buyer',email:'sage.miller@fieldstonenaturals.example',phone:'+1 303 555 0143',primary:true },
  { companyId:110,name:'Kai Brooks',role:'Quality Manager',email:'kai.brooks@fieldstonenaturals.example',phone:'+1 303 555 0193' },
  { companyId:111,name:'Arthur Wells',role:'Managing Partner',email:'arthur.wells@oldmilltrading.example',phone:'',primary:true },
];
const dateLabel = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString('en-US', { month:'short', day:'2-digit', year:'numeric' });
const displayRep = (id: string) => { const rep = REPS.find((item) => item.id === id); return rep ? `${rep.firstName} ${rep.lastName}` : 'Unassigned'; };

export function Revised() {
  const [companies, setCompanies] = useState(INITIAL);
  const [selected, setSelected] = useState<number[]>([]);
  const [activeId, setActiveId] = useState(101);
  const [stage, setStage] = useState('all');
  const [query, setQuery] = useState('');
  const [origin, setOrigin] = useState('all');
  const [industry, setIndustry] = useState('all');
  const [country, setCountry] = useState('all');
  const [priority, setPriority] = useState('all');
  const [status, setStatus] = useState('all');
  const [assigned, setAssigned] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [advanced, setAdvanced] = useState(false);
  const [notRelevant, setNotRelevant] = useState(false);
  const [view, setView] = useState<'list'|'kanban'>('list');
  const [perPage, setPerPage] = useState('10');
  const [page, setPage] = useState(1);
  const [menuId, setMenuId] = useState<number|null>(null);
  const [notice, setNotice] = useState('');
  const [dialog, setDialog] = useState<DialogInfo|null>(null);
  const [theme, setTheme] = useState<'light'|'dark'>('light');
  const [navOpen, setNavOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('Company Management');
  const dialogRef = useRef<HTMLElement | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const isModalOpen = !!dialog || navOpen;
    if (!isModalOpen) return;
    const focusFirst = () => {
      const dialogNode = dialogRef.current;
      if (!dialogNode) return;
      const focusable = dialogNode.querySelector<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])');
      focusable?.focus();
    };
    const animationFrame = window.requestAnimationFrame(focusFirst);
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setDialog(null);
        setNavOpen(false);
        setMenuId(null);
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const items = [...dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])')];
      if (!items.length) { event.preventDefault(); dialogRef.current.focus(); return; }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && (document.activeElement === first || !dialogRef.current.contains(document.activeElement))) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialogRef.current.contains(document.activeElement))) {
        event.preventDefault(); first.focus();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      window.cancelAnimationFrame(animationFrame);
      document.removeEventListener('keydown', handleKey);
      if (returnFocusRef.current?.isConnected) window.requestAnimationFrame(() => returnFocusRef.current?.focus());
    };
  }, [dialog, navOpen]);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 4200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const countries = useMemo(() => [...new Set(companies.map((company) => company.addressCountry))].sort(), [companies]);
  const filtered = useMemo(() => companies.filter((company) => {
    const term = query.toLowerCase().trim();
    const matchingContacts = CONTACTS.filter((person) => person.companyId === company.id).map((person) => `${person.name} ${person.email} ${person.role}`).join(' ');
    return (notRelevant ? !!company.isIrrelevant : !company.isIrrelevant)
      && (stage === 'all' || company.companyStage === stage)
      && (!term || `${company.companyName} ${company.primaryEmail} ${company.addressCity} ${matchingContacts}`.toLowerCase().includes(term))
      && (origin === 'all' || company.origin === origin)
      && (industry === 'all' || company.industryType.toLowerCase().includes(industry))
      && (country === 'all' || company.addressCountry === country)
      && (priority === 'all' || company.priority === priority)
      && (status === 'all' || company.status === status)
      && (assigned === 'all' || (assigned === 'unassigned' ? !company.assignedTo : company.assignedTo === assigned))
      && (!from || company.createdAt >= from) && (!to || company.createdAt <= to);
  }), [companies, notRelevant, stage, query, origin, industry, country, priority, status, assigned, from, to]);
  const size = perPage === 'all' ? Math.max(filtered.length, 1) : Number(perPage);
  const pages = Math.max(1, Math.ceil(filtered.length / size));
  const rows = filtered.slice((page - 1) * size, page * size);
  const activeCompany = companies.find((company) => company.id === activeId) || companies[0];
  const activeContacts = CONTACTS.filter((person) => person.companyId === activeCompany?.id);
  const stats = [
    { label:'Company records', value:companies.length, note:'all records' },
    { label:'Website sourced', value:companies.filter((c) => c.origin === 'website').length, note:'inbound' },
    { label:'Assigned', value:companies.filter((c) => c.assignedTo).length, note:'with an owner' },
    { label:'Unassigned', value:companies.filter((c) => !c.assignedTo).length, note:'needs an owner' },
  ];
  const tell = (action: string) => setNotice(`${action}. This is a design preview; no data was sent or saved.`);
  const updateCompany = (id: number, updates: Partial<Company>, label: string) => {
    setCompanies((current) => current.map((company) => company.id === id ? { ...company, ...updates } : company));
    tell(label);
  };
  const selectNav = (label: string) => { setActiveNav(label); setNavOpen(false); if (label !== 'Company Management') tell(`${label} destination`); };
  const openDialog = (info:DialogInfo) => {
    if (document.activeElement instanceof HTMLElement) {
      const active = document.activeElement;
      returnFocusRef.current = active.closest('.cnx-menu-wrap')?.querySelector<HTMLElement>('button[aria-label^="More actions for"]') || active;
    } else {
      returnFocusRef.current = null;
    }
    setDialog(info);
  };
  const toggleNavigation = () => {
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setNavOpen((open) => !open);
  };
  const openAdd = () => openDialog({ title:'Add a company', message:'The full source flow is represented here. Submitting is disabled in this design preview; no company record will be created.', form:true });
  const resetPage = (setter: (value:string) => void, value:string) => { setter(value); setPage(1); };
  const toggleOne = (id:number) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current,id]);
  const toggleAll = () => {
    const ids = rows.map((company) => company.id);
    setSelected((current) => ids.every((id) => current.includes(id)) ? current.filter((id) => !ids.includes(id)) : [...new Set([...current, ...ids])]);
  };
  const showAction = (title:string, message:string) => openDialog({ title, message });
  const topNav = [['Dashboard', LayoutDashboard], ['Sales Management', Activity], ['Company Management', Building2], ['Analytics & Reports', BarChart3]] as const;
  const MenuItem = ({ label, Icon }: { label:string; Icon: typeof LayoutDashboard }) => (
    <button type="button" className={`cnx-rail-btn ${activeNav === label ? 'active' : ''}`} aria-label={label} onClick={() => selectNav(label)}>
      <Icon size={17}/><span className="cnx-rail-label">{label}</span>
    </button>
  );
  const companyMenu = (company:Company) => <div className="cnx-menu" role="menu" aria-label={`${company.companyName} actions`}>
    <strong style={{display:'block',padding:'6px 9px',fontSize:10,color:'var(--muted)'}}>Assign to</strong>
    {REPS.map((rep) => <button role="menuitem" key={rep.id} onClick={() => { updateCompany(company.id,{assignedTo:rep.id},'Owner changed in local preview'); setMenuId(null); }}>{rep.firstName} {rep.lastName}{company.assignedTo === rep.id ? ' · current' : ''}</button>)}
    <hr style={{border:0,borderTop:'1px solid var(--line)',margin:'4px'}}/>
    <button role="menuitem" onClick={() => { updateCompany(company.id,{isIrrelevant:!company.isIrrelevant},'Relevance flag changed in local preview'); setMenuId(null); }}>{company.isIrrelevant ? 'Mark as Relevant' : 'Mark as Not Relevant'}</button>
    <button role="menuitem" onClick={() => { showAction('Delete company?',`Delete Company is preview-only for ${company.companyName}; no record will be removed.`); setMenuId(null); }} style={{color:'var(--urgent)'}}>Delete Company</button>
  </div>;

  return <div className="cnx-workspace" data-theme={theme}>
    <header className="cnx-top">
      <div className="cnx-brand"><span className="cnx-mark"><span>N</span></span><div><strong>CAPE NATUREX</strong><small>Ingredient operations</small></div></div>
      <div className="cnx-top-context"><b>Company workspace</b> <span> / </span> sourcing relationships</div>
      <div className="cnx-top-right">
        <span className="cnx-preview-tag">FICTIONAL DATA · DESIGN PREVIEW</span>
        <button className="cnx-icon-btn" aria-label="Notifications" onClick={() => tell('Notifications opened')}><Activity size={16}/></button>
        <button className="cnx-icon-btn" aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'} onClick={() => setTheme((value) => value === 'light' ? 'dark' : 'light')}>{theme === 'light' ? <Moon size={16}/> : <Sun size={16}/>}</button>
        <div className="cnx-user"><span className="cnx-user-avatar">AS</span><span>Amara Shah</span></div>
      </div>
    </header>
    <div className="cnx-frame">
      <nav className="cnx-rail" aria-label="Primary navigation">
        {topNav.map(([label, Icon]) => <MenuItem key={label} label={label} Icon={Icon}/>)}
        <button className="cnx-rail-btn" aria-label="Open all workspace destinations" aria-expanded={navOpen} onClick={toggleNavigation}><Menu size={17}/><span className="cnx-rail-label">All destinations</span></button>
        <div className="cnx-rail-spacer"/>
      </nav>
      <main className="cnx-body">
        <div className="cnx-layout">
          <section className="cnx-main" aria-label="Company records">
            <div className="cnx-heading">
              <div><div className="cnx-eyebrow">Relationship desk · 11 records</div><h1>Company management</h1><p>Keep sourcing conversations, ownership and contacts in reach.</p></div>
              <div className="cnx-toolbar" aria-label="Company workspace actions">
                <button className={`cnx-btn ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')} aria-pressed={view === 'list'}><List size={14}/> List</button>
                <button className={`cnx-btn ${view === 'kanban' ? 'active' : ''}`} onClick={() => setView('kanban')} aria-pressed={view === 'kanban'}><Kanban size={14}/> Kanban</button>
                <button className="cnx-btn" aria-label="Refresh companies" onClick={() => tell('Refresh')}><RefreshCw size={14}/></button>
                <button className="cnx-btn" onClick={() => tell('Download All')}><Download size={14}/> Download All</button>
                <button className="cnx-btn" onClick={() => tell('Clean Up Countries')}><MapPin size={14}/> Clean Up Countries</button>
                <button className={`cnx-btn ${advanced ? 'active' : ''}`} onClick={() => setAdvanced((value) => !value)} aria-expanded={advanced}><Filter size={14}/> Filters</button>
                <button className="cnx-btn" onClick={() => tell('Bulk Upload')}><Upload size={14}/> Bulk Upload</button>
                <button className="cnx-btn primary" onClick={openAdd}><Plus size={14}/> Add Company</button>
              </div>
            </div>
            <div className="cnx-statline" aria-label="Company summary">
              {stats.map((stat) => <div className="cnx-stat" key={stat.label}><small>{stat.label}</small><strong>{stat.value}</strong><em>{stat.note}</em></div>)}
            </div>
            <div className="cnx-stages" role="tablist" aria-label="Company lifecycle">
              <button className={`cnx-stage-tab ${stage === 'all' ? 'selected' : ''}`} role="tab" aria-selected={stage === 'all'} onClick={() => resetPage(setStage,'all')}>All <small>{companies.filter((c) => notRelevant ? c.isIrrelevant : !c.isIrrelevant).length}</small></button>
              {STAGES.map((item) => <button key={item.id} className={`cnx-stage-tab ${stage === item.id ? 'selected' : ''}`} role="tab" aria-selected={stage === item.id} onClick={() => resetPage(setStage,item.id)}>{item.label}<small>{companies.filter((c) => c.companyStage === item.id && (notRelevant ? c.isIrrelevant : !c.isIrrelevant)).length}</small></button>)}
            </div>
            <div className="cnx-filter-wrap">
              <div className="cnx-search-row">
                <label className="cnx-search"><Search size={15}/><input aria-label="Search companies and contacts" placeholder="Find a company, contact, email or city…" value={query} onChange={(event) => {setQuery(event.target.value);setPage(1)}}/>{query && <button className="cnx-icon-btn" aria-label="Clear search" onClick={() => setQuery('')}><X size={13}/></button>}</label>
                <select className="cnx-select" aria-label="Origin filter" value={origin} onChange={(event) => resetPage(setOrigin,event.target.value)}><option value="all">All Origins</option><option value="website">Website</option><option value="manual">Manual</option><option value="import">Imported</option></select>
                <select className="cnx-select" aria-label="Industry filter" value={industry} onChange={(event) => resetPage(setIndustry,event.target.value)}><option value="all">All Industries</option><option value="food">Food &amp; Beverage</option><option value="pharma">Pharmaceuticals</option><option value="cosmetics">Cosmetics &amp; Personal Care</option><option value="nutraceuticals">Nutraceuticals</option><option value="other">Other</option></select>
                <select className="cnx-select" aria-label="Country filter" value={country} onChange={(event) => resetPage(setCountry,event.target.value)}><option value="all">All Countries</option>{countries.map((name) => <option key={name} value={name}>{name}</option>)}</select>
              </div>
              {advanced && <div className="cnx-filters-extra">
                <select className="cnx-select" aria-label="Priority filter" value={priority} onChange={(event) => resetPage(setPriority,event.target.value)}><option value="all">All Priorities</option><option value="hot">Hot</option><option value="warm">Warm</option><option value="cold">Cold</option></select>
                <select className="cnx-select" aria-label="Status filter" value={status} onChange={(event) => resetPage(setStatus,event.target.value)}><option value="all">All Statuses</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="pending">Pending</option><option value="merged">Merged (Duplicates)</option></select>
                <select className="cnx-select" aria-label="Assigned to filter" value={assigned} onChange={(event) => resetPage(setAssigned,event.target.value)}><option value="all">All Assignments</option><option value="unassigned">Unassigned</option>{REPS.map((rep) => <option key={rep.id} value={rep.id}>{rep.firstName} {rep.lastName}</option>)}</select>
                <label style={{fontSize:10,color:'var(--muted)'}}>Created <input className="cnx-date" type="date" aria-label="From date" value={from} onChange={(event) => resetPage(setFrom,event.target.value)}/></label>
                <span style={{color:'var(--muted)',fontSize:10}}>to</span>
                <input className="cnx-date" type="date" aria-label="To date" value={to} onChange={(event) => resetPage(setTo,event.target.value)}/>
                {(from || to) && <button className="cnx-btn" onClick={() => {setFrom('');setTo('');setPage(1)}}><X size={13}/> Clear dates</button>}
              </div>}
            </div>
            <div className="cnx-list-head">
              <div><strong>{notRelevant ? 'Not relevant companies' : 'Active companies'}</strong> <span>· {filtered.length} matches</span></div>
              <div style={{display:'flex',gap:5}}>
                <button className={`cnx-btn ${!notRelevant ? 'active' : ''}`} onClick={() => {setNotRelevant(false);setPage(1)}}>Active Companies</button>
                <button className={`cnx-btn ${notRelevant ? 'active' : ''}`} onClick={() => {setNotRelevant(true);setPage(1)}}>Not Relevant</button>
              </div>
            </div>
            {selected.length > 0 && <div style={{padding:'8px 10px',background:'#fcf3e2',border:'1px solid #ecd7b7',borderTop:0,display:'flex',gap:6,alignItems:'center',flexWrap:'wrap'}}>
              <b style={{fontSize:10,marginRight:'auto'}}>{selected.length} companies selected</b>
              <select className="cnx-select" aria-label="Bulk assign to" defaultValue="" onChange={(event) => {if(event.target.value){setCompanies((current) => current.map((c) => selected.includes(c.id) ? {...c,assignedTo:event.target.value} : c));tell('Bulk assignment changed in local preview');event.target.value=''}}}><option value="" disabled>Assign to…</option>{REPS.map((rep) => <option key={rep.id} value={rep.id}>{rep.firstName} {rep.lastName}</option>)}</select>
              <button className="cnx-btn" onClick={() => tell('Bulk Email') }><Mail size={13}/> Bulk Email</button>
              <button className="cnx-btn" onClick={() => tell('Request Quality')}><ClipboardCheck size={13}/> Request Quality</button>
              <button className="cnx-btn danger" onClick={() => showAction('Delete selected companies?',`Delete Selected is preview-only for ${selected.length} companies; no records will be removed.`)}><Trash2 size={13}/> Delete Selected</button>
              <button className="cnx-btn quiet" onClick={() => setSelected([])}><X size={13}/> Clear</button>
            </div>}
            {view === 'list' && <div className="cnx-table-wrap">
              <table className="cnx-table">
                <thead><tr>{notRelevant ? <>
                  <th>Company</th><th>Reason</th><th>Flagged by</th><th>Flagged date</th><th>Assigned rep</th><th>Action</th>
                </> : <>
                  <th><input aria-label="Select all companies on this page" type="checkbox" checked={rows.length > 0 && rows.every((c) => selected.includes(c.id))} onChange={toggleAll}/></th>
                  <th>Company</th><th>Origin</th><th>Lifecycle</th><th>Priority</th><th>Location</th><th>Date added</th><th>Assigned to</th><th>Actions</th>
                </>}</tr></thead>
                <tbody>{rows.map((company) => <tr key={company.id} className={`${selected.includes(company.id) ? 'is-selected' : ''} ${activeCompany?.id === company.id ? 'is-current' : ''}`} onClick={() => setActiveId(company.id)} onKeyDown={(event) => {if(event.key === 'Enter')setActiveId(company.id)}} tabIndex={0}>
                  {notRelevant ? <>
                    <td><div className="cnx-company"><span className="cnx-company-mark"><Building2 size={15}/></span><span><b>{company.companyName}</b><small>{company.primaryEmail}</small></span></div></td>
                    <td style={{fontStyle:'italic',color:'var(--muted)',maxWidth:200}}>{company.irrelevantReason || '—'}</td>
                    <td>{company.irrelevantMarkedByName || '—'}</td>
                    <td>{company.irrelevantMarkedAt ? dateLabel(company.irrelevantMarkedAt) : '—'}</td>
                    <td>{displayRep(company.assignedTo)}</td>
                    <td onClick={(event) => event.stopPropagation()}><button className="cnx-mini" onClick={() => updateCompany(company.id,{isIrrelevant:false},'Restore company in local preview')}><CheckCircle2 size={13}/> Restore</button></td>
                  </> : <>
                    <td onClick={(event) => event.stopPropagation()}><input aria-label={`Select ${company.companyName}`} type="checkbox" checked={selected.includes(company.id)} onChange={() => toggleOne(company.id)}/></td>
                    <td><div className="cnx-company"><span className="cnx-company-mark"><Building2 size={15}/></span><span><b>{company.companyName}</b><small>{company.primaryEmail}</small><span className="cnx-subtag">{company.industryType}</span></span></div></td>
                    <td><span className="cnx-pill">{company.origin === 'website' ? 'Website' : company.origin === 'import' ? 'Imported' : 'Manual'}</span></td>
                    <td><span className={`cnx-pill stage-${company.companyStage}`}>{STAGES.find((item) => item.id === company.companyStage)?.label}</span></td>
                    <td><span className={`cnx-pill ${company.priority}`}>{company.priority}</span></td>
                    <td>{company.addressCity}, {company.addressState || company.addressCountry}</td>
                    <td>{dateLabel(company.createdAt)}</td>
                    <td>{displayRep(company.assignedTo)}</td>
                    <td onClick={(event) => event.stopPropagation()}><div className="cnx-row-actions">
                    <button className="cnx-mini" onClick={() => setActiveId(company.id)}>View</button>
                    <div className="cnx-menu-wrap"><button className="cnx-mini" aria-label={`More actions for ${company.companyName}`} aria-expanded={menuId === company.id} onClick={() => setMenuId((id) => id === company.id ? null : company.id)}><MoreHorizontal size={16}/></button>{menuId === company.id && companyMenu(company)}</div>
                  </div></td>
                  </>}
                </tr>)}
                {rows.length === 0 && <tr><td colSpan={notRelevant ? 6 : 9}><div className="cnx-empty"><Search size={19} style={{margin:'0 auto 8px'}}/><b>No companies match this view.</b><br/>Adjust the search or filters to widen your results.</div></td></tr>}
                </tbody>
              </table>
              <div className="cnx-pagination">
                <label>Companies per page&nbsp; <select className="cnx-select" aria-label="Companies per page" value={perPage} onChange={(event) => {setPerPage(event.target.value);setPage(1)}}><option value="10">10</option><option value="25">25</option><option value="50">50</option><option value="100">100</option><option value="all">All</option></select></label>
                <span>Showing {filtered.length ? (page - 1) * size + 1 : 0}–{Math.min(page * size,filtered.length)} of {filtered.length} companies</span>
                <div className="cnx-pager">
                  <button className="cnx-btn" disabled={page === 1} onClick={() => setPage(1)}>First</button><button className="cnx-btn" disabled={page === 1} onClick={() => setPage((current) => Math.max(1,current - 1))}>Previous</button>
                  <b style={{fontSize:10,padding:'0 3px'}}>Page {page} of {pages}</b>
                  <button className="cnx-btn" disabled={page === pages} onClick={() => setPage((current) => Math.min(pages,current + 1))}>Next</button><button className="cnx-btn" disabled={page === pages} onClick={() => setPage(pages)}>Last</button>
                </div>
              </div>
            </div>}
            {view === 'kanban' && <div className="cnx-kanban">
              {STAGES.map((item) => <section className="cnx-kanban-column" key={item.id}><h3>{item.label}<span>{filtered.filter((company) => company.companyStage === item.id).length}</span></h3>
                {filtered.filter((company) => company.companyStage === item.id).map((company) => <article className="cnx-kanban-card" key={company.id} onClick={() => setActiveId(company.id)} tabIndex={0} onKeyDown={(event) => {if(event.key === 'Enter')setActiveId(company.id)}}><b>{company.companyName}</b><small>{company.addressCity}, {company.addressCountry}</small><div style={{display:'flex',justifyContent:'space-between'}}><span className={`cnx-pill ${company.priority}`}>{company.priority}</span><small>{displayRep(company.assignedTo)}</small></div></article>)}
              </section>)}
            </div>}
            <footer style={{fontSize:9,color:'var(--muted)',padding:'10px 2px'}}>Sample data / design preview · fictional company records · all controls are local-only</footer>
          </section>
          <aside className="cnx-desk" aria-label="Selected company and contact details">
            <div className="cnx-desk-head"><label>Company &amp; people desk</label><h2>{activeCompany?.companyName || 'Choose a company'}</h2><p>{activeCompany?.industryType} · {activeCompany?.addressCity}, {activeCompany?.addressCountry}</p></div>
            {activeCompany && <div className="cnx-desk-body">
              <div className="cnx-desk-actions">
                <button className="cnx-btn" onClick={() => showAction('Company record',`${activeCompany.companyName} detail view is preview-only.`)}><Building2 size={13}/> View</button>
                <button className="cnx-btn" onClick={() => tell(`Email ${activeCompany.primaryEmail}`)}><Mail size={13}/> Email</button>
              </div>
              <div className="cnx-detail-section"><h3>Company record</h3><div className="cnx-detail-grid">
                <div><span>Primary inbox</span><b>{activeCompany.primaryEmail || 'Not provided'}</b></div>
                <div><span>Lifecycle</span><b>{STAGES.find((item) => item.id === activeCompany.companyStage)?.label}</b></div>
                <div><span>Priority</span><b>{activeCompany.priority}</b></div>
                <div><span>Record status</span><b>{activeCompany.status}</b></div>
                <div><span>Assigned owner</span><b>{displayRep(activeCompany.assignedTo)}</b></div>
                <div><span>Added</span><b>{dateLabel(activeCompany.createdAt)}</b></div>
                <div><span>Origin</span><b>{activeCompany.origin === 'import' ? 'Imported' : activeCompany.origin}</b></div>
                <div><span>Location</span><b>{activeCompany.addressCity}, {activeCompany.addressCountry}</b></div>
              </div></div>
              <div className="cnx-detail-section"><h3>People · {activeContacts.length} contacts</h3>
                {activeContacts.map((person) => <article className="cnx-contact" key={`${person.companyId}-${person.name}`}>
                  <div className="cnx-contact-top"><span className="cnx-contact-avatar">{person.name.split(' ').map((part) => part[0]).slice(0,2).join('')}</span><div><b>{person.name}</b><small>{person.role}</small></div></div>
                  <p className="cnx-contact-email">{person.email || 'No email on file'}{person.primary ? ' · primary contact' : ''}</p>
                  <div className="cnx-contact-meta"><i>{person.phone || 'No phone on file'}</i>{person.primary && <i>Primary</i>}</div>
                </article>)}
              </div>
              <div className="cnx-detail-section"><h3>Preview boundary</h3><p style={{margin:0,fontSize:10,color:'var(--muted)'}}>Contact actions and company changes are not sent or persisted in this workspace mockup.</p></div>
            </div>}
          </aside>
        </div>
      </main>
    </div>
    <div className="cnx-bottom-dock" aria-label="Quick workspace tools">
      <button onClick={() => selectNav('System Settings')}><Settings2 size={13}/>System Settings</button>
      <button onClick={() => tell('Back to Website destination')}><Globe2 size={13}/>Back to Website</button>
      <button onClick={() => tell('Log out action')}><LogOut size={13}/>Log out</button>
    </div>
    <nav className="cnx-mobile-nav" aria-label="Mobile navigation">
      <button onClick={() => selectNav('Dashboard')}><LayoutDashboard size={15}/>Home</button><button onClick={() => selectNav('Company Management')}><Building2 size={15}/>Companies</button>
      <button onClick={toggleNavigation} aria-expanded={navOpen}><Menu size={15}/>More</button>
    </nav>
    {navOpen && <div className="cnx-modal-backdrop" onMouseDown={(event) => {if(event.target === event.currentTarget)setNavOpen(false)}}>
      <section className="cnx-modal" role="dialog" aria-modal="true" aria-label="All destinations" ref={dialogRef} tabIndex={-1}>
      <h2>Workspace destinations</h2><div style={{maxHeight:'60vh',overflow:'auto'}}>
        <button className="cnx-btn" onClick={() => {tell('Back to Website destination');setNavOpen(false)}}>Back to Website</button>
        {NAV_GROUPS.map((group) => <div key={group.title}><div className="cnx-eyebrow" style={{marginTop:13}}>{group.title}</div>{group.items.map(([label]) => <button className="cnx-btn" style={{margin:'5px 4px 0 0'}} key={label} onClick={() => selectNav(label)}>{label}</button>)}</div>)}
        <button className="cnx-btn" style={{marginTop:9}} onClick={() => {tell('Log out action');setNavOpen(false)}}><LogOut size={13}/>Log out</button>
      </div><div className="cnx-modal-foot"><button className="cnx-btn" onClick={() => setNavOpen(false)}>Close</button></div>
      </section>
    </div>}
    {dialog && <div className="cnx-modal-backdrop" onMouseDown={(event) => {if(event.target === event.currentTarget)setDialog(null)}}>
      <section className="cnx-modal" role="dialog" aria-modal="true" aria-labelledby="cnx-dialog-title" ref={dialogRef} tabIndex={-1}>
        <h2 id="cnx-dialog-title">{dialog.title}</h2><p>{dialog.message}</p>
        {dialog.form && <form className="cnx-form" onSubmit={(event) => {event.preventDefault();setDialog(null);tell('Add Company submitted for design-preview review; no record was created')}}>
          <label>Company name<input required placeholder="e.g. Coastal Botanica Group"/></label>
          <label>Primary email<input type="email" placeholder="name@company.example"/></label>
          <label>Industry<select defaultValue=""><option value="" disabled>Select industry</option><option>Food &amp; Beverage</option><option>Pharmaceuticals</option><option>Cosmetics &amp; Personal Care</option><option>Nutraceuticals</option><option>Other</option></select></label>
          <div className="cnx-modal-foot"><button type="button" className="cnx-btn" onClick={() => setDialog(null)}>Cancel</button><button type="submit" className="cnx-btn primary">Preview submission</button></div>
        </form>}
        {!dialog.form && <div className="cnx-modal-foot"><button className="cnx-btn primary" onClick={() => setDialog(null)}>Understood</button></div>}
      </section>
    </div>}
    {notice && <div className="cnx-notice" role="status" aria-live="polite"><div><b>Preview only</b><p>{notice}</p></div><button aria-label="Dismiss message" onClick={() => setNotice('')}><X size={14}/></button></div>}
  </div>;
}

export default Revised;
