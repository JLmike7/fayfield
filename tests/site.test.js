const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const pages = [
  "index.html",
  "calendar/index.html",
  "living-in-york/index.html",
  "living-in-york/getting-settled/index.html",
  "living-in-york/government-public-services/index.html",
  "living-in-york/schools-family-resources/index.html",
  "living-in-york/parks-trails-recreation/index.html",
  "living-in-york/transportation-getting-around/index.html",
  "living-in-york/libraries-arts-attractions/index.html",
  "living-in-york/health-safety-community-support/index.html",
  "living-in-york/volunteering-community-life/index.html",
  "fayfield-history/index.html",
  "useful-links/index.html",
  "about-fayfield/index.html",
  "privacy/index.html",
  "404.html",
];

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

test("homepage wordmark is Fayfield Community and CTA goes to calendar", () => {
  const html = read("index.html");
  assert.match(html, /Fayfield Community/);
  assert.match(html, /View Community Calendar/);
  assert.match(html, /href="calendar\/"/);
  assert.doesNotMatch(html, /THIS WEEK|Welcome to Expo|maple/i);
  assert.doesNotMatch(html, /municipal seal/i);
});

test("main nav is the five sitemap sections", () => {
  const html = read("index.html");
  for (const label of [
    "Calendar",
    "Living in York",
    "Fayfield History",
    "Useful Links",
    "About",
  ]) {
    assert.match(html, new RegExp(label));
  }
  assert.match(html, /href="calendar\/"/);
  assert.match(html, /href="living-in-york\/"/);
  assert.match(html, /href="fayfield-history\/"/);
  assert.match(html, /href="useful-links\/"/);
  assert.match(html, /href="about-fayfield\/"/);
  assert.match(html, /href="about-fayfield\/"[^>]*>About<\/a>/);
  assert.doesNotMatch(html, /href="about-fayfield\/"[^>]*>About Fayfield<\/a>/);
});

test("every page nav label is About, not About Fayfield", () => {
  for (const rel of pages) {
    const html = read(rel);
    assert.match(html, /href="about-fayfield\/"[^>]*>About<\/a>/, rel);
    assert.doesNotMatch(html, /href="about-fayfield\/"[^>]*>About Fayfield<\/a>/, rel);
  }
});

test("every page is noindex development preview", () => {
  for (const rel of pages) {
    const html = read(rel);
    assert.match(html, /noindex/, rel);
  }
});

test("photo is a labeled placeholder, not a fake Fayfield street", () => {
  const html = read("index.html");
  assert.match(html, /community-owned Fayfield photograph/);
  assert.match(html, /(?:not|isn[’']t) a Fayfield street/i);
  assert.doesNotMatch(html, /this is a Fayfield street/i);
  assert.doesNotMatch(html, /photograph of a Fayfield street/i);
});

test("calendar UI is fail-closed with Fayfield default-on and no fake feed", () => {
  const html = read("calendar/index.html");
  assert.match(html, /Fayfield Community/);
  assert.match(html, /agenda/i);
  assert.match(html, /localStorage|this browser/i);
  assert.match(html, /unofficial|authoritative/i);
  assert.match(html, /Nothing on the calendar yet/);
  assert.match(html, /rather than make something up/);
  assert.match(html, /same-origin public-ICS snapshot|don.t invent/i);
  assert.doesNotMatch(html, /not built yet|coming in a later slice/i);
  assert.doesNotMatch(html, /<iframe[^>]+google\.com\/calendar/i);
  assert.doesNotMatch(html, /corsproxy|allorigins|cors-anywhere/i);
  assert.doesNotMatch(html, /error panel|could not load/i);
});

test("accents are sycamore, not maple", () => {
  const css = read("styles.css");
  assert.doesNotMatch(css, /maple/i);
  assert.match(css, /--bark:/);
  for (const rel of pages) {
    assert.doesNotMatch(read(rel), /maple/i, rel);
  }
});

test("about is two rooms: About Fayfield and About this site", () => {
  const html = read("about-fayfield/index.html");
  assert.match(html, /<title>About — Fayfield Community<\/title>/);
  assert.match(html, /<h1>About<\/h1>/);
  assert.doesNotMatch(html, /<h1>About Fayfield<\/h1>/);
  assert.match(html, /<h2>About Fayfield<\/h2>/);
  assert.match(html, /<h2>About this site<\/h2>/);
  assert.doesNotMatch(html, /<h2>\s*This site\s*<\/h2>/);
  const afterSite = html.split(/<h2>About this site<\/h2>/)[1] || "";
  const aboutThisSite = afterSite.split(/<footer/i)[0];
  assert.match(aboutThisSite, /unofficial/i);
  assert.match(aboutThisSite, /HOA/);
  assert.match(html, /href="fayfield-history\/">Fayfield History<\/a>/);
  assert.match(html, /Springettsbury Township/);
  assert.match(html, /East York/);
  assert.doesNotMatch(html, /know the streets/i);
  assert.doesNotMatch(html, /draw a line/i);
  assert.doesNotMatch(html, /not written yet|coming in a later slice/i);
  assert.doesNotMatch(html, /facebook\.com/i);
  assert.doesNotMatch(html, /mailto:|<form/i);
  assert.doesNotMatch(html, /boundary map/i);
});

test("privacy states no accounts, no analytics yet, and future localStorage only", () => {
  const html = read("privacy/index.html");
  assert.match(html, /no account/i);
  assert.match(html, /analytics/i);
  assert.match(html, /not using analytics yet|no analytics yet/i);
  assert.match(html, /localStorage/);
  assert.match(html, /this browser/i);
  assert.match(html, /outside calendar/i);
  assert.doesNotMatch(html, /not finished|coming in a later slice/i);
  assert.doesNotMatch(html, /fetch\(|google.com\/calendar/i);
  assert.doesNotMatch(html, /calendar is fetching|feeds are live/i);
});

test("404 is helpful and links home, calendar, and living in york", () => {
  const html = read("404.html");
  assert.match(html, /href="\.\/"/);
  assert.match(html, /href="calendar\/"/);
  assert.match(html, /href="living-in-york\/"/);
  assert.match(html, /Calendar/);
  assert.match(html, /Living in York/);
});

test("useful links has jump menu and six sitemap headings", () => {
  const html = read("useful-links/index.html");
  const headings = [
    "Government and official alerts",
    "Schools and family resources",
    "Trash, utilities, roads, and property",
    "Parks, libraries, and recreation",
    "Health, safety, and assistance",
    "Community destinations",
  ];
  for (const h of headings) {
    assert.match(html, new RegExp(h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(html, /<nav[^>]*jump|class="jump"/i);
  assert.doesNotMatch(html, /not written yet|coming in a later slice/i);
  assert.doesNotMatch(html, /facebook\.com/i);
});

test("useful links only includes verified official publisher URLs", () => {
  const html = read("useful-links/index.html");
  for (const url of [
    "https://www.springettsbury.com/",
    "https://yorkcountypa.gov/",
    "https://yorkcountypa.gov/1166/Public-Emergency-Alerts",
    "https://www.yorkcountypa.gov/list.aspx",
    "https://www.yssd.org/about-us",
    "https://www.yssd.org/about-us/district-map",
    "https://springettsbury.com/recycling-trash/recycling-and-trash-guidelines/",
    "https://www.pennwaste.com/municipalities/springettsbury-township",
    "https://springettsbury.com/departments/public-works/leaf-collection/",
    "https://www.ycswa.com/",
    "https://springettsbury.com/park/springettsbury-park/",
    "https://www.yorkcountypa.gov/568/Parks-Recreation",
    "https://www.yorklibraries.org/find-a-library/",
    "https://yorkcountypa.gov/278/County-Human-Services",
    "https://www.pa211.org/",
    "https://www.rabbittransit.org/",
    "https://www.yorkpa.org/",
    "https://springettsbury.com/park/fayfield-park/",
    "https://springettsbury.com/news/",
    "https://springettsbury.com/calendar-events/",
    "https://www.yaufr.com/about-us/",
    "https://www.511pa.com/",
    "https://www.rabbittransit.org/routes/route-5e/",
  ]) {
    assert.match(html, new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(html, /portions of Springettsbury/i);
  assert.match(html, /webpage calendar|page calendar|calendar of township events/i);
  assert.doesNotMatch(html, /visityork\.org/i);
});

test("living in york landing lists eight evergreen categories and no seasonal stubs", () => {
  const html = read("living-in-york/index.html");
  const slugs = [
    "getting-settled",
    "government-public-services",
    "schools-family-resources",
    "parks-trails-recreation",
    "transportation-getting-around",
    "libraries-arts-attractions",
    "health-safety-community-support",
    "volunteering-community-life",
  ];
  for (const slug of slugs) {
    assert.match(html, new RegExp("living-in-york/" + slug + "/"));
    assert.ok(fs.existsSync(path.join(root, "living-in-york", slug, "index.html")), slug);
  }
  assert.doesNotMatch(html, /not written yet|coming in a later slice/i);
  assert.doesNotMatch(html, /summer-in-york|fall-activities|holiday-resources|winter-activities/);
  assert.doesNotMatch(html, /facebook\.com/i);
  assert.doesNotMatch(html, /best of|top 10|rankings/i);
});

test("history page cites public sources, labels uncertainty, and does not host photos", () => {
  const html = read("fayfield-history/index.html");
  assert.match(html, /first commercial airport|first commercial York Airport/);
  assert.match(html, /southwest corner of Haines Road and 7th Avenue/);
  assert.doesNotMatch(html, /710\s*Haines/i);
  assert.doesNotMatch(html, /first landing in York County/i);
  assert.match(html, /yorkblog.com\/yorkspast\/fayfield-springettsbury-york-airport/);
  assert.match(html, /ydr.com\/story\/news\/history\/blogs\/york-town-square\/2019\/09\/04\/redlining-york-how-government-policies-kept-blacks-poor-segregated\/2208093001/);
  assert.match(html, /springettsbury.com\/park\/fayfield-park/);
  assert.match(html, /yorkblog.com\/yorkspast\/amelia-earhart-york/);
  assert.match(html, /maps\.psiee\.psu\.edu\/ImageryNavigator/);
  assert.match(html, /Uncertainties/);
  assert.match(html, /speculat/i);
  assert.match(html, /lecture/);
  assert.match(html, /landing/);
  assert.match(html, /have not yet read the 1947 plan|not yet read the 1947 plan/);
  assert.match(html, /Shelley/);
  assert.match(html, /Fair Housing/);
  assert.match(html, /We are not reprinting it here/);
  assert.match(html, /East York Historic District is a different neighborhood/);
  assert.doesNotMatch(html, /not written yet|coming in a later slice/i);
  assert.doesNotMatch(html, /facebook\.com/i);
  assert.doesNotMatch(html, /Orr/);
  assert.match(html, /Unofficial, resident-run\. Not the township/);
  const imgs = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
  assert.ok(imgs.length >= 1, "history may include the brand-mark img");
  for (const tag of imgs) {
    assert.match(tag, /class="brand-mark"/);
    assert.match(tag, /src="sycamore-leaf\.png"/);
  }
});

test("header uses a modest sycamore leaf mark, not the four-blob SVG", () => {
  assert.ok(fs.existsSync(path.join(root, "sycamore-leaf.png")));
  for (const rel of pages) {
    const html = read(rel);
    assert.match(html, /<img class="brand-mark"/, rel);
    assert.match(html, /src="sycamore-leaf\.png"/, rel);
    assert.match(html, /<img class="brand-mark"[^>]*alt=""/, rel);
    assert.doesNotMatch(html, /viewBox="0 0 64 64"/, rel);
    assert.doesNotMatch(html, /path d="M32 6c6 8/, rel);
    assert.doesNotMatch(html, /preview-tag/, rel);
    assert.doesNotMatch(html, /B — REAL SYCAMORE LEAF/i, rel);
  }
});

test("brand mark CSS is header B: 2.75rem, optically centered, not subscript", () => {
  const css = read("styles.css");
  assert.match(css, /\.brand-mark[\s\S]*height:\s*2\.75rem/);
  assert.match(css, /align-items:\s*center/);
  assert.match(css, /object-position:\s*50%\s+40%/);
  assert.doesNotMatch(css, /translateY\(3px\)/);
  assert.doesNotMatch(css, /height:\s*1\.4rem/);
});

test("calendar controls are 44px touch targets, stacked on phone, paper/sycamore, no bootstrap", () => {
  const css = read("styles.css");
  const html = read("calendar/index.html");
  assert.match(css, /\.cal-controls[\s\S]*min-height:\s*44px/);
  assert.match(css, /@media\s*\(\s*max-width:\s*40rem\s*\)/);
  assert.match(css, /--paper/);
  assert.match(css, /--bark/);
  assert.match(css, /--leaf/);
  assert.doesNotMatch(css, /maple/i);
  assert.doesNotMatch(css, /bootstrap/i);
  assert.doesNotMatch(css, /cdn\.jsdelivr.*bootstrap/i);
  assert.doesNotMatch(css, /bootstrap\.min/);
  assert.doesNotMatch(html, /cdn\.jsdelivr.*bootstrap/i);
  assert.doesNotMatch(html, /class="btn btn-/);
  assert.doesNotMatch(html, /bootstrap\.min/);
  assert.doesNotMatch(html, /bootstrap/i);
  assert.doesNotMatch(html, /maple/i);
});
test("Sources fieldset has Fayfield + Court checked and five county opt-in sources", () => {
  const html = read("calendar/index.html");
  const match = html.match(/<fieldset>\s*<legend>Sources<\/legend>[\s\S]*?<\/fieldset>/);
  assert.ok(match, "Sources fieldset present");
  const fieldset = match[0];
  const nameCount = (fieldset.match(/Fayfield Community/g) || []).length;
  assert.equal(nameCount, 1);
  assert.match(fieldset, /<label><input type="checkbox" name="source" value="fayfield-community" checked>\s*Fayfield Community<\/label>/);
  assert.match(fieldset, /<label><input type="checkbox" name="source" value="york-county-court" checked>\s*York County Court<\/label>/);
  for (const id of [
    "york-county-main",
    "york-county-parks",
    "york-county-commissioners",
    "york-county-human-services",
    "york-county-aging",
  ]) {
    assert.match(fieldset, new RegExp(`name="source" value="${id}"(?![^>]*checked)`));
    assert.match(fieldset, new RegExp(`value="${id}">[^<]+`));
  }
  assert.doesNotMatch(fieldset, /<summary>Fayfield Community<\/summary>/);
});

test("every live page cache-busts styles.css with an 8-char query", () => {
  for (const rel of pages) {
    const html = read(rel);
    assert.match(html, /href="styles\.css\?v=[0-9a-fA-F]{8}"/, rel);
    assert.doesNotMatch(html, /href="styles\.css"/, rel);
  }
});

test("calendar CSS uses custom paper widgets and a modest two-column desktop stack", () => {
  const css = read("styles.css");
  assert.match(css, /\.cal-controls input\[type=["']checkbox["']\][\s\S]{0,500}appearance:\s*none/);
  assert.match(css, /\.cal-controls input\[type=["']radio["']\][\s\S]{0,500}appearance:\s*none/);
  assert.match(css, /body:has\(\.cal-controls\)[\s\S]{0,80}max-width:\s*48rem/);
  assert.match(css, /@media\s*\(\s*min-width:\s*(?:40\.01rem|48rem)\s*\)[\s\S]*?\.cal-controls[\s\S]*?grid-template-columns/);
});

test("calendar filters are a closed details overlay wrapping the form", () => {
  const html = read("calendar/index.html");
  assert.match(html, /<details class="cal-filters">/);
  assert.doesNotMatch(html, /<details class="cal-filters"[^>]*\sopen\b/);
  assert.match(html, /<summary>[\s\S]*Filters[\s\S]*<\/summary>/);
  assert.match(html, /<details class="cal-filters">[\s\S]*<form class="cal-controls" id="cal-controls">[\s\S]*<\/form>[\s\S]*<\/details>/);
  assert.doesNotMatch(html, /<\/details>\s*<form class="cal-controls"/);
  assert.doesNotMatch(html, /<form class="cal-controls"[^>]*>[\s\S]*<details class="cal-filters"/);
  assert.equal((html.match(/<details class="cal-filters">/g) || []).length, 1);
  assert.equal((html.match(/class="cal-filter-bar"/g) || []).length, 1);
});

test("calendar filter overlay CSS is absolute and does not take document flow", () => {
  const css = read("styles.css");
  assert.match(css, /\.cal-filters\[open\]/);
  assert.match(css, /\.cal-filters\[open\]\s+\.cal-controls[\s\S]*position:\s*absolute/);
  assert.match(css, /\.cal-filter-bar[\s\S]*position:\s*relative/);
  assert.match(css, /\.cal-filters\[open\]\s+\.cal-controls[\s\S]*margin:\s*0/);
  assert.doesNotMatch(css, /bootstrap/i);
  assert.doesNotMatch(css, /maple/i);
});

test("calendar ui updates filter meta and closes overlay on Escape and outside pointer", () => {
  const js = read("calendar/ui.js");
  assert.match(js, /cal-filters-meta/);
  assert.match(js, /No sources/);
  assert.match(js, /Escape/);
  assert.match(js, /pointerdown/);
  assert.match(js, /SNAPSHOT_URL|calendar-snapshot\.json|snapshot/);
  assert.match(js, /As of/);
  const html = read("calendar/index.html");
  assert.match(html, /Nothing on the calendar yet/);
  assert.match(html, /rather than make something up/);
  assert.match(html, /class="cal-empty"/);
  assert.match(js, /Nothing on the calendar yet/);
  assert.match(js, /rather than make something up/);
});

test("calendar page cache-busts calendar.js and calendar/ui.js with 8-char queries", () => {
  const html = read("calendar/index.html");
  assert.match(html, /src="calendar\.js\?v=[0-9a-fA-F]{8}"/);
  assert.match(html, /src="calendar\/ui\.js\?v=[0-9a-fA-F]{8}"/);
  assert.doesNotMatch(html, /src="calendar\.js"/);
  assert.doesNotMatch(html, /src="calendar\/ui\.js"/);
});

test("main body links use sycamore leaf, not browser blue", () => {
  const css = read("styles.css");
  assert.match(css, /main\s+a\s*\{[^}]*color:\s*var\(--leaf\)/);
  assert.match(css, /main\s+a:visited\s*\{[^}]*color:\s*var\(--leaf\)/);
  const mainLinkBlocks = [...css.matchAll(/main\s+a(?:\:visited)?\s*\{[^}]*\}/g)].map((m) => m[0]);
  assert.ok(mainLinkBlocks.length >= 2, "main a and main a:visited present");
  for (const block of mainLinkBlocks) {
    assert.doesNotMatch(block, /#00(?:00ff)?\b/i);
    assert.doesNotMatch(block, /#0000ff/i);
    assert.doesNotMatch(block, /rgb\(\s*0\s*,\s*0\s*,\s*255\s*\)/i);
    assert.doesNotMatch(block, /rgba\(\s*0\s*,\s*0\s*,\s*255\b/i);
    assert.doesNotMatch(block, /hsl\(\s*240\b/i);
    assert.doesNotMatch(block, /\bblue\b/i);
  }
});

test("styles.css cache-bust token is SHA256 first 8 hex", () => {
  const crypto = require("node:crypto");
  const hash = crypto
    .createHash("sha256")
    .update(fs.readFileSync(path.join(root, "styles.css")))
    .digest("hex")
    .slice(0, 8);
  assert.notEqual(hash, "cb4f0149");
  assert.match(hash, /^[0-9a-f]{8}$/);
  for (const rel of pages) {
    const html = read(rel);
    assert.match(html, new RegExp(`href="styles\\.css\\?v=${hash}"`), rel);
  }
});
