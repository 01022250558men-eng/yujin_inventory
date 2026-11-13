/* data/*.xlsx → dist/index.html
   Vercel 빌드 명령(node tools/build.mjs)으로 실행됩니다. */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "data");
const OUT_DIR = path.join(ROOT, "dist");

const num = (v) => {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "string") v = v.replace(/[,\s원]/g, "");
  const n = Number(v);
  return isFinite(n) ? n : null;
};

const files = fs.readdirSync(DATA_DIR).filter((f) => /\.xlsx?$/i.test(f)).sort();
if (!files.length) {
  console.error("data 폴더에 재고 엑셀(.xlsx)이 없습니다.");
  process.exit(1);
}
const file = path.join(DATA_DIR, files[files.length - 1]);
console.log("입력:", path.basename(file));

const wb = XLSX.readFile(file);
const sheetName = wb.SheetNames.find((n) => n.replace(/\s/g, "").includes("쇼핑몰"));
if (!sheetName) {
  console.error("'쇼핑몰' 시트를 찾지 못했습니다. 시트 이름을 확인하세요:", wb.SheetNames.join(", "));
  process.exit(1);
}
const aoa = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, defval: "", blankrows: false });

const need = { code: "품목코드", name: "품목명", qty: "재고수량", price: "재고단가", amt: "재고금액", grp: "품목그룹" };
let hi = -1;
let ci = null;
for (let i = 0; i < Math.min(aoa.length, 12); i++) {
  const row = aoa[i].map((v) => String(v).replace(/\s/g, ""));
  const f = {};
  for (const k in need) f[k] = row.findIndex((c) => c.includes(need[k]));
  if (f.code >= 0 && f.name >= 0 && f.qty >= 0) { hi = i; ci = f; break; }
}
if (hi < 0) { console.error("헤더(품목코드·품목명·재고수량)를 찾지 못했습니다."); process.exit(1); }

const rows = [];
for (let i = hi + 1; i < aoa.length; i++) {
  const r = aoa[i];
  const code = String(r[ci.code] ?? "").trim();
  const name = String(r[ci.name] ?? "").trim();
  if (!code && !name) continue;
  const q = num(r[ci.qty]) ?? 0;
  let p = ci.price >= 0 ? num(r[ci.price]) : null;
  let a = ci.amt >= 0 ? num(r[ci.amt]) : null;
  if (a === null && p !== null) a = q * p;
  const g = ci.grp >= 0 ? String(r[ci.grp] ?? "").trim() : "";
  rows.push([code, name, q, p, a, g || "미분류"]);
}
if (rows.length < 10) { console.error("유효 행이 10개 미만입니다:", rows.length); process.exit(1); }

let qty = 0, amt = 0;
for (const r of rows) { qty += r[2] || 0; amt += r[4] || 0; }

/* 파일 수정시각(KST)을 데이터 기준으로 표기 */
const st = fs.statSync(file);
const k = new Date(st.mtime.getTime() + 9 * 3600 * 1000);
const p2 = (n) => String(n).padStart(2, "0");
const updated = `${k.getUTCFullYear()}-${p2(k.getUTCMonth() + 1)}-${p2(k.getUTCDate())} ${p2(k.getUTCHours())}:${p2(k.getUTCMinutes())}`;

const payload = { updated, savedAt: new Date().toISOString(), source: "live", rows };
const tpl = fs.readFileSync(path.join(ROOT, "template.html"), "utf8");
const out = tpl.replace("__DATA__", JSON.stringify(payload));

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, "index.html"), out);
fs.writeFileSync(path.join(OUT_DIR, "data.json"), JSON.stringify(payload));

console.log(`완료: ${rows.length}행 · 수량 ${qty.toLocaleString()} · 금액 ${amt.toLocaleString()}원 · 기준 ${updated}`);
console.log(`출력: dist/index.html (${(out.length / 1024).toFixed(1)} KB)`);
