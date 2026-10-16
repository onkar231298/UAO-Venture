// Record semantic UI controls before a visual refactor and fail on removals.
// Styling, wrappers and line movements are deliberately excluded from identities.
const ts = require('typescript');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const baselinePath = 'docs/interface-options-baseline.json';
const write = process.argv.includes('--record');
function files(dir) {
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e => e.isDirectory()
    ? files(path.join(dir,e.name)) : /\.tsx?$/.test(e.name) ? [path.join(dir,e.name)] : []);
}
function inventory(file) {
  const source = ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const items = [];
  const normalize = s => s.replace(/\s+/g,' ').trim();
  function visit(node) {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(source);
      const attributes = node.attributes.properties.filter(p => ts.isJsxAttribute(p) &&
        /^(on[A-Z]|name$|value$|href$|to$|type$|disabled$|required$|readOnly$|multiple$|accept$|placeholder$|data-testid$|checked$|defaultValue$)/.test(p.name.getText(source)))
        .map(p => normalize(p.getText(source))).sort();
      const interactive = /^(button|input|select|textarea|option|a|Button|Input|Textarea|Select.*|.*Trigger|.*Item|.*Action|Checkbox|Switch|Radio.*|FormField|Tabs.*|Route)$/.test(tag);
      if (interactive || attributes.some(a => /^on[A-Z]/.test(a))) {
        const text = ts.isJsxOpeningElement(node) && ts.isJsxElement(node.parent)
          ? node.parent.children.filter(ts.isJsxText).map(n=>normalize(n.text)).filter(Boolean).join(' ') : '';
        const semantic = JSON.stringify({tag,attributes,text});
        items.push({key:crypto.createHash('sha256').update(semantic).digest('hex'),tag,attributes,text,
          line:source.getLineAndCharacterOfPosition(node.getStart(source)).line+1});
      }
    }
    ts.forEachChild(node,visit);
  }
  visit(source);
  return items;
}
const current = Object.fromEntries(files('client/src').map(f=>[f,inventory(f)]).filter(([,items])=>items.length));
if (write) {
  if (fs.existsSync(baselinePath)) throw Error('Baseline already exists; do not overwrite to hide missing options.');
  fs.mkdirSync(path.dirname(baselinePath),{recursive:true});
  fs.writeFileSync(baselinePath,JSON.stringify({description:'Pre-redesign semantic controls; static presence is not proof of runtime reachability.',files:current},null,2)+'\n');
  console.log(`Recorded ${Object.values(current).reduce((n,x)=>n+x.length,0)} controls across ${Object.keys(current).length} files.`);
} else {
  const baseline = JSON.parse(fs.readFileSync(baselinePath,'utf8')).files;
  const missing = [];
  for (const [file,items] of Object.entries(baseline)) {
    const available = new Map();
    for (const item of current[file] || []) available.set(item.key,(available.get(item.key)||0)+1);
    for (const item of items) {
      if (available.get(item.key)) available.set(item.key,available.get(item.key)-1);
      else missing.push({file,line:item.line,tag:item.tag,text:item.text,attributes:item.attributes});
    }
  }
  console.log(JSON.stringify({baselineControls:Object.values(baseline).reduce((n,x)=>n+x.length,0),missingCount:missing.length,missing},null,2));
  if (missing.length) process.exitCode=1;
}
