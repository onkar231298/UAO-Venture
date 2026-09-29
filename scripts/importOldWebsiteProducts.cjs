// One-time, additive import of the old Website Management export into development.
// Usage: node scripts/importOldWebsiteProducts.cjs <zip-path> --apply
const { Client } = require("pg");
const { execFileSync } = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const zipPath = process.argv[2];
if (!zipPath || process.argv[3] !== "--apply") {
  console.error("Usage: node scripts/importOldWebsiteProducts.cjs <zip-path> --apply");
  process.exit(1);
}
const mapPath = ".local/private-backups/oldsite-dev-product-id-map-20260929.json";
if (fs.existsSync(mapPath)) throw new Error("Import mapping already exists; refusing to rerun");
const read = (name) => execFileSync("unzip", ["-p", zipPath, name], { maxBuffer: 24 * 1024 * 1024 });
const manifest = JSON.parse(read("manifest.json"));
for (const [name, meta] of Object.entries(manifest.files)) {
  const buffer = read(name);
  if (buffer.length !== meta.bytes || crypto.createHash("sha256").update(buffer).digest("hex") !== meta.sha256) {
    throw new Error(`Archive checksum mismatch: ${name}`);
  }
}
const names = [
  "categories", "product_types", "product_tags", "health_supports", "products",
  "product_category_relations", "product_type_relations", "product_tag_relations",
  "health_support_relations", "product_faqs", "product_documents",
];
const source = Object.fromEntries(names.map((name) => [name, JSON.parse(read(`${name}.json`))]));
const mediaRefs = JSON.parse(read("media_references.json"));
const failures = JSON.parse(read("media_failures.json"));
for (const name of names) {
  if (source[name].length !== manifest.tables[name]) throw new Error(`Unexpected ${name} count`);
}
if (source.product_faqs.filter((faq) => !source.products.some((p) => p.id === faq.product_id)).length !== 40) {
  throw new Error("Orphan FAQ inventory changed");
}

const tables = [
  "categories", "product_types", "product_tags", "health_supports", "products",
  "product_category_relations", "product_type_relations", "product_tag_relations",
  "health_support_relations", "product_faqs", "product_documents",
];
const client = new Client({ connectionString: process.env.DATABASE_URL });
const mappings = {};
let mapWritten = false;
let committed = false;

async function allocate(table, rows) {
  const ids = (await client.query(
    "SELECT nextval(pg_get_serial_sequence($1, 'id'))::int AS id FROM generate_series(1, $2::int)",
    [`public.${table}`, rows.length],
  )).rows.map((row) => row.id);
  mappings[table] = new Map(rows.map((row, i) => [row.id, ids[i]]));
}

function mapped(table, id) {
  if (id == null) return null;
  const result = mappings[table].get(id);
  if (result == null) throw new Error(`Missing ${table} source ID ${id}`);
  return result;
}

async function insert(table, rows, columns) {
  if (!rows.length) return;
  const meta = (await client.query(
    "SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1",
    [table],
  )).rows;
  const types = new Map(meta.map((col) => [col.column_name, col.data_type]));
  for (const column of columns) if (!types.has(column)) throw new Error(`Missing ${table}.${column}`);
  const quoted = columns.map((column) => `"${column}"`).join(",");
  for (let i = 0; i < rows.length; i += 40) {
    const params = [];
    const values = rows.slice(i, i + 40).map((row) => "(" + columns.map((column) => {
      const value = row[column];
      params.push(value != null && types.get(column) === "jsonb" ? JSON.stringify(value) : value);
      return `$${params.length}`;
    }).join(",") + ")").join(",");
    await client.query(`INSERT INTO ${table} (${quoted}) VALUES ${values}`, params);
  }
}

function mediaRewrite(products) {
  const byOldId = new Map(products.map((row) => [row.sourceId, row]));
  let transferred = 0;
  let unresolved = 0;
  for (const ref of mediaRefs) {
    if (ref.table !== "products") throw new Error(`Unexpected media table ${ref.table}`);
    const row = byOldId.get(ref.row_id);
    if (!row) throw new Error(`Media references absent product ${ref.row_id}`);
    const gallery = /^gallery_images\[(\d+)\]$/.exec(ref.field);
    const index = gallery ? Number(gallery[1]) : null;
    const oldValue = gallery ? row.gallery_images?.[index] : row[ref.field];
    if (oldValue !== ref.url) throw new Error(`Media reference differs from source: ${ref.row_id}/${ref.field}`);
    if (!ref.asset_path) {
      if (!(ref.url in failures)) throw new Error("Unexplained missing media");
      unresolved++;
      continue;
    }
    if (!/^media\/[a-f0-9]{64}\.(webp|jpg|pdf)$/.test(ref.asset_path)) throw new Error("Unsafe media path");
    const filename = path.posix.basename(ref.asset_path);
    if (!fs.existsSync(path.join("attached_assets/product-media", filename))) {
      throw new Error(`Bundled media not installed: ${filename}`);
    }
    const url = `/attached_assets/product-media/${filename}`;
    if (gallery) row.gallery_images[index] = url;
    else row[ref.field] = url;
    transferred++;
  }
  if (transferred !== 2226 || unresolved !== 1) throw new Error("Media reference totals differ");
  return { transferred, unresolved };
}

