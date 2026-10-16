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
  const trapped=await evaluate("document.querySelector('.bfo-more-sheet').contains(document.activeElement)");
  if(!trapped)throw Error('More did not receive keyboard focus '+role);
  await shot(role+'-mobile-more');
  await command('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  await command('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  await until("!document.querySelector('.bfo-more-sheet')",'Escape closes More '+role);
  await command('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  return {destinations:count,allOptionsInMore:true,focusTrapped:trapped,escapeClosed:true,tabletOverflow};
}
async function checkTheme(role) {
  await evaluate("localStorage.setItem('bfo-portal-theme','dark')");
  await command('Page.reload',{ignoreCache:true});
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
  return visited;
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
        if(['super_admin','sales_executive','inventory_manager'].includes(role)) {
          current.theme=await checkTheme(role);
          current.mobile=await checkMobile(role,role==='super_admin'?[...options,'Document Upload']:options);
        }
        if(['super_admin','inventory_manager'].includes(role)) {
          current.modules=await visitNavModules();
        }
        if(['super_admin','sales_executive'].includes(role))current.shortcuts=await checkShortcuts(role);
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
  } finally {
    if(socket)socket.close();if(browser)browser.kill('SIGKILL');
    for(const table of ['activity_heartbeats','daily_performance_summary','notifications','user_access_events','user_login_logs'])
      await db.query(`DELETE FROM ${table} WHERE user_id=$1`,[userId]);
    await db.query('DELETE FROM users WHERE id=$1',[userId]);
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
    const r=spawnSync(process.execPath,[__filename,role==='customer'?'--customer-only':'--staff-only'],{
      env:{...process.env,TEST_ROLES:role,TEST_OUTPUT_DIR:directory},stdio:'inherit',timeout:100000});
    if(r.status!==0){process.exitCode=1;break;}
    combined.push({role,...JSON.parse(fs.readFileSync(path.join(directory,'results.json'),'utf8'))});
  }
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({roleCount:combined.length,expectedRoleCount:roles.length,checks:combined},null,2));
  fs.rmSync(profile,{recursive:true,force:true});
  if(combined.length===roles.length)console.log('PASS isolated checks for '+combined.length+' roles');
} else main().catch(e=>{console.error(e.message);process.exitCode=1});
