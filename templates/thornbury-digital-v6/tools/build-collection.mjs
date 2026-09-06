// Fills the collection wall (collection.html) and the home mosaic (index.html)
// from tools/collection.json. Run from the template folder:
//   node tools/build-collection.mjs
// Markup between <!-- wall:start --> / <!-- wall:end --> and
// <!-- mosaic:start --> / <!-- mosaic:end --> is regenerated; nothing else is touched.
import { readFileSync, writeFileSync } from "node:fs";

const items = JSON.parse(readFileSync(new URL("./collection.json", import.meta.url), "utf8"));
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const catName = (c) => c === "other" ? "Other" : ({ business: "Business", restaurant: "Food & drink", retail: "Retail", portfolio: "Portfolio", entertainment: "Entertainment", "real-estate": "Property", health: "Health", education: "Education", events: "Events", hospitality: "Hospitality", saas: "Software", services: "Services", automotive: "Automotive", creative: "Creative" })[c] || (c.charAt(0).toUpperCase() + c.slice(1).replace(/-/g, " "));

const plate = (it, i, full) => {
  const num = String(i + 1).padStart(2, "0");
  const href = "../" + it.slug + "/index.html";
  const alt = it.title + ": " + it.description;
  return `        <article class="plate reveal" data-cat="${esc(it.category || "other")}">
          <a class="plate-media" href="${href}" target="_blank" rel="noopener" aria-label="Open ${esc(it.title)} in a new tab"><img src="img/wall/${it.slug}.webp" width="1200" height="750" alt="${esc(alt)}" loading="lazy" decoding="async"></a>
          <div class="plate-cap"><span class="n">${num}</span><h3><a href="${href}" target="_blank" rel="noopener">${esc(it.title)}</a></h3><p class="lab meta">${esc(it.tag)}</p></div>${full ? `
          <p class="plate-note">${esc(it.description)}</p>` : ""}
        </article>`;
};

function replaceBetween(html, start, end, body) {
  const a = html.indexOf(start), b = html.indexOf(end);
  if (a < 0 || b < 0) throw new Error("markers missing: " + start);
  return html.slice(0, a + start.length) + "\n" + body + "\n" + html.slice(b);
}

// collection.html — the whole wall and the filter row
const cats = {};
items.forEach((it) => { it.category = it.category || "other"; cats[it.category] = (cats[it.category] || 0) + 1; });
const chips = [`          <button type="button" data-cat="all" aria-pressed="true">All<small>${items.length}</small></button>`]
  .concat(Object.keys(cats).sort((x, y) => cats[y] - cats[x]).map((c) => `          <button type="button" data-cat="${esc(c)}" aria-pressed="false">${esc(catName(c))}<small>${cats[c]}</small></button>`))
  .join("\n");
let col = readFileSync("collection.html", "utf8");
col = replaceBetween(col, "<!-- wall:start -->", "<!-- wall:end -->", items.map((it, i) => plate(it, i, true)).join("\n"));
col = replaceBetween(col, "<!-- filter:start -->", "<!-- filter:end -->", chips);
col = col.replace(/<span data-count>\d*<\/span>/g, `<span data-count>${items.length}</span>`);
writeFileSync("collection.html", col);

// index.html — the first eighteen as a mosaic
let home = readFileSync("index.html", "utf8");
home = replaceBetween(home, "<!-- mosaic:start -->", "<!-- mosaic:end -->", items.slice(0, 18).map((it, i) => plate(it, i, false)).join("\n"));
home = home.replace(/<span data-count>\d*<\/span>/g, `<span data-count>${items.length}</span>`);
writeFileSync("index.html", home);
console.log("wall:", items.length, "plates;", Object.keys(cats).length, "categories");
