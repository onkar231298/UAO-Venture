// Authenticated role-by-role browser smoke checks. Only creates its own test user.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const {spawn} = require('node:child_process');
const {Client} = require('pg');
const bcrypt = require('bcryptjs');
const WebSocket = require('ws');
const origin = process.env.TEST_APP_ORIGIN || 'http://127.0.0.1:5000';
const out = process.env.TEST_OUTPUT_DIR || '/tmp/portal-redesign-check';
const before = process.argv.includes('--baseline');
const sleep = ms => new Promise(r=>setTimeout(r,ms));
const userId = 'portal_check_'+crypto.randomBytes(8).toString('hex');
const ownedUserIds = [userId];
const email = userId+'@example.invalid';
const password = crypto.randomBytes(24).toString('hex');
const profile = fs.mkdtempSync(path.join(os.tmpdir(),'portal-browser-'));
const db = new Client({connectionString:process.env.DATABASE_URL});
let browser,socket,seq=0;
const pending = new Map();
const errors = [];
async function command(method,params={}) {
  return new Promise((resolve,reject)=>{
    const id=++seq;
    const timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP timed out: '+method+' '+(params.expression||'').slice(0,160)))},20000);
    pending.set(id,{resolve:r=>{clearTimeout(timer);resolve(r)},reject:e=>{clearTimeout(timer);reject(e)}});
    socket.send(JSON.stringify({id,method,params}));
  });
}
async function evaluate(expression) {
  const r=await command('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
  if(r.exceptionDetails) throw Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r.result.value;
}
async function until(expression,label) {
  for(let i=0;i<140;i++){if(await evaluate(expression)) return;await sleep(250)}
  await shot('failure');
  const state=await evaluate("({path:location.pathname,text:document.body.innerText.slice(0,1500)})");
  throw Error('Timed out: '+label+' '+JSON.stringify(state)+' '+errors.join('; '));
}
async function navigate(route) {
  await command('Page.navigate',{url:origin+route});
  await until("document.readyState==='complete'",'document '+route);
}
async function shot(name) {
  // Capture the settled palette rather than a light/dark CSS-transition frame.
  await sleep(250);
  const r=await command('Page.captureScreenshot',{format:'jpeg',quality:70});
  fs.writeFileSync(path.join(out,name+'.jpg'),Buffer.from(r.data,'base64'));
}
async function clickText(scope,text) {
  return evaluate(`(() => {const b=[...document.querySelectorAll(${JSON.stringify(scope)})].find(n=>n.textContent.trim()===${JSON.stringify(text)});
    if(!b)return false;b.click();return true})()`);
}
async function checkMobile(role,options) {
  await command('Emulation.setDeviceMetricsOverride',{width:820,height:1180,deviceScaleFactor:1,mobile:false});
  await sleep(100);
  await shot(role+'-tablet');
  const tabletOverflow=await evaluate('document.documentElement.scrollWidth>innerWidth');
  const clippedHeaderButtons=await evaluate("[...document.querySelectorAll('header button')].filter(b=>{const r=b.getBoundingClientRect();return r.width>0&&(r.right>innerWidth+1||r.left<0)}).map(b=>b.textContent.trim()||b.getAttribute('aria-label'))");
  if(clippedHeaderButtons.length)throw Error('Clipped tablet toolbar options '+role+': '+clippedHeaderButtons.join(', '));
  await command('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await until("!!document.querySelector('.bfo-mobile-dock')",'mobile dock '+role);
  const count=await evaluate("document.querySelector('.bfo-mobile-dock').children.length");
  if(count>5)throw Error('Too many bottom destinations '+role);
  await clickText('.bfo-mobile-dock button','More');
  await until("!!document.querySelector('.bfo-more-sheet')",'More '+role);
  const all=await evaluate("document.querySelector('.bfo-more-sheet').textContent");
  const missing=options.filter(o=>!all.includes(o));
  if(missing.length)throw Error(role+' More missing '+missing.join(', '));
  const groups=await evaluate("document.querySelectorAll('.bfo-more-sheet .bfo-nav-tree-group > summary').length");
  if(!groups)throw Error('More lost navigation groups '+role);
  const trapped=await evaluate("document.querySelector('.bfo-more-sheet').contains(document.activeElement)");
  if(!trapped)throw Error('More did not receive keyboard focus '+role);
  await shot(role+'-mobile-more');
  await command('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  await command('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  await until("!document.querySelector('.bfo-more-sheet')",'Escape closes More '+role);
  await command('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  return {destinations:count,allOptionsInMore:true,focusTrapped:trapped,escapeClosed:true,tabletOverflow};
}
async function checkAppearance(role) {
  const admin=role==='super_admin'||role==='admin';
  const sales=role.startsWith('sales');
  const route=admin?'/admin?section=settings':sales?'/sales/appearance':role.startsWith('quality')?'/quality/dashboard?section=profile-settings':'/staff?section=settings';
  async function openSettings() {
    await navigate(route);
    if(admin) {
      await until("!!document.querySelector('[data-testid=\"tab-appearance\"]')",'appearance tab');
      await evaluate("document.querySelector('[data-testid=\"tab-appearance\"]').dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}))");
    }
    await until("!!document.querySelector('[data-testid=\"appearance-settings\"]')",'appearance settings '+role);
  }
  await openSettings();
  if(admin && !await evaluate("!!document.querySelector('[data-testid=\"tab-email\"]')&&!!document.querySelector('[data-testid=\"tab-documents\"]')"))
    throw Error('Existing system settings tabs missing');
  if(sales && !await evaluate("[...document.querySelectorAll('aside nav a,aside nav button')].some(n=>n.textContent.trim()==='Email Settings')"))
    throw Error('Existing Sales Email Settings missing');
  let combinations=0;
  for(const palette of ['navy-amber','ocean-teal','forest-sage','plum-gold']) for(const mode of ['light','dark']) {
    await evaluate(`document.querySelector('[data-testid="theme-palette-${palette}"]').click();document.querySelector('[data-testid="appearance-mode-${mode}"]').click()`);
    await until(`document.querySelector('.bfo-portal-root')?.dataset.portalPalette==='${palette}'&&document.body.dataset.portalTheme==='${mode}'`,'palette '+palette+'/'+mode);
    await sleep(200);
    const colours=await evaluate(`(async()=>{
      const {PORTAL_PALETTES}=await import('/src/components/portal/portalPalettes.ts');
      const palette=PORTAL_PALETTES.find(p=>p.id===${JSON.stringify(palette)});
      const root=document.querySelector('.bfo-portal-root'),rail=document.querySelector('.bfo-workspace-rail'),header=document.querySelector('header');
      function rgb(value){const el=document.createElement('i');el.style.color=value;document.body.append(el);const c=getComputedStyle(el).color;el.remove();return c;}
      return {root:getComputedStyle(root).backgroundColor===rgb(palette[${JSON.stringify(mode)}].bg),
        rail:!!rail&&getComputedStyle(rail).backgroundColor===rgb(palette.sidebar),
        header:!!header&&getComputedStyle(header).backgroundColor===rgb(palette.sidebar),
        heading:getComputedStyle(document.querySelector('.portal-appearance h2')).color===rgb(palette[${JSON.stringify(mode)}].text),
        description:getComputedStyle(document.querySelector('.portal-appearance__heading p')).color===rgb(palette[${JSON.stringify(mode)}].muted),
        cards:getComputedStyle(document.querySelector('.portal-appearance__palette[aria-checked="false"]')).backgroundColor===rgb(palette[${JSON.stringify(mode)}].panel),
        body:getComputedStyle(document.body).getPropertyValue('--bfo-sidebar').trim()===palette.sidebar,
        radio:document.querySelector('[data-testid="theme-palette-${palette}"]').getAttribute('aria-checked')==='true'};
    })()`);
    if(Object.values(colours).some(v=>!v))throw Error('Incomplete palette application '+palette+'/'+mode+': '+JSON.stringify(colours));
    combinations++;
  }
  await shot(role+'-appearance-plum-dark');
  await evaluate("document.querySelector('[data-testid=\"theme-palette-ocean-teal\"]').click();document.querySelector('[data-testid=\"appearance-mode-light\"]').click()");
  await shot(role+'-appearance-ocean-light');
  await command('Page.reload',{ignoreCache:true});
  await until("document.body.dataset.portalPalette==='ocean-teal'&&document.body.dataset.portalTheme==='light'",'account preference persists');
  await openSettings();
  await evaluate("document.querySelector('[data-testid=\"theme-palette-ocean-teal\"]').focus()");
  await command('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowRight',code:'ArrowRight'});
  await command('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowRight',code:'ArrowRight'});
  await until("document.body.dataset.portalPalette==='forest-sage'",'keyboard radio selection');
  await evaluate("document.querySelector('[data-testid=\"theme-palette-ocean-teal\"]').click();document.querySelector('[data-testid=\"appearance-mode-dark\"]').click()");
  await command('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  if(await evaluate('document.documentElement.scrollWidth>innerWidth'))throw Error('Mobile appearance overflows');
  await shot(role+'-appearance-mobile');
  await command('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  if(sales) {
    await navigate('/sales/my-companies');
    await until("!!document.querySelector('.bfo-sales-portal')&&!!document.querySelector('main input')",'themed company form');
    const inputs=await evaluate("getComputedStyle(document.querySelector('main input')).backgroundColor");
    if(inputs!=='rgb(19, 48, 57)')throw Error('Company inputs did not adopt dark Ocean palette: '+inputs);
    await shot(role+'-appearance-companies');
    const otherId=userId+'_other';ownedUserIds.push(otherId);
    await db.query(`INSERT INTO users(id,email,password,role,user_type,account_status,is_active,first_name,last_name)
      VALUES($1,$2,$3,'sales_executive','staff','active',true,'Other','Verification')`,[otherId,otherId+'@example.invalid',bcrypt.hashSync(password,10)]);
    async function loginAs(address) {
      await navigate('/login');
      await evaluate("fetch('/api/logout',{credentials:'include'}).then(r=>r.status)");
      const status=await evaluate(`fetch('/admin/login',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
        body:new URLSearchParams(${JSON.stringify({email:address,password})}).toString()}).then(r=>r.status)`);
      if(status!==200)throw Error('Appearance account switch login failed');
      await openSettings();
    }
    await loginAs(otherId+'@example.invalid');
    if(!await evaluate("document.body.dataset.portalPalette==='navy-amber'"))throw Error('Another user inherited palette');
    await evaluate("document.querySelector('[data-testid=\"theme-palette-forest-sage\"]').click()");
    await loginAs(email);
    if(!await evaluate("document.body.dataset.portalPalette==='ocean-teal'&&document.body.dataset.portalTheme==='dark'"))throw Error('Account preferences contaminated');
  }
  await navigate('/');
  await until("!document.body.classList.contains('bfo-portal-active')",'public theme cleanup');
  if(await evaluate("!!document.body.dataset.portalPalette||!!document.body.style.getPropertyValue('--bfo-sidebar')"))throw Error('Personal colours leaked onto public site');
  return {combinations,persistedAcrossReload:true,keyboardSelection:true,mobileOverflow:false,accountIsolation:sales?'two real accounts':'covered by Sales test',publicSiteUnchanged:true};
}
async function checkTheme(role) {
  if(await evaluate("document.body.dataset.portalTheme==='light'"))
    await evaluate("document.querySelector('.bfo-theme-toggle').click()");
  await until("document.body?.dataset.portalTheme==='dark' && !!document.querySelector('.bfo-theme-toggle')",'initial dark theme '+role);
  await evaluate("document.querySelector('.bfo-theme-toggle').click()");
  await until("document.body?.dataset.portalTheme==='light'",'light theme '+role);
  await shot(role+'-light');
  await command('Page.reload',{ignoreCache:true});
  await until("document.body?.dataset.portalTheme==='light' && !!document.querySelector('.bfo-theme-toggle')",'persisted theme '+role);
  await evaluate("document.querySelector('.bfo-theme-toggle').click()");
  await until("document.body?.dataset.portalTheme==='dark'",'dark theme '+role);
  return {lightAndDark:true,persistedAcrossReload:true};
}
async function checkShortcuts(role) {
  const admin=role==='super_admin';
  const sales=role==='sales_executive';
  const base=admin?'/admin':sales?'/sales':role==='customer'?'/customer/dashboard':'/quality/dashboard';
  await navigate(base);
  await until("!!document.querySelector('.bfo-portal-root')",'workspace '+role);
  const duplicateControls=await evaluate("document.querySelectorAll('.bfo-global-search,.bfo-create-trigger').length");
  if(duplicateControls)throw Error('Duplicated header controls remain '+role);
  const result={noDuplicateHeaderControls:true};
  await evaluate("document.querySelector('[data-testid=\"button-toggle-sidebar\"]').click()");
  await until("document.querySelector('.bfo-portal-root').dataset.sidebarExpanded==='true'",'expanded sidebar '+role);
  await until("document.querySelector('.bfo-workspace-rail').getBoundingClientRect().width>=240",'sidebar expansion animation '+role);
  const toggleState=await evaluate("(() => {const b=document.querySelector('[data-testid=\"button-toggle-sidebar\"]');const r=b.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,width:r.width,height:r.height,viewport:innerHeight,visible:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('button')===b}})()");
  if(!toggleState.visible)throw Error('Sidebar toggle not visibly clickable '+role+': '+JSON.stringify(toggleState));
  const railWidth=await evaluate("document.querySelector('.bfo-workspace-rail').getBoundingClientRect().width");
  if(railWidth<230)throw Error('Sidebar did not expand '+role+' '+JSON.stringify(await evaluate("({width:document.querySelector('.bfo-workspace-rail').getBoundingClientRect().width,display:getComputedStyle(document.querySelector('.bfo-workspace-rail')).display,viewport:innerWidth,roots:[...document.querySelectorAll('.bfo-portal-root')].map(r=>({name:r.className,expanded:r.dataset.sidebarExpanded}))})")));
  await shot(role+'-expanded-sidebar');
  await command('Page.reload',{ignoreCache:true});
  await until("document.querySelector('.bfo-portal-root')?.dataset.sidebarExpanded==='true'",'persisted sidebar '+role);
  await evaluate("document.querySelector('[data-testid=\"button-toggle-sidebar\"]').click()");
  await until("document.querySelector('.bfo-portal-root').dataset.sidebarExpanded==='false'",'collapsed sidebar '+role);
  result.sidebarExpandCollapseAndPersistence=true;
  if(admin || sales) {
    await navigate(admin?'/admin/dashboard/crm/companies':'/sales/my-companies');
    await until("!!document.querySelector('[data-testid=\"company-context-desk\"]')",'company desk '+role);
    const searches=await evaluate("document.querySelectorAll('main input[placeholder^=\"Search companies\"]').length");
    if(searches!==1)throw Error('Expected one original company search '+role+': '+searches);
    result.originalCompanySearchRetained=true;
    await until("!document.querySelector('[data-testid=\"company-context-desk\"]').textContent.includes('Loading people')",'company contacts '+role);
    result.companyDesk=true;
    const widthBefore=await evaluate("document.querySelector('.crm-company-workspace__main').getBoundingClientRect().width");
    await evaluate("document.querySelector('[data-testid=\"button-toggle-company-desk\"]').click()");
    await until("!document.querySelector('[data-testid=\"company-context-desk\"]')",'hidden company desk '+role);
    const widthAfter=await evaluate("document.querySelector('.crm-company-workspace__main').getBoundingClientRect().width");
    if(widthAfter<widthBefore+200)throw Error('Hiding desk did not reclaim table space '+role);
    await evaluate("document.querySelector('[data-testid=\"button-toggle-company-desk\"]').click()");
    await until("!!document.querySelector('[data-testid=\"company-context-desk\"]')",'restored company desk '+role);
    result.hideDeskReclaimsTableWidth=true;
    await shot(role+'-company-workspace');
  }
  if(sales) {
    await navigate('/sales');
    await until("!!document.querySelector('[aria-label=\"Open Today panel\"]') || [...document.querySelectorAll('button')].some(n=>n.textContent.trim()==='Today')",'Today control');
    await clickText('button','Today');
    await until("!!document.querySelector('.bfo-today-panel')",'Today panel');
    await until("!document.querySelector('.bfo-today-panel').textContent.includes('Loading follow-ups')",'Today loaded');
    result.todayRealDataPanel=true;
    await command('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
    await command('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
    await until("!document.querySelector('.bfo-today-panel')",'Today Escape');
  }
  await navigate(base);
  await until("!!document.querySelector('nav')",'return to workspace '+role);
  return result;
}
async function visitNavModules() {
  const expandedBefore=await evaluate("document.querySelector('.bfo-portal-root').dataset.sidebarExpanded==='true'");
  if(!expandedBefore)await evaluate("document.querySelector('[data-testid=\"button-toggle-sidebar\"]').click()");
  // Read-only section changes; never invoke record actions, logout or website links.
  await clickText('aside nav button','Sales Management');
  const labels=await evaluate("[...document.querySelectorAll('aside nav button:not(.bfo-nav-group-toggle)')].map(n=>n.textContent.trim()).filter(Boolean)");
  const visited=[];
  for(const label of labels) {
    if(/Log.?out|Back to Website|Internal Chat/.test(label))continue;
    if(!await clickText('aside nav button:not(.bfo-nav-group-toggle)',label))throw Error('Lost navigation '+label);
    await sleep(220);
    const content=await evaluate("document.querySelector('main')?.innerText || ''");
    if(content.length<10)throw Error('Empty module '+label);
    visited.push({label,rendered:true,preExistingPlaceholder:/coming soon/i.test(content)});
  }
  if(!expandedBefore)await evaluate("document.querySelector('[data-testid=\"button-toggle-sidebar\"]').click()");
  return visited;
}
async function checkNestedNavigation() {
  await navigate('/admin?section=overview');
  await until("!!document.querySelector('.bfo-sidebar-branch')",'Sales branch');
  await evaluate("document.querySelector('[data-testid=\"button-toggle-sidebar\"]').click()");
  await until("document.querySelector('.bfo-portal-root').dataset.sidebarExpanded==='true'",'expanded hierarchical sidebar');
  const children=['Customer Inquiries','Sample Requests','High Volume Bids','Quote Negotiations','Sales Orders','Lead Management','Company Management','Duplicate Review'];
  await evaluate("document.querySelector('.bfo-sidebar-branch .bfo-branch-toggle').click()");
  await until("document.querySelector('.bfo-sidebar-branch__children')?.hidden===false",'independent Sales submenu expansion');
  const shown=await evaluate("document.querySelector('.bfo-sidebar-branch__children').textContent");
  if(children.some(label=>!shown.includes(label)))throw Error('Sales submenu lost destinations');
  const noNavigation=await evaluate("new URLSearchParams(location.search).get('section')==='overview' && document.querySelector('header h1')?.textContent.trim()==='Dashboard'");
  if(!noNavigation)throw Error('Expanding Sales changed the page');
  await shot('admin-nested-sidebar');
  await evaluate("document.querySelector('.bfo-sidebar-branch .bfo-branch-toggle').click()");
  await until("getComputedStyle(document.querySelector('.bfo-sidebar-branch__children')).display==='none'",'Sales submenu collapse');
  await clickText('aside nav button','Sales Management');
  await until("document.querySelector('.bfo-sidebar-branch__children')?.hidden===false",'active Sales ancestor auto-expansion');
  await evaluate("[...document.querySelectorAll('.bfo-nav-group-toggle')].find(b=>b.textContent.trim()==='OPERATIONS').click()");
  await evaluate("document.querySelector('.bfo-desktop-destinations button').click()");
  await until("!!document.querySelector('.bfo-more-sheet')",'desktop full hierarchy');
  await evaluate("document.querySelector('.bfo-more-sheet [data-nav-key=\"company-management\"]').click()");
  await until("location.pathname.includes('/crm/companies') && !!document.querySelector('[data-testid=\"company-context-desk\"]')",'nested company navigation');
  const revealed=await evaluate("(() => {const b=[...document.querySelectorAll('.bfo-nav-group-toggle')].find(n=>n.textContent.trim()==='OPERATIONS');return b?.getAttribute('aria-expanded')==='true' && !b.nextElementSibling.hidden && !document.querySelector('.bfo-sidebar-branch__children').hidden})()");
  if(!revealed)throw Error('Active company ancestor stayed collapsed');
  await clickText('aside nav button','System Settings');
  await until("document.querySelector('aside nav button[aria-current=\"page\"]')?.textContent.includes('System Settings')",'active System Settings item');
  const activeSidebar=await evaluate(`(() => {
    const button=[...document.querySelectorAll('aside nav button[aria-current="page"]')].find(node=>node.textContent.includes('System Settings'));
    if(!button)return null;
    const style=getComputedStyle(button),rail=getComputedStyle(document.querySelector('.bfo-workspace-rail'));
    const rgb=value=>value.match(/[\\d.]+/g).slice(0,3).map(Number);
    const luminance=value=>rgb(value).map(channel=>{channel/=255;return channel<=.04045?channel/12.92:((channel+.055)/1.055)**2.4}).reduce((sum,channel,index)=>sum+channel*[.2126,.7152,.0722][index],0);
    const foreground=luminance(style.color),background=luminance(style.backgroundColor);
    const contrast=(Math.max(foreground,background)+.05)/(Math.min(foreground,background)+.05);
    return {contrast,background:style.backgroundColor,rail:rail.backgroundColor,transition:style.transitionDuration,shadow:style.boxShadow,visible:button.getBoundingClientRect().width>0&&button.getBoundingClientRect().height>0};
  })()`);
  if(!activeSidebar||activeSidebar.contrast<4.5||activeSidebar.background===activeSidebar.rail||
    activeSidebar.transition!=='0s'||!activeSidebar.shadow||!activeSidebar.visible) {
    throw Error('Selected sidebar destination is not immediately distinct and readable: '+JSON.stringify(activeSidebar));
  }
  await navigate('/admin/dashboard/crm/companies');
  await until("!!document.querySelector('[data-testid=\"company-context-desk\"]')",'restore company page after active-state check');
  await evaluate("document.querySelector('[data-testid=\"button-toggle-sidebar\"]').click()");
  await until("document.querySelector('.bfo-portal-root').dataset.sidebarExpanded==='false'",'compact hierarchy');
  await evaluate("document.querySelector('.bfo-sidebar-branch .bfo-branch-toggle').click()");
  await until("!!document.querySelector('.bfo-submenu-popover')",'compact Sales flyout');
  const compactText=await evaluate("document.querySelector('.bfo-submenu-popover').textContent");
  if(children.some(label=>!compactText.includes(label)))throw Error('Compact flyout lost Sales options');
  await shot('admin-compact-sales-submenu');
  await command('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  await command('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  await until("!document.querySelector('.bfo-submenu-popover')",'compact flyout Escape');
  await command('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await clickText('.bfo-mobile-dock button','More');
  await until("!!document.querySelector('.bfo-nav-tree-branch')",'mobile nested destinations');
  const mobile=await evaluate("(() => {const leaf=document.querySelector('.bfo-more-sheet [data-nav-key=\"company-management\"]');const branch=leaf?.closest('.bfo-nav-tree-branch');return {parent:branch?.querySelector('summary button')?.textContent.trim(),open:branch?.open,current:leaf?.getAttribute('aria-current'),duplicates:document.querySelectorAll('.bfo-more-sheet [data-nav-key=\"company-management\"]').length}})()");
  if(mobile.parent!=='Sales Management'||!mobile.open||mobile.current!=='page'||mobile.duplicates!==1)throw Error('Incorrect mobile hierarchy: '+JSON.stringify(mobile));
  await shot('admin-mobile-nested-sales');
  await evaluate("document.querySelector('.bfo-more-sheet [data-nav-key=\"enquiry-sample\"]').click()");
  await until("!document.querySelector('.bfo-more-sheet')",'mobile child selection closes menu');
  await command('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await navigate('/admin');
  return {allEightSalesChildren:true,independentDisclosure:true,pageLinkPreserved:true,activeAncestorsReveal:true,compactFlyout:true,mobileHierarchy:true};
}
const departmental = {
  purchase_manager:['Purchase Management','Analytics & Reports'],purchase_executive:['Purchase Management'],
  inventory_manager:['Inventory Management','Analytics & Reports'],inventory_executive:['Inventory Management'],
  logistics_manager:['Logistics Management','Analytics & Reports'],logistics_executive:['Logistics Management'],
  accounts_manager:['Accounts & Finance','Analytics & Reports'],accounts_executive:['Accounts & Finance'],
  seo_manager:['Website Management','Analytics & Reports'],website_manager:['Website Management'],
  quality_manager:['Quality Management','Analytics & Reports'],quality_executive:['Quality Management'],
};
const adminOptions=['Dashboard','Inventory Management','Sales Management','Purchase Management','Logistics Management',
  'Accounts & Finance','Website Management','Newsletter','Blog Management','User Management','HR Management',
  'Quality Management','Sales Activity Logs','Security & Activity','Analytics & Reports','System Settings','Log out'];
const salesOptions=['Overview','My Leads','My Companies','Follow-ups','My Sales & Quotations','Sample Requests',
  'Internal Chat','My Activity Log','Quality Requests','My Attendance','Email Settings','Log out'];
const qualityOptions=['Dashboard','Sample Requests','Document Requests','Testing Records','Test Reports','Batch Management',
  'Material Vendors','Customer Vendor Approvals','Non-Conformance Reports (NCR)','Website Management','My Attendance','Profile Settings','Log out'];
const customerOptions=['Dashboard','Sample Requests','Browse Products','Search','My Inquiries','Saved Products','Quotations',
  'Downloads','Catalogs','My Profile','Back to Website','Settings','Logout'];
async function main() {
  fs.mkdirSync(out,{recursive:true});
  await db.connect();
  const results=[];
  try {
    await db.query(`INSERT INTO users(id,email,password,role,user_type,account_status,is_active,first_name,last_name)
      VALUES($1,$2,$3,'super_admin','staff','active',true,'Portal','Verification')`,[userId,email,bcrypt.hashSync(password,10)]);
    browser=spawn('chromium',['--headless=new','--no-sandbox','--disable-dev-shm-usage',`--user-data-dir=${profile}`,'--remote-debugging-port=0','about:blank'],{stdio:'ignore'});
    for(let i=0;i<70&&!fs.existsSync(path.join(profile,'DevToolsActivePort'));i++)await sleep(100);
    const port=fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split('\n')[0];
    const pages=await require('./browser-devtools.cjs').getDevToolsPages(port);
    socket=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
    await new Promise((r,j)=>{socket.once('open',r);socket.once('error',j)});
    socket.on('message',bytes=>{
      const m=JSON.parse(bytes.toString());
      if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);
      if(!pending.has(m.id))return;
      const p=pending.get(m.id);pending.delete(m.id);
      m.error?p.reject(Error(m.error.message)):p.resolve(m.result);
    });
    await command('Page.enable');await command('Runtime.enable');
    await command('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
    await navigate('/login');
    const roles=process.argv.includes('--customer-only') ? [] :
      (process.env.TEST_ROLES || ['super_admin','admin','sales_manager','sales_executive',...Object.keys(departmental)].join(',')).split(',').filter(Boolean);
    for(const role of roles) {
      // Unmount protected pages before changing the fixture's role. Re-login
      // replaces its session; expiring a session on an active protected page
      // can race that page's redirect with the next evaluation context.
      await navigate('/login');
      await db.query("UPDATE users SET role=$2,user_type='staff' WHERE id=$1",[userId,role]);
      const login=await evaluate(`fetch('/admin/login',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
        body:new URLSearchParams(${JSON.stringify({email,password})}),credentials:'include'}).then(r=>({ok:r.ok,url:r.url}))`);
      if(!login.ok||login.url.includes('error='))throw Error('Login failed: '+role);
      const route=role.includes('admin')?'/admin':role.startsWith('sales_')?'/sales':'/staff';
      await navigate(route);
      await until("document.querySelector('nav') && !document.body.innerText.includes('Loading dashboard...')",'navigation '+role);
      const options=role.includes('admin')?adminOptions:role.startsWith('sales_')?salesOptions:['Dashboard','Internal Chat',...departmental[role],'My Attendance','Profile Settings','Log out'];
      const text=await evaluate("document.body.innerText");
      const missing=options.filter(o=>!text.includes(o));
      if(role==='super_admin'&&!text.includes('Document Upload'))missing.push('Document Upload');
      if(role==='admin'&&text.includes('Document Upload'))throw Error('Admin gained super-admin Document Upload');
      if(missing.length)throw Error(role+' missing navigation: '+missing.join(', '));
      const current={role,route,optionsChecked:options.length,missing};
      if(!before) {
        const themed=await evaluate("document.documentElement.hasAttribute('data-portal-theme') || document.body.hasAttribute('data-portal-theme') || !!document.querySelector('[data-portal-theme]')");
        current.themed=themed;
        if(!themed)throw Error('Missing portal theme '+role);
        if(process.argv.includes('--appearance-only')) {
          current.appearance=await checkAppearance(role);
          results.push(current);
          continue;
        }
        const nestedOnly=process.argv.includes('--nested-only');
        if(nestedOnly)current.nestedNavigation=await checkNestedNavigation();
        if(!nestedOnly && ['super_admin','sales_executive','inventory_manager'].includes(role)) {
          current.theme=await checkTheme(role);
          current.mobile=await checkMobile(role,role==='super_admin'?[...options,'Document Upload']:options);
        }
        if(!nestedOnly && ['super_admin','inventory_manager'].includes(role)) {
          current.modules=await visitNavModules();
        }
        if(!nestedOnly && ['super_admin','sales_executive'].includes(role))current.shortcuts=await checkShortcuts(role);
      }
      results.push(current);
      fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({results,runtimeExceptions:errors},null,2));
      if(['super_admin','sales_executive','inventory_manager'].includes(role))await shot(role);
      if(role.startsWith('quality_')) {
        await navigate('/quality/dashboard');
        await until("document.body.innerText.includes('Testing Records')",'quality navigation');
        const qualityText=await evaluate('document.body.innerText');
        const missing=qualityOptions.filter(o=>!qualityText.includes(o));
        if(missing.length)throw Error(role+' missing quality controls: '+missing.join(', '));
        results.push({role,route:'/quality/dashboard',optionsChecked:qualityOptions.length,missing});
        if(role==='quality_manager') {
          await shot(role);
          if(!before) {
            results.push({role,mobile:await checkMobile(role,qualityOptions),modules:await visitNavModules()});
            results.push({role,shortcuts:await checkShortcuts(role)});
          }
        }
      }
      console.log('PASS role navigation:',role);
    }
    if(process.argv.includes('--staff-only')) {
      fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({results,runtimeExceptions:errors},null,2));
      if(errors.length)throw Error('Browser exceptions: '+errors.join('; '));
      return;
    }
    await navigate('/login');
    await evaluate("fetch('/api/logout',{credentials:'include'}).then(r=>r.status)");
    await db.query("UPDATE users SET role='customer',user_type='customer' WHERE id=$1",[userId]);
    const customer=await evaluate(`fetch('/api/auth/customer-login',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify(${JSON.stringify({email,password})})}).then(async r=>({status:r.status,data:await r.json()}))`);
    if(customer.status!==200)throw Error('Customer login failed');
    await evaluate(`localStorage.setItem('customer_user_data',${JSON.stringify(JSON.stringify(customer.data.user))})`);
    await navigate('/customer/dashboard');
    await until("document.body.innerText.includes('Customer Portal')",'customer portal');
    const text=await evaluate('document.body.innerText');
    const missing=customerOptions.filter(o=>!text.includes(o));
    if(missing.length)throw Error('Customer missing controls: '+missing.join(', '));
    results.push({role:'customer',route:'/customer/dashboard',optionsChecked:customerOptions.length,missing});
    if(!before)results.push({role:'customer',theme:await checkTheme('customer'),mobile:await checkMobile('customer',customerOptions)});
    if(!before)results.push({role:'customer',shortcuts:await checkShortcuts('customer')});
    await shot('customer');
    for(const route of ['/customer/inquiries','/customer/saved','/customer/quotes','/customer/sample-requests','/customer/downloads','/customer/catalogs','/customer/profile']) {
      await navigate(route);await sleep(300);
      if(await evaluate("document.body.innerText.includes('Please login')"))throw Error('Customer authentication lost: '+route);
      results.push({role:'customer',route,rendered:await evaluate("document.body.innerText.length>100")});
    }
    await command('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
    await navigate('/customer/dashboard');
    await sleep(400);await shot('customer-mobile');
    results.push({role:'customer',viewport:'390x844',documentOverflow:await evaluate('document.documentElement.scrollWidth>innerWidth')});
    await navigate('/');
    await sleep(400);
    results.push({publicSite:true,themeLeaked:await evaluate("document.documentElement.hasAttribute('data-portal-theme') || document.body.hasAttribute('data-portal-theme')")});
    await evaluate("localStorage.removeItem('customer_user_data')");
    fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({phase:before?'before':'after',results,runtimeExceptions:errors},null,2));
    if(errors.length)throw Error('Browser runtime exceptions: '+errors.join('; '));
    console.log('PASS all role smoke checks. Results:',path.join(out,'results.json'));
  } catch(error) {
    console.error('Verification failure:',error.message);
    throw error;
  } finally {
    if(socket)socket.close();
    if(browser && browser.exitCode===null) {
      browser.kill('SIGKILL');
      await new Promise(resolve=>browser.once('exit',resolve));
    }
    await db.query('BEGIN');
    await db.query('SELECT id FROM users WHERE id=ANY($1::text[]) ORDER BY id FOR UPDATE',[ownedUserIds]);
    for(const table of ['activity_heartbeats','daily_performance_summary','notifications','user_access_events','user_login_logs'])
      await db.query(`DELETE FROM ${table} WHERE user_id=ANY($1::text[])`,[ownedUserIds]);
    await db.query('DELETE FROM users WHERE id=ANY($1::text[])',[ownedUserIds]);
    await db.query('COMMIT');
    await db.end();
    for(let i=0;i<4;i++)try{fs.rmSync(profile,{recursive:true,force:true});break}catch(e){if(i===3)console.error(e.message);await sleep(300)}
  }
}
if(process.argv.includes('--isolated')) {
  // This app imports large operational modules. Use a fresh browser per role
  // instead of retaining many full-page histories in one constrained renderer.
  const {spawnSync}=require('node:child_process');
  const roles=(process.env.TEST_ROLES || ['super_admin','admin','sales_manager','sales_executive',...Object.keys(departmental),'customer'].join(',')).split(',');
  const combined=[];
  fs.mkdirSync(out,{recursive:true});
  for(const role of roles) {
    const directory=path.join(out,role);
    const focused=process.argv.filter(flag=>['--nested-only','--appearance-only'].includes(flag));
    const r=spawnSync(process.execPath,[__filename,role==='customer'?'--customer-only':'--staff-only',...focused],{
      env:{...process.env,TEST_ROLES:role,TEST_OUTPUT_DIR:directory},stdio:'inherit',timeout:100000});
    if(r.status!==0){process.exitCode=1;break;}
    combined.push({role,...JSON.parse(fs.readFileSync(path.join(directory,'results.json'),'utf8'))});
  }
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({roleCount:combined.length,expectedRoleCount:roles.length,checks:combined},null,2));
  fs.rmSync(profile,{recursive:true,force:true});
  if(combined.length===roles.length)console.log('PASS isolated checks for '+combined.length+' roles');
} else main().catch(e=>{console.error(e.message);process.exitCode=1});
