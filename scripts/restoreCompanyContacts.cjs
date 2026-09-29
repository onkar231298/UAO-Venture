// One-time, transactional restore of the canonical JSON files in the supplied archive.
// Usage: node scripts/restoreCompanyContacts.cjs ARCHIVE.zip BACKUP.dump
const fs = require('node:fs');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { Client } = require('pg');

const [archive, backup] = process.argv.slice(2);
if (!archive || !backup || !fs.statSync(backup).size || !process.env.DATABASE_URL) {
  throw new Error('An archive, a completed database backup, and DATABASE_URL are required');
}

function member(name) {
  return execFileSync('unzip', ['-p', archive, name], { maxBuffer: 12 * 1024 * 1024 });
}

const manifest = JSON.parse(member('manifest.json'));
for (const [name, spec] of Object.entries(manifest.files)) {
  const bytes = member(name);
  if (bytes.length !== spec.bytes || crypto.createHash('sha256').update(bytes).digest('hex') !== spec.sha256) {
    throw new Error(`Archive checksum mismatch: ${name}`);
  }
}
const companies = JSON.parse(member('companies.json'));
const contacts = JSON.parse(member('company_contacts.json'));
const nested = JSON.parse(member('companies_with_contacts.json'));
if (companies.length !== 2698 || contacts.length !== 2194 ||
    companies.length !== manifest.tables.companies || contacts.length !== manifest.tables.company_contacts) {
  throw new Error('Unexpected source counts');
}
const oldCompanies = new Map(companies.map(row => [row.id, row]));
if (oldCompanies.size !== companies.length || new Set(contacts.map(row => row.id)).size !== contacts.length ||
    contacts.some(row => !oldCompanies.has(row.company_id))) {
  throw new Error('Duplicate source IDs or a contact without a source company');
}
const nestedContacts = nested.flatMap(item => item.contacts.map(row => [item.company.id, row.id]));
if (nested.length !== companies.length || nestedContacts.length !== contacts.length ||
    nestedContacts.some(([parent, id]) => !contacts.some(row => row.id === id && row.company_id === parent))) {
  throw new Error('Nested contact proof does not agree with canonical source');
}

const unverifiedUserColumns = [
  'created_by', 'linked_user_id', 'assigned_to', 'assigned_by',
  'irrelevant_marked_by', 'duplicate_reviewed_by',
];
const dateColumns = new Set([
  'assigned_at', 'last_contact_date', 'next_follow_up_date', 'created_at',
  'updated_at', 'irrelevant_marked_at', 'duplicate_reviewed_at',
]);
const numericColumns = new Set(['annual_turnover', 'duplicate_confidence']);
function normalized(value, key) {
  if (value == null) return null;
  if (numericColumns.has(key)) return Number(value);
  if (dateColumns.has(key)) {
    return String(value).replace(' ', 'T').replace(/\.(\d+)/, (_, fraction) =>
      '.' + fraction.padEnd(6, '0').slice(0, 6)).replace(/\.000000$/, '');
  }
  return value;
}
function assertRows(actual, expected, kind) {
  if (actual.length !== expected.length) throw new Error(`${kind} row count differs`);
  const byId = new Map(actual.map(item => [item.id, item]));
  for (const row of expected) {
    const found = byId.get(row.id);
    if (!found) throw new Error(`${kind} missing imported ID ${row.id}`);
    for (const [key, value] of Object.entries(row)) {
      if (normalized(found[key], key) !== normalized(value, key)) {
        throw new Error(`${kind} mismatch in ${key} for imported ID ${row.id}`);
      }
    }
  }
}

