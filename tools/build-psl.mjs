// tools/public_suffix_list.dat（Public Suffix List、MPL-2.0）から js/psl-data.js を作る
// 使い方: node tools/build-psl.mjs（--check で、今の js/psl-data.js と同じかだけを見る）
// 規則は URL の hostname と同じ ASCII（Punycode）にそろえる（url.domainToASCII＝ブラウザーの URL と同じ UTS #46）。
// 「!」「*.」の印は残し、ICANN の区分と PRIVATE の区分（利用者が自由にサブドメインを作れるサービスなど）を分けて持つ
import fs from "node:fs";
import { domainToASCII } from "node:url";

const SRC = new URL("./public_suffix_list.dat", import.meta.url);
const DST = new URL("../js/psl-data.js", import.meta.url);

export function parseList(text) {
  const out = { version: "", commit: "", icann: [], private: [] };
  let section = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    const v = line.match(/^\/\/ VERSION: (\S+)/);
    if (v) out.version = v[1];
    const c = line.match(/^\/\/ COMMIT: (\S+)/);
    if (c) out.commit = c[1];
    if (line.includes("===BEGIN ICANN DOMAINS===")) section = "icann";
    else if (line.includes("===BEGIN PRIVATE DOMAINS===")) section = "private";
    else if (line.includes("===END")) section = null;
    if (!line || line.startsWith("//") || !section) continue;
    const rule = line.split(/\s/)[0];
    const prefix = rule.startsWith("!") ? "!" : rule.startsWith("*.") ? "*." : "";
    const ascii = domainToASCII(rule.slice(prefix.length));
    if (!ascii) throw new Error("cannot convert rule: " + rule);
    out[section].push(prefix + ascii);
  }
  return out;
}

export function render(text) {
  const { version, commit, icann, private: priv } = parseList(text);
  return [
    "// 生成物（tools/build-psl.mjs が tools/public_suffix_list.dat から作る。手で編集しない）",
    "// Public Suffix List https://publicsuffix.org/ — This Source Code Form is subject to the terms of the Mozilla",
    "// Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/.",
    `// VERSION ${version} / COMMIT ${commit} / ICANN ${icann.length} rules / PRIVATE ${priv.length} rules`,
    "globalThis.QRPsl = {",
    `  version: ${JSON.stringify(version)},`,
    `  icann: ${JSON.stringify(icann.join(" "))},`,
    `  private: ${JSON.stringify(priv.join(" "))}`,
    "};",
    ""
  ].join("\n");
}

if (process.argv[1] && process.argv[1].endsWith("build-psl.mjs")) {
  const out = render(fs.readFileSync(SRC, "utf8"));
  if (process.argv.includes("--check")) {
    const same = fs.existsSync(DST) && fs.readFileSync(DST, "utf8") === out;
    console.log(same ? "js/psl-data.js is up to date" : "js/psl-data.js differs");
    process.exit(same ? 0 : 1);
  }
  fs.writeFileSync(DST, out);
  console.log(`wrote js/psl-data.js (${out.length} characters)`);
}