async function verify(products, faqs, links, media) {
  const counts = (await client.query(`SELECT
    (SELECT count(*)::int FROM products) products,
    (SELECT count(*)::int FROM categories) categories,
    (SELECT count(*)::int FROM product_tags) tags,
    (SELECT count(*)::int FROM product_faqs) faqs,
    (SELECT count(*)::int FROM product_category_relations) categories_links,
    (SELECT count(*)::int FROM product_type_relations) type_links,
    (SELECT count(*)::int FROM health_support_relations) health_links`)).rows[0];
  if (counts.products !== 1654 || counts.categories !== 31 || counts.tags !== 21 || counts.faqs !== 3959 ||
      counts.categories_links !== 1838 || counts.type_links !== 1857 || counts.health_links !== 3947) {
    throw new Error(`Imported count mismatch: ${JSON.stringify(counts)}`);
  }
  const status = (await client.query(
    "SELECT status, is_active, count(*)::int AS n FROM products GROUP BY status, is_active",
  )).rows;
  const expected = { "active:true": 295, "inactive:false": 1349, "draft:false": 10 };
  if (status.length !== 3 || status.some((row) => expected[`${row.status}:${row.is_active}`] !== row.n)) {
    throw new Error(`Visibility/status mismatch: ${JSON.stringify(status)}`);
  }
  const savedTags = (await client.query("SELECT id, name, slug FROM product_tags")).rows;
  for (const row of source.product_tags) {
    if (!savedTags.some((tag) => tag.id === mapped("product_tags", row.id) &&
      tag.slug === row.slug && tag.name === row.name)) throw new Error("Tag identity mismatch");
  }
  const saved = (await client.query(`SELECT id, product_id, slug, description, specification_sheet,
      base_price, price_usd, price_inr, price_eur, price_gbp, seo_title, seo_description,
      status, is_active, is_visible, is_featured, featured_order, unit, main_image,
      gallery_images, coa_document, spec_document, export_house_cert,
      source_created_by, source_updated_by FROM products`)).rows;
  const byId = new Map(saved.map((row) => [row.id, row]));
  for (const row of products) {
    const actual = byId.get(row.id);
    if (!actual) throw new Error("Missing imported product");
    for (const field of ["product_id", "slug", "description", "specification_sheet", "seo_title",
      "seo_description", "status", "is_active", "is_visible", "is_featured", "featured_order",
      "unit", "main_image", "coa_document", "spec_document", "export_house_cert",
      "source_created_by", "source_updated_by"]) {
      if (actual[field] !== row[field]) throw new Error(`Product field mismatch: ${field}`);
    }
    for (const field of ["base_price", "price_usd", "price_inr", "price_eur", "price_gbp"]) {
      if (actual[field] != null && row[field] != null && Number(actual[field]) !== Number(row[field])) {
        throw new Error(`Product price mismatch: ${field}`);
      }
      if ((actual[field] == null) !== (row[field] == null)) throw new Error(`Product price null mismatch: ${field}`);
    }
    if (JSON.stringify(actual.gallery_images) !== JSON.stringify(row.gallery_images)) {
      throw new Error("Gallery order/URL mismatch");
    }
  }
  const savedFaqs = (await client.query(
    "SELECT id, product_id, question, answer, display_order, is_active FROM product_faqs",
  )).rows;
  const faqById = new Map(savedFaqs.map((row) => [row.id, row]));
  for (const faq of faqs) {
    const actual = faqById.get(faq.id);
    if (!actual || ["product_id", "question", "answer", "display_order", "is_active"]
      .some((field) => actual[field] !== faq[field])) throw new Error("FAQ mapping/content mismatch");
  }
  for (const [table, entries, keys] of links) {
    const selected = (await client.query(`SELECT ${keys.join(",")} FROM ${table}`)).rows;
    const hashes = new Set(selected.map((row) => keys.map((key) => row[key]).join(":")));
    if (selected.length !== entries.length || entries.some((row) => !hashes.has(keys.map((key) => row[key]).join(":")))) {
      throw new Error(`Relationship mismatch: ${table}`);
    }
  }
  return { counts, status, media };
}