async function insertBatches(client, table, rows) {
  for (let start = 0; start < rows.length; start += 150) {
    const batch = rows.slice(start, start + 150);
    await client.query(
      `INSERT INTO public.${table} SELECT * FROM jsonb_populate_recordset(NULL::public.${table}, $1::jsonb)`,
      [JSON.stringify(batch)],
    );
  }
}

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  let inTransaction = false;
  try {
    await client.query('BEGIN');
    inTransaction = true;
    await client.query("SET LOCAL lock_timeout = '15s'");
    await client.query('LOCK TABLE public.companies, public.company_contacts IN SHARE ROW EXCLUSIVE MODE');
    const initial = await client.query(
      'SELECT (SELECT count(*)::int FROM public.companies) AS companies, (SELECT count(*)::int FROM public.company_contacts) AS contacts',
    );
    if (initial.rows[0].companies || initial.rows[0].contacts) {
      throw new Error('Destination is not empty; restore will not overwrite or merge existing records');
    }
    const companyIds = (await client.query(
      "SELECT nextval('public.companies_id_seq')::int AS id FROM generate_series(1, $1::int)",
      [companies.length],
    )).rows.map(row => row.id);
    const contactIds = (await client.query(
      "SELECT nextval('public.company_contacts_id_seq')::int AS id FROM generate_series(1, $1::int)",
      [contacts.length],
    )).rows.map(row => row.id);
    const companyMap = new Map(companies.map((row, index) => [row.id, companyIds[index]]));
    const contactMap = new Map(contacts.map((row, index) => [row.id, contactIds[index]]));
    const orphanDuplicateReferences = companies.filter(row =>
      row.duplicate_of !== null && !companyMap.has(row.duplicate_of)).length;
    const mappedCompanies = companies.map(row => {
      const mapped = { ...row, id: companyMap.get(row.id) };
      for (const key of unverifiedUserColumns) mapped[key] = null;
      mapped.duplicate_of = companyMap.get(row.duplicate_of) ?? null;
      return mapped;
    });
    const mappedContacts = contacts.map(row => ({
      ...row,
      id: contactMap.get(row.id),
      company_id: companyMap.get(row.company_id),
    }));

    await insertBatches(client, 'companies', mappedCompanies);
    await insertBatches(client, 'company_contacts', mappedContacts);
    const actualCompanies = (await client.query('SELECT row_to_json(c) AS row FROM public.companies c')).rows.map(x => x.row);
    const actualContacts = (await client.query('SELECT row_to_json(c) AS row FROM public.company_contacts c')).rows.map(x => x.row);
    assertRows(actualCompanies, mappedCompanies, 'company');
    assertRows(actualContacts, mappedContacts, 'contact');
    const stats = (await client.query(`
      SELECT count(*)::int AS contacts,
        count(*) FILTER (WHERE NOT c.is_primary)::int AS non_primary,
        count(*) FILTER (WHERE nullif(c.email, '') IS NOT NULL)::int AS with_email,
        count(*) FILTER (WHERE nullif(c.email, '') IS NOT NULL
          AND lower(trim(c.email)) <> lower(trim(coalesce(p.primary_email, ''))))::int AS different_email,
        count(DISTINCT c.company_id)::int AS companies_with_contacts,
        count(*) FILTER (WHERE p.id IS NULL)::int AS orphan_contacts
      FROM public.company_contacts c
      LEFT JOIN public.companies p ON p.id = c.company_id
    `)).rows[0];
    if (stats.contacts !== 2194 || stats.non_primary !== 2175 ||
        stats.with_email !== 2122 || stats.different_email !== 2088 ||
        stats.companies_with_contacts !== 980 || stats.orphan_contacts !== 0) {
      throw new Error('Direct database contact metrics do not agree with the manifest');
    }
    await client.query('COMMIT');
    inTransaction = false;
    const mapPath = '.local/private-backups/company-restore-id-map-20260929.json';
    fs.writeFileSync(mapPath, JSON.stringify({
      companyIds: Object.fromEntries(companyMap),
      contactIds: Object.fromEntries(contactMap),
      orphanDuplicateReferences,
      unverifiedUserColumns,
    }), { mode: 0o600 });
    console.log(JSON.stringify({
      result: 'committed', companies: actualCompanies.length, contacts: stats.contacts,
      nonPrimary: stats.non_primary, withEmail: stats.with_email,
      differentEmail: stats.different_email, companiesWithContacts: stats.companies_with_contacts,
      orphans: stats.orphan_contacts, orphanDuplicateReferences,
      idMap: mapPath,
    }));
  } catch (error) {
    if (inTransaction) await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });