// Build the marketing site from Factory Design's design/src/site.html (copied, never edited).
// Writes site/index.html and site/public/*. Vite serves (5191) and builds (site/dist) it.
// Env: DEMO_URL  "Try the demo" target. Default http://localhost:5190/ ; combined build uses ./demo/
//      HERO_PHONE path of a phone image that replaces the design-crop hero phone (img/s6-logging.png).
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { READS_GALLERY_HTML, READS_GALLERY_CSS } from "./reads-gallery.mjs";
import { DATA_SECTION_HTML, DATA_SECTION_CSS, HERO_LINE_HTML } from "./data-section.mjs";
const ROOT = resolve(new URL("..", import.meta.url).pathname);
const D = `${ROOT}/design`, SITE = `${ROOT}/site`, PUB = `${SITE}/public`;
const DEMO_URL = process.env.DEMO_URL ?? "http://localhost:5190/";
const HERO_PHONE = process.env.HERO_PHONE ?? "";
const brand = JSON.parse(readFileSync(`${ROOT}/brand.config.json`, "utf8"));

rmSync(PUB, { recursive: true, force: true });
mkdirSync(`${PUB}/brand`, { recursive: true });
mkdirSync(`${PUB}/fonts`, { recursive: true });
mkdirSync(`${PUB}/img`, { recursive: true }); // only images the final HTML uses are copied (below)
for (const [name, rel] of Object.entries(brand.files)) cpSync(`${ROOT}/${rel}`, `${PUB}/brand/${name}`);
// tokens.css without its comments (design notes are not published).
writeFileSync(`${PUB}/tokens.css`, readFileSync(`${D}/tokens.css`, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\n\s*\n+/g, "\n"));
writeFileSync(`${PUB}/site.css`, readFileSync(`${D}/src/site.css`, "utf8").replace('@import url("../tokens.css");', '@import url("tokens.css");'));
writeFileSync(`${PUB}/robots.txt`, "User-agent: *\nDisallow: /\n");

// Fonts: local copies of Inter, Source Serif 4 and JetBrains Mono (latin).
const FS = `${SITE}/node_modules/@fontsource`;
const fonts = [["Inter", "inter", [[400, "normal"], [500, "normal"], [600, "normal"], [700, "normal"]]],
  ["Source Serif 4", "source-serif-4", [[400, "normal"], [600, "normal"]]],
  ["JetBrains Mono", "jetbrains-mono", [[400, "normal"], [500, "normal"]]]];
let css = "/* Local fonts (copied from @fontsource). */\n";
for (const [family, pkg, faces] of fonts) for (const [w, st] of faces) {
  const f = `${pkg}-latin-${w}-${st}.woff2`;
  if (!existsSync(`${FS}/${pkg}/files/${f}`)) continue;
  cpSync(`${FS}/${pkg}/files/${f}`, `${PUB}/fonts/${f}`);
  css += `@font-face{font-family:"${family}";font-style:${st};font-weight:${w};font-display:swap;src:url("fonts/${f}") format("woff2")}\n`;
}
css += `.tnum,.n,table{font-variant-numeric:tabular-nums}\n`;
writeFileSync(`${PUB}/fonts.css`, css);

if (HERO_PHONE) cpSync(HERO_PHONE, `${PUB}/img/hero-phone-cnc3.png`);

let h = readFileSync(`${D}/src/site.html`, "utf8");
const n = (re) => (h.match(re) || []).length;
const counts = { demo: n(/href="demo\/"/g) };
h = h.replaceAll('href="demo/"', `href="${DEMO_URL}"`);
h = h.replace('<link rel="icon" href="img/favicon.svg" type="image/svg+xml">',
  '<link rel="icon" href="brand/favicon.svg" type="image/svg+xml">\n<link rel="icon" href="brand/favicon-32.png" sizes="32x32" type="image/png">\n<link rel="icon" href="brand/favicon-16.png" sizes="16x16" type="image/png">\n<link rel="apple-touch-icon" href="brand/apple-touch-icon.png">');
h = h.replaceAll('src="img/lockup-horizontal-light.svg"', 'src="brand/logo-light.svg"').replaceAll('src="img/lockup-horizontal-dark.svg"', 'src="brand/logo-dark.svg"')
     .replaceAll('src="img/mark.svg"', 'src="brand/mark.svg"').replaceAll('src="img/mark-dark.svg"', 'src="brand/mark-dark.svg"');
h = h.replace('<link rel="stylesheet" href="site.css">', '<link rel="stylesheet" href="fonts.css">\n<link rel="stylesheet" href="site.css">');
h = h.replace('aria-label="Join the waitlist (design only)"', 'aria-label="Join the waitlist (example form, not live)"')
     .replace('<span class="fine">Design only. This form does not send anything.</span>', '<span class="fine"><b>Example form · not live.</b> This form does not send anything.</span>');
if (HERO_PHONE) h = h.replace('<img class="phone" src="img/s6-logging.png" alt="Phone screen: a machine logging live, with speed, load, parts and uptime.">',
  '<img class="phone" src="img/hero-phone-cnc3.png" alt="Phone screen from the PanelPal demo: CNC mill 1 running, with the screen its camera reads and each value. Example data.">');
// Copy fixes (approved): cost wording, and a "Planned" label on every promise that is not yet a product fact.
const must = (from, to) => { if (!h.includes(from)) throw new Error(`copy fix: text not found: ${from}`); h = h.replace(from, to); };
// 20 Nov (sam-eee): no camera price in the setup flow ("Feed" row). Was "Target cost about $10".
must("<b>Camera, about $10</b>", "<b>PanelPal camera</b>");
// 31 Oct 17:33 (Catalin): no "Planned" labels anywhere on the site (plans list, offer lines, privacy cards).
// Camera images with no text over them (tools/camera): the hero CNC view and the growth chamber view.
must('<img class="cam" src="img/cnc-hmi-camera-view.png" alt="Camera view of a CNC mill operator screen. Spindle speed, spindle load, parts today and alarm are each boxed and labelled with a confidence score. Example data.">',
  '<img class="cam" src="img/cnc-hmi-camera-clean.png" alt="Camera view of a CNC mill operator screen. Spindle speed, spindle load, parts today and alarm are each boxed. Example data.">');
must('<img src="img/camera-view.jpg" alt="Camera view of a growth chamber controller with four boxed values and confidence scores">',
  '<img src="img/camera-view-clean.jpg" alt="Camera view of a growth chamber controller with four boxed values">');
// Hardware: the smaller case (img-011) is the current case. It replaces img-007. No separate "next" figure. No chip names.
must('<figure class="c"><div class="im"><img src="img/img-007.jpg" alt="Two white camera cases on base plates, one tilted back on its hinge"></div><figcaption><b>Current case</b>Tilt hinge with a bolt, base plate, USB-C on top.</figcaption></figure>',
  '<figure class="c c2"><div class="im"><img src="img/img-011.jpg" alt="Small white camera case with a round lens window, alone and on a magnetic stand"></div><figcaption><b>Current case</b>About 25 × 30 × 19 mm, with a status light and a magnetic stand.</figcaption></figure>');
must('\n    <figure class="c"><div class="im"><img src="img/img-011.jpg" alt="Proposed small white camera case with a round lens window, alone and on a magnetic stand"></div><figcaption><b>Next: a smaller case</b>About 25 × 30 × 19 mm, with a status light and a magnetic stand.</figcaption></figure>', "");
// 30 Oct 22:01 (Catalin): remove the inside (exploded) view of the camera, with its caption. img-012 is then not shipped.
must('\n    <figure class="c"><div class="im"><img src="img/img-012.jpg" alt="Exploded view of the proposed case and its parts"></div><figcaption><b>Inside</b>An ESP32-S3 board and a small camera module, held by two M2 screws.</figcaption></figure>', "");
h = h.replace("</head>", '<style>.hw .c2{grid-column:span 6;justify-self:center;width:calc(50% - 10px)}@media (max-width:760px){.hw .c2{grid-column:span 2;width:calc(50% - 7px)}}</style>\n</head>');
if (/esp32|xiao/i.test(h)) throw new Error("chip name in site HTML");
// Make every remaining form inert, too.
h = h.replace(/<form(?![^>]*onsubmit)/g, '<form onsubmit="return false"');
if (!/name="robots" content="noindex/.test(h)) h = h.replace("<head>", '<head>\n<meta name="robots" content="noindex, nofollow">');
// 30 Oct 22:38 (Catalin via COF): the #join form opened an email to contact@panelpal.co.uk (mailto, no form service).
// 20 Nov (sam-eee): the #join form now sends through Web3Forms, which emails each request to contact@panelpal.co.uk.
// The access key is public by design (it only lets this form send to our inbox). The "botcheck" box is a hidden spam trap.
// With JavaScript on, the page sends it and shows the result in place. With JavaScript off, it posts to Web3Forms directly.
const WEB3FORMS_KEY = "ece81194-f64e-46e6-8ba4-3b2ec0afff4e";
must(`    <form class="wl" onsubmit="return false" aria-label="Join the waitlist (example form, not live)">
      <label>Work email<input type="email" placeholder="you@example.com"></label>
      <label>What do you want to monitor?<select><option>`,
`    <form class="wl" id="join-form" action="https://api.web3forms.com/submit" method="post" aria-label="Contact us">
      <input type="hidden" name="access_key" value="${WEB3FORMS_KEY}">
      <input type="hidden" name="subject" value="PanelPal contact request">
      <input type="hidden" name="from_name" value="PanelPal website">
      <input type="checkbox" name="botcheck" class="wl-trap" tabindex="-1" autocomplete="off" aria-hidden="true">
      <label>Name<input type="text" name="name" autocomplete="name" required></label>
      <label>Work email<input type="email" name="email" placeholder="you@example.com" autocomplete="email" required></label>
      <label>What do you want to monitor?<select name="monitor"><option>`);
must(`      <button class="btn primary" type="submit">Join the waitlist</button>
      <span class="fine"><b>Example form · not live.</b> This form does not send anything.</span>
    </form>`,
`      <label>Tell us about your site and how we can help<textarea name="message" rows="4"></textarea></label>
      <button class="btn primary" type="submit">Send</button>
      <p class="wl-status" role="status" aria-live="polite"></p>
      <p class="wl-mail">Prefer email? Write to us at <a href="mailto:contact@panelpal.co.uk">contact@panelpal.co.uk</a></p>
      <span class="fine">We use your details only to reply to you.</span>
    </form>
    <script>(function(){var f=document.getElementById("join-form"),s=f.querySelector(".wl-status"),b=f.querySelector("button[type=submit]");
f.addEventListener("submit",function(e){e.preventDefault();b.disabled=true;s.className="wl-status";s.textContent="Sending…";
fetch(f.action,{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify(Object.fromEntries(new FormData(f)))})
.then(function(r){return r.json().then(function(j){if(!r.ok||!j.success)throw 0})})
.then(function(){f.reset();s.className="wl-status ok";s.textContent="Thank you, our team will be in touch soon."})
.catch(function(){s.className="wl-status err";s.innerHTML='That did not send. Please try again, or email <a href="mailto:contact@panelpal.co.uk">contact@panelpal.co.uk</a>.'})
.finally(function(){b.disabled=false})})})()</script>`);
h = h.replace("</head>", "<style>form.wl textarea{border:1px solid var(--color-border-strong);border-radius:var(--radius-control);padding:10px 12px;font:inherit;background:#fff;width:100%;margin-top:6px;resize:vertical}.wl-trap{display:none}.wl-mail{margin:6px 0 0;padding-top:14px;border-top:1px solid var(--color-border);font-size:var(--type-base)}.wl-mail a{font-weight:600;color:var(--color-accent-strong)}.wl-status{margin:0;font-size:var(--type-sm);min-height:0}.wl-status:empty{display:none}.wl-status.ok{color:var(--color-running)}.wl-status.err{color:#b42d2d}</style>\n</head>");
if (!h.includes('<a href="mailto:contact@panelpal.co.uk">contact@panelpal.co.uk</a>')) throw new Error("join: visible contact link missing");
// 30 Oct 22:58 (Reviewer H1, allowed by Catalin): no waitlist. The CTA and both buttons point to "Book a demo" (email).
// 31 Oct 17:33 (Catalin): the hero keeps one "Book a demo" button and "Try the demo". Remove the second (soft) button.
must('\n      <a class="btn soft" href="#join">Join the waitlist</a>', '');
must('<a class="btn ghost" href="#join">Join the waitlist</a>', '<a class="btn ghost" href="#join">Book a demo</a>');
must('Book a short demo, or join the waitlist and we will tell you when it is ready.', 'Book a short demo. Tell us what you want to monitor and we will reply by email.');
if (/wait ?list/i.test(h.replace(/<[^>]*>/g, ""))) throw new Error("visible 'waitlist' text left in site HTML");
// Title, meta description, banner, footer and plans note: remove only that one word (the match texts below must quote the source). "Demo" and "example data" stay.
// Camera section (Grow Chamber 3 card): temperature labels that match the photo. Same order and the same colours (high, check, low).
must('<span style="background:var(--color-cam-high)">0.97 high</span><span style="background:var(--color-cam-mid)">0.81 check</span><span style="background:var(--color-cam-low)">0.42 low</span>',
  '<span style="background:var(--color-cam-high)">30 °C high</span><span style="background:var(--color-cam-mid)">22 °C check</span><span style="background:var(--color-cam-low)">15 °C low</span>');
// 30 Oct 22:01 (Catalin): img-008 re-rendered with the current case (assets/img copy). Alt text follows the new image.
// 30 Oct 22:33 (Catalin): img-008 lens turned toward the screen. img-009 is the ORIGINAL design image again (camera on a gooseneck above the screen).
must('<img src="img/img-008.jpg" alt="White camera case on a lab bench, angled up at an incubator touchscreen">',
  '<img src="img/img-008.jpg" alt="Small white cube camera on a round stand on a lab bench, with its lens turned toward an incubator touchscreen">');
must('<img src="img/img-009.jpg" alt="Two growth chambers, each with a small white camera on a gooseneck arm in front of the controller">',
  '<img src="img/img-009.jpg" alt="Two growth chambers. On each, a small white camera on a gooseneck arm sits above the controller screen and points down at it">');
// 1 Nov (Catalin): "What it can read" gets a gallery of small instrument illustrations above the table (tools/reads-gallery.mjs).
must('<p>Each value gets the reader that suits it. The vision model marks the area one time, and you confirm it.</p></div>\n  <table class="tbl">',
  '<p>Each value gets the reader that suits it. The vision model marks the area one time, and you confirm it.</p></div>\n  ' + READS_GALLERY_HTML + '<table class="tbl">');
h = h.replace("</head>", `<style>${READS_GALLERY_CSS}</style>\n</head>`);
// 4 Nov (Catalin): on-prem or cloud. Customers keep production data private, so the site shows an on-prem option first.
// 20 Nov (sam-eee): the cloud is now the main option and on-prem the extra (tools/data-section.mjs).
// A hero line, a nav link, a "Your data, your choice" section after "How it works" (tools/data-section.mjs), and the privacy card.
must('<a href="#how">How it works</a>', '<a href="#how">How it works</a><a href="#data">Your data</a>');
must('\n    <div class="where">', HERO_LINE_HTML + '\n    <div class="where">');
// 20 Nov (sam-eee): remove the site-type tags under the hero line (Machine shops, Labs, Kitchens ...).
must('\n    <div class="where"><span>Machine shops</span><span>Labs</span><span>Kitchens</span><span>Growth rooms</span><span>Plant rooms</span><span>Any site with a screen or gauge</span></div>', '');
must('<section id="camera">', DATA_SECTION_HTML + '<section id="camera">');
must('<div class="card"><h3>Where your data is stored</h3><p>We will confirm this before launch. Ask us about it in your demo.</p></div>',
  '<div class="card"><h3>You choose where it is stored</h3><p>Our cloud, or a PanelPal computer on site. <a href="#data">Compare</a></p></div>');
h = h.replace("</head>", `<style>${DATA_SECTION_CSS}</style>\n</head>`);
// 20 Nov (sam-eee): no serif italics anywhere. Accent phrases in serif headings stay coloured but upright.
h = h.replace("</head>", "<style>.hero h1 em,.dp-quote .q em{font-style:normal}</style>\n</head>");
// 20 Nov (sam-eee): the "Security standards" section was removed (was tools/security-section.mjs).
if (/\bcertified\b(?! yet)/i.test(h.replace(/<[^>]*>/g, ""))) throw new Error("'certified' claim in site HTML: PanelPal holds no certificate yet");
const mustAll = (from, to, n) => { const c = h.split(from).length - 1; if (c !== n) throw new Error(`wording fix: expected ${n} x ${from}, found ${c}`); h = h.replaceAll(from, to); };
// 30 Oct 22:32 (Catalin, voice): "What it can read" table. Keep the table and every row. Remove the Status column. All rows show as current functionality.
must("<th>Examples</th><th>Status</th></tr>", "<th>Examples</th></tr>");
{ const before = h.length;
  h = h.replace(/<td><span class="pill (?:run|next|later)"><span class="dot"><\/span>(?:In the demo|Next|Later)<\/span><\/td><\/tr>/g, "</tr>");
  for (const r of ["Dial", "Counter", "Colour", "Level", "Presence", "Motion", "Count", "Area"]) must(`<tr><td>${r}</td>`, `<tr class="built"><td>${r}</td>`);
  if (/In the demo<\/span><\/td>|>Next<\/span><\/td>|>Later<\/span><\/td>/.test(h) || h.length === before) throw new Error("reads table: status cells not removed"); }
mustAll("<title>PanelPal · the everything sensor (concept demo)</title>", "<title>PanelPal · the everything sensor (demo)</title>", 1);
mustAll("Concept demo with example data.", "Demo with example data.", 1);
mustAll("<b>Concept demo · example data.</b>", "<b>Demo · example data.</b>", 1);
mustAll("<span>Concept demo · example data</span>", "<span>Demo · example data</span>", 1);
mustAll("Plans are a concept and can change.", "Plans can change.", 1);
if (/planned/i.test(h)) throw new Error("'Planned' left in site HTML");
if (/concept/i.test(h)) throw new Error("word left in site HTML: " + h.match(/.{0,40}concept.{0,40}/i)[0]);
// 1 Nov (Catalin): remove the "Demo · example data" banner at the top of the page. The footer and meta description still say it.
must('<div class="banner"><b>Demo · example data.</b> All machines, names and numbers on this page are examples.</div>\n', "");
if (h.includes('class="banner"')) throw new Error("top banner still in site HTML");
// 20 Nov (sam-eee): the footer no longer says "Demo · example data".
must("\n  <span>Demo · example data</span>", "");
// 20 Nov (sam-eee): position PanelPal as an AI analytics company (no downtime, no engineer), not a camera company with a dashboard.
// The AI and its insights lead; the cameras are how it reads the machines. "No downtime" means no machine downtime to set up.
must("<title>PanelPal · the everything sensor (demo)</title>", "<title>PanelPal · AI analytics for any machine, no downtime, no engineer (demo)</title>");
must(`<meta name="description" content="Point a small camera at any machine screen or gauge. PanelPal's AI builds a live dashboard for your site. Demo with example data.">`,
  `<meta name="description" content="AI analytics for any machine, gauge or data point. PanelPal's AI builds your dashboard and watches every machine, with no wiring, no downtime and no engineer. Demo with example data.">`);
must('<p class="eyebrow">The everything sensor</p>', '<p class="eyebrow">Any machine, gauge or data point</p>');
must("<h1>Your machines already show their numbers. <em>PanelPal reads them.</em></h1>", "<h1>AI analytics for every machine. <em>No downtime, no engineer.</em></h1>");
must('<p class="lead">Point a small camera at any screen or gauge. Our AI builds a live dashboard for your site. No wiring and no engineer.</p>',
  `<p class="lead">Our AI builds your dashboard and watches every machine for drift, stops and alarms. It reads the screens you already have.</p>`);
must('<a href="#how">How it works</a>', '<a href="#how">How it works</a><a href="#insights">AI insights</a>');
must('<a href="#camera">The camera</a>', "");
must('<h2 class="h2">The AI does the setup. Cameras feed the dashboard.</h2>', '<h2 class="h2">The AI does the setup. You get the answers.</h2>');
must("<h3>Feed it with cameras</h3><p>Put a small camera in front of each screen or gauge. It reads the values every few seconds.</p>",
  "<h3>Connect our cameras</h3><p>One small camera in front of each screen. No wiring, no downtime.</p>");
must(`    <div class="node end"><b>On-device reading</b><span>reads only the mapped values, every few seconds</span></div>\n  </div>`,
  `    <div class="node end"><b>On-device reading</b><span>reads only the mapped values, every few seconds</span></div>
    <div class="lbl">Insights</div>
    <div class="node"><b>Site history</b><span>30+ days per machine</span></div>
    <div class="node hi"><b>AI review</b><span>drift, unlogged stops, idle time, alarms</span></div>
    <div class="node end"><b>Suggestion card</b><span>issue, cause, one action</span></div>
  </div>`);
must('<p class="eyebrow">AI suggestions</p>', '<p class="eyebrow">AI insights</p>');
must('<p class="eyebrow">Camera hardware</p><h2 class="h2">It sits in front of the display. It never touches the machine.</h2>',
  '<p class="eyebrow">Hardware</p><h2 class="h2">Sits in front of the display. Never touches the machine.</h2>');
must("<span>One camera on one screen. See your first live numbers in an afternoon.</span>", "<span>Live numbers and AI insights in an afternoon.</span>");
must("<b>Nothing to wire</b><span>The camera does not connect to the machine. Remove it and nothing changes.</span>",
  "<b>No downtime</b><span>Nothing wired in. Machines keep running.</span>");
must('<h2 class="h2">What the camera sees, and what we keep.</h2>', '<h2 class="h2">Your data is yours. And it stays private.</h2>');
must('<h2 class="h2">See PanelPal on your own screens.</h2>', '<h2 class="h2">Contact us</h2>');
// 20 Nov (sam-eee): the entry plan is "Basic", with no mention of it being free.
must("<h3>Free</h3>", "<h3>Basic</h3>");
must("<p>The AI setup and the first dashboard are free. Plans can change.</p>", "<p>AI setup on every plan. Plans can change.</p>");
// 20 Nov (sam-eee): the cameras read several times a second (was "every 2 seconds" / "every few seconds").
must("<b>The camera reads every 2 seconds</b>", "<b>Reads several times a second</b>");
must("<span>reads only the mapped values, every few seconds</span>", "<span>several times a second</span>");
must("<span>values the cameras read every few seconds, including", "<span>values and alarms, several times a second");
if (/\bfree\b|every (few|2) seconds/i.test(h.replace(/<[^>]*>/g, ""))) throw new Error("'free' or the old reading rate left in site HTML");
// 20 Nov (sam-eee): the closing section is a plain "Contact us": heading and form only. No intro line, no buttons or "Try the demo" link above the form.
{ const a = h.indexOf('<h2 class="h2">Contact us</h2>'), b = h.indexOf('</div></div>', a);
  if (a < 0 || b < 0 || !h.slice(a, b).includes('class="ctas"')) throw new Error("join: intro and links above the form not found");
  h = h.slice(0, a) + '<h2 class="h2">Contact us</h2>' + h.slice(b + '</div>'.length); }
// Section order: How it works, AI insights, Your data, What it reads, Camera view, Hardware, then the rest.
const cut = (id) => { const a = h.indexOf(`<section id="${id}">`), b = h.indexOf("</section>", a) + "</section>\n\n".length;
  if (a < 0 || h.slice(b - 12, b) !== "</section>\n\n") throw new Error(`section order: cannot cut #${id}`); const sec = h.slice(a, b); h = h.slice(0, a) + h.slice(b); return sec; };
{ const ins = cut("insights"); must('<section id="data">', ins + '<section id="data">');
  const cam = cut("camera"); must('<section id="hardware">', cam + '<section id="hardware">'); }
// 20 Nov (sam-eee): the privacy section is about ownership and privacy: the data is theirs and it is kept private.
{ const a = h.indexOf('<div class="priv">'), b = h.indexOf("</div>\n</div></section>", a);
  if (a < 0 || b < 0 || !h.slice(a, b).includes("The camera sees only the screen")) throw new Error("privacy: card grid not found");
  h = h.slice(0, a) + `<div class="priv">
    <div class="card"><h3>Yours, always</h3><p>You own every reading. Export or delete it any time.</p></div>
    <div class="card"><h3>Private to your company</h3><p>Encrypted, and only the people you invite can see it.</p></div>
    <div class="card"><h3>Never sold or shared</h3><p>We never sell your data or pass it to anyone else.</p></div>
    <div class="card"><h3>You choose where it lives</h3><p>Our cloud, or our AI box on your site. <a href="#data">Compare</a></p></div>
  ` + h.slice(b); }
// 20 Nov (sam-eee): shorter copy everywhere, and no captions or "example data" labels under images.
for (const [from, to] of [
  ["<p>The AI does the work of a controls engineer: it finds what is on your floor, what to measure and how to show it.</p>", "<p>It does the work of a controls engineer.</p>"],
  ["<p>Type a sentence. Add a floor plan or a few photos if you like. The AI finds and names your machines.</p>", "<p>Type a sentence, or add a floor plan or photos. The AI finds your machines.</p>"],
  ["<p>The AI suggests what to track on each machine and builds the dashboard. Change it by asking in plain English.</p>", "<p>The AI picks what to track and builds it. Change it in plain English.</p>"],
  ["<div class=\"lbl\">Set up: you describe the site, the AI builds the rest</div>", "<div class=\"lbl\">Set up</div>"],
  ["<b>Describe it</b><span>words, a floor plan or photos of the floor</span>", "<b>Describe it</b><span>words, a floor plan or photos</span>"],
  ["<b>AI site model</b><span>finds each machine, picks the values to track, plans where cameras go</span>", "<b>AI site model</b><span>finds machines, picks values, plans cameras</span>"],
  ["<b>Your dashboard</b><span>layout and data model, edit it in plain English, alerts and reports</span>", "<b>Your dashboard</b><span>edit in plain English, alerts and reports</span>"],
  ["<div class=\"lbl\">Feed: cameras read each machine's own screen</div>", "<div class=\"lbl\">Read</div>"],
  ["<b>PanelPal camera</b><span>points at a screen or gauge, no wiring</span>", "<b>PanelPal camera</b><span>points at a screen or gauge</span>"],
  ["<b>Vision model maps the screen</b><span>one time per machine, finds and labels each value</span>", "<b>Vision model maps it</b><span>once per machine</span>"],
  ["<h2 class=\"h2\">An assistant that watches every screen for you.</h2>", "<h2 class=\"h2\">An assistant that watches every screen.</h2>"],
  ["<p class=\"lead\" style=\"margin-top:14px\">Each card names the machine, the likely cause and one action. It can catch a warning that only ever showed on the machine's own screen.</p>", "<p class=\"lead\" style=\"margin-top:14px\">Each card names the machine, the likely cause and one action.</p>"],
  ["<b>Site history</b><span>30 or more days for each machine, by program and shift</span>", "<b>Site history</b><span>30+ days per machine</span>"],
  ["<b>AI review</b><span>compares now with normal: drift, stops that nobody logged, idle time, repeat alarms</span>", "<b>AI review</b><span>compares now with normal</span>"],
  ["<div class=\"node\"><b>Suggestion card</b><span>the issue, its likely cause and one action</span>", "<div class=\"node\"><b>Suggestion card</b><span>issue, cause, one action</span>"],
  ["<p>Each value gets the reader that suits it. The vision model marks the area one time, and you confirm it.</p>", "<p>Each value gets the right reader. You confirm it once.</p>"],
  ["Growth chamber and incubator controllers, balances, pH and EC meters, temperature controllers, motor drive displays, old PCs that run instrument software", "Controllers, balances, pH meters, drive displays"],
  ["Hydraulic, pneumatic and vacuum gauges, CO₂ cylinder regulators, autoclave pressure, liquid nitrogen dewar levels, bimetal thermometers", "Pressure and vacuum gauges, regulators, thermometers"],
  ["Water, gas and electricity meters, hour meters, mechanical cycle counters", "Utility meters, hour meters, cycle counters"],
  ["Stack lights and panel LEDs, chamber lights on or off, pH colour change, leaf greenness", "Stack lights, panel LEDs, colour changes"],
  ["Sight glasses, hydroponic tanks, carboys, coolant and waste containers", "Sight glasses, tanks, coolant containers"],
  ["A tray on a shelf, a door or guard open, a part in a fixture", "A tray on a shelf, a guard open, a part in place"],
  ["<b>The AI marks each value one time</b><span>It puts a box around each value and gives it a name. You confirm the boxes.</span>", "<b>The AI marks each value once</b><span>You confirm the boxes.</span>"],
  ["<span>It reads only the boxed values. It does this on the device.</span>", "<span>Only the boxed values, on the device.</span>"],
  ["<b>Each reading has a confidence score</b><span>A low score tells you to check the reading. If the camera loses the screen, the app shows \"No signal\". It does not guess.</span>", "<b>Every reading has a confidence score</b><span>Low scores are flagged. No screen, no guess.</span>"],
  ["<span>You can compare any number with the image it came from.</span>", "<span>Check any number against its image.</span>"],
  ["<p class=\"lead\" style=\"margin-top:14px\">A lab that wants one centrifuge on record can skip the layout. Describe it, point a camera at its display, and the app logs every run. Add more devices, or a whole site, later.</p>", "<p class=\"lead\" style=\"margin-top:14px\">Point one camera at one display and log every run. Add more later.</p>"],
  ["<h2 class=\"h2\">Every plan gets the layout. Higher plans draw it in more detail.</h2>", "<h2 class=\"h2\">Every plan gets the layout. Higher plans add detail.</h2>"],
  ["<b>Recalibration is included</b><span>If a screen layout changes, the camera maps it again, on every plan.</span>", "<b>Recalibration included</b><span>If a screen changes, it maps it again.</span>"],
  ["\n    <span class=\"pill ex tag\">Example data</span>", ""],
  ["\n    <p class=\"cap\">Example data</p>", ""],
  ["<p class=\"cap\">What the camera sees on a growth room controller · rendered mock-up · example data</p>", ""],
  ["<p>These are rendered mock-ups, not photos.</p>", ""],
  ["<b>On a lab bench</b>About 22 cm from a 7-inch controller, tilted to frame the whole screen.", "<b>On a lab bench</b>"],
  ["<b>At a growth chamber</b>A magnetic gooseneck holds the camera about 19 cm in front of the controller.", "<b>At a growth chamber</b>"],
  ["<b>Current case</b>About 25 × 30 × 19 mm, with a status light and a magnetic stand.", "<b>The reader</b>"],
  ["\n  <p class=\"note\">Colour, level, presence, motion, count and area are simple filters on the same frames. They are indicators, not calibrated measurements, and the app labels them that way.</p>", ""],
  ["<div class=\"price\">Up to 3 machines · example plan</div>", "<div class=\"price\">Up to 3 machines</div>"],
  ]) must(from, to);
if (/example (data|plan)|mock-up/i.test(h.replace(/<[^>]*>/g, ""))) throw new Error("caption or example-data label left in site HTML: " + h.replace(/<[^>]*>/g, "").match(/.{0,40}(example (data|plan)|mock-up).{0,40}/i)[0]);
writeFileSync(`${SITE}/index.html`, h);
// Copy only the img/ files that the final HTML references. Unused design images are not published.
const used = [...new Set([...h.matchAll(/(?:src|href)="(img\/[^"]+)"/g)].map((m) => m[1]))];
for (const p of used) if (!existsSync(`${PUB}/${p}`) && existsSync(`${ROOT}/assets/${p}`)) cpSync(`${ROOT}/assets/${p}`, `${PUB}/${p}`); // our own copies first
for (const p of used) if (!existsSync(`${PUB}/${p}`) && existsSync(`${D}/src/${p}`)) cpSync(`${D}/src/${p}`, `${PUB}/${p}`);
const stray = readdirSync(`${PUB}/img`).filter((f) => !used.includes(`img/${f}`));
if (stray.length) throw new Error(`unused images in site/public/img: ${stray.join(", ")}`);
// Brand: the build fails if site/public/brand holds a file that the final HTML does not use.
const brandUsed = new Set([...h.matchAll(/(?:src|href)="brand\/([^"]+)"/g)].map((m) => m[1]));
const strayBrand = readdirSync(`${PUB}/brand`).filter((f) => !brandUsed.has(f));
if (strayBrand.length) throw new Error(`unused files in site/public/brand: ${strayBrand.join(", ")}`);
const unbranded = [...h.matchAll(/src="(img\/[^"]+)"/g)].map((m) => m[1]).filter((p) => !existsSync(`${PUB}/${p}`));
console.log(`site built: demo links ${counts.demo} -> ${DEMO_URL}; hero phone ${HERO_PHONE ? "replaced" : "kept (design crop)"}; missing images: ${unbranded.length ? unbranded.join(", ") : "none"}`);