(async () => {
  await client.connect();
  try {
    await client.query("BEGIN ISOLATION LEVEL SERIALIZABLE");
    await client.query(`LOCK TABLE ${tables.join(", ")} IN SHARE ROW EXCLUSIVE MODE`);
    const before = (await client.query(`SELECT ${tables.map((table) =>
      `(SELECT count(*)::int FROM ${table}) AS ${table}`).join(",")}`)).rows[0];
    if (Object.entries(before).some(([table, count]) => table !== "product_tags" && count !== 0)) {
      throw new Error("Destination no longer empty; refusing to overwrite");
    }
    const existingTags = (await client.query("SELECT id, name, slug FROM product_tags")).rows;
    if (existingTags.length !== before.product_tags) throw new Error("Tag count changed");
    const bySlug = new Map(existingTags.map((tag) => [tag.slug, tag]));
    const byName = new Map(existingTags.map((tag) => [tag.name, tag]));
    const newTags = source.product_tags.filter((tag) => {
      const slugMatch = bySlug.get(tag.slug);
      const nameMatch = byName.get(tag.name);
      if (slugMatch && nameMatch && slugMatch.id === nameMatch.id) return false;
      if (slugMatch || nameMatch) throw new Error(`Conflicting destination tag: ${tag.slug}`);
      return true;
    });
    if (existingTags.some((tag) => !source.product_tags.some((row) => row.slug === tag.slug && row.name === tag.name))) {
      throw new Error("Destination-only tag found; review before importing");
    }

    for (const table of tables) {
      if (table !== "product_tags") await allocate(table, source[table]);
    }
    await allocate("product_tags", newTags);
    for (const row of source.product_tags) {
      const existing = bySlug.get(row.slug);
      if (existing) mappings.product_tags.set(row.id, existing.id);
    }
    const categories = source.categories.map((row) => ({
      ...row, id: mapped("categories", row.id), parent_id: mapped("categories", row.parent_id),
    }));
    await insert("categories", categories, Object.keys(categories[0]));
    for (const table of ["product_types", "product_tags", "health_supports"]) {
      const selected = table === "product_tags" ? newTags : source[table];
      const rows = selected.map((row) => ({ ...row, id: mapped(table, row.id) }));
      if (!rows.length) continue;
      await insert(table, rows, Object.keys(rows[0]));
    }
    const products = source.products.map((row) => ({
      ...row, sourceId: row.id, id: mapped("products", row.id),
      category_id: mapped("categories", row.category_id),
      source_created_by: row.created_by, source_updated_by: row.updated_by,
      created_by: null, updated_by: null,
    }));
    const media = mediaRewrite(products);
    await insert("products", products, [...Object.keys(source.products[0]), "source_created_by", "source_updated_by"]);

    const relationDefinitions = [
      ["product_category_relations", "category_id", "categories"],
      ["product_type_relations", "type_id", "product_types"],
      ["product_tag_relations", "tag_id", "product_tags"],
      ["health_support_relations", "health_support_id", "health_supports"],
    ];
    const links = [];
    for (const [table, classificationId, parentTable] of relationDefinitions) {
      const rows = source[table].map((row) => ({
        ...row, id: mapped(table, row.id),
        product_id: mapped("products", row.product_id),
        [classificationId]: mapped(parentTable, row[classificationId]),
      }));
      if (rows.length) await insert(table, rows, Object.keys(rows[0]));
      links.push([table, rows, table === "product_tag_relations"
        ? ["product_id", classificationId]
        : ["product_id", classificationId, "is_primary"]]);
    }
    const faqs = source.product_faqs.filter((row) => mappings.products.has(row.product_id))
      .map((row) => ({ ...row, id: mapped("product_faqs", row.id), product_id: mapped("products", row.product_id) }));
    await insert("product_faqs", faqs, Object.keys(faqs[0]));
    const result = await verify(products, faqs, links, media);
    fs.mkdirSync(path.dirname(mapPath), { recursive: true });
    fs.writeFileSync(mapPath, JSON.stringify({
      source: path.basename(zipPath), destination: "development",
      ids: Object.fromEntries(Object.entries(mappings).map(([table, map]) => [table, Object.fromEntries(map)])),
      orphanFaqSourceIds: source.product_faqs.filter((row) => !mappings.products.has(row.product_id)).map((row) => row.id),
      unresolvedMedia: failures,
    }), { flag: "wx", mode: 0o600 });
    mapWritten = true;
    await client.query("COMMIT");
    committed = true;
    console.log("Imported and verified:", JSON.stringify(result));
    console.log("ID mapping:", mapPath);
  } catch (error) {
    if (!committed) {
      try { await client.query("ROLLBACK"); } catch {}
      if (mapWritten) fs.rmSync(mapPath, { force: true });
    }
    throw error;
  } finally {
    await client.end();
  }
})().catch((error) => { console.error("Import failed:", error.message); process.exitCode = 1; });