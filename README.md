# CleanMark

URL-tisztító és könyvjelző-kezelő. Eltávolítja a linkekből a követőkódokat (`fbclid`, `gclid`, `utm_*`, `si`, `igshid`, Mailchimp/HubSpot paraméterek stb.), kibontja az átirányításokat (`l.facebook.com/l.php`, `google.com/url`), felismeri a link forrását (Facebook, Google, YouTube, Instagram, LinkedIn, Reddit, GitHub, hírlevél, közvetlen), és a tiszta linket címkékkel, jegyzettel könyvjelzőként elmenti.

A felület magyar nyelvű.

**Élő oldal:** https://sotcsa.github.io/CleanMark/

## Részek

| Rész | Hely | Leírás |
|---|---|---|
| Webalkalmazás | `src/` | React 19 + Vite 8 + Tailwind CSS 4. Az adatokat a böngésző `localStorage`-ában tárolja, nincs szerver. A teljes logika a `src/App.jsx` fájlban van. |
| Chrome-bővítmény | `chrome-extension/` | Manifest V3 popup, build nélkül betölthető. Önálló, nem kommunikál a webalkalmazással. |
| Mobil | – | Nincs natív app. A webalkalmazás reszponzív (mobilon alsó navigáció), és bookmarklettel vagy iOS Rövidítéssel is használható (lásd lent). |

### Webalkalmazás fülei

- **Könyvjelzők**: lista, keresés, szűrés forrás / címke / állapot (kedvenc, olvasatlan, tisztított) szerint, szerkesztés, törlés (megerősítéssel), „röntgen” nézet az eltávolított paraméterekről, JSON export.
- **Tisztító**: URL beillesztése, valós idejű elemzés és tisztítás, mentés. Mintalinkek a gyors kipróbáláshoz.
- **Plugin**: telepítési útmutató a Chrome-bővítményhez, bemásolható bővítménykód és bookmarklet, mobilos tippek.

## Indítás

### Chrome-bővítmény

1. Nyisd meg a `chrome://extensions` oldalt, és kapcsold be a **Fejlesztői módot**.
2. **Kicsomagolt bővítmény betöltése**, majd válaszd ki a `chrome-extension/` mappát.
3. A bővítmény ikonjára kattintva a popup megtisztítja az aktuális fül URL-jét. A **Mentés** gomb a vágólapra másolja a tiszta linket, és elmenti a könyvjelzőt a `chrome.storage.local`-ba.

Jogosultságok: `activeTab`, `storage`, `clipboardWrite`. A manifestben nincs ikon megadva. Nem http(s) oldalakon (pl. `chrome://`) a mentés le van tiltva.

### Webalkalmazás

Követelmény: Node.js (a Vite 8 miatt friss LTS ajánlott).

```bash
npm install
npm run dev       # fejlesztői szerver (http://localhost:5173)
npm run build     # production build a dist/ mappába
npm run preview   # a build kiszolgálása helyben
npm run lint      # oxlint
```

### Publikálás

A `main` branchre történő minden push után a `.github/workflows/deploy.yml` GitHub Actions workflow lebuildeli az oldalt, és kiteszi GitHub Pagesre (https://sotcsa.github.io/CleanMark/). Kézzel is indítható az Actions fülön. Mivel az oldal a `/CleanMark/` útvonalon fut, a `vite.config.js`-ben `base: '/CleanMark/'` van beállítva.

## Adattárolás

- **Webalkalmazás:** böngésző `localStorage`, `cleanmark-bookmarks` kulccsal (JSON tömb). Az adatok csak abban a böngészőben érhetők el, ahol mentetted őket; böngészőadatok törlésekor elvesznek, ezért érdemes időnként JSON-ba exportálni. Ugyanazon böngésző több fülén automatikusan szinkronban maradnak.
- **Chrome-bővítmény:** `chrome.storage.local`, `bookmarks` kulccsal. Nincs szinkronizálva a webalkalmazással.

## Mobil és gyorsmentés

- **URL-paraméter:** a webalkalmazás az `?add_url=<url>` (vagy `?url=<url>`) paraméterrel megnyitva automatikusan átveszi és megtisztítja a linket.
- **iOS Rövidítések:** egy „URL megnyitása” művelettel, például `https://sotcsa.github.io/CleanMark/?add_url=[Vágólap]`, egyetlen érintéssel menthető a link a Megosztás menüből.
- **Bookmarklet:** a Plugin fülről a könyvjelzősávra húzható. Bármely oldalon megtisztítja az aktuális URL-t, és a vágólapra másolja (mobil böngészőben is működik).

## Projektstruktúra

```
chrome-extension/   manifest.json, popup.html, popup.js
public/             favicon.svg, icons.svg
src/
  App.jsx           teljes alkalmazás: URL-elemző motor, localStorage tárolás, UI
  main.jsx          React belépési pont
  index.css         Tailwind import (@import "tailwindcss")
index.html
vite.config.js
postcss.config.js   Tailwind 4 (@tailwindcss/postcss)
.oxlintrc.json
```

## Tisztítási szabályok

Az `App.jsx` tetején találhatók:

- `TRACKING_PARAMS_EXACT`: pontos egyezéssel törölt paraméterek (pl. `fbclid`, `gclid`, `msclkid`, `ttclid`, `mc_cid`, `si`, `ref`, `spm` …).
- `TRACKING_PARAMS_BY_HOST`: csak adott oldalakon törölt paraméterek (YouTube: `feature`, `pp`; X/Twitter: `s`, `t`; Amazon: `ref`). Máshol ezeknek tartalmi jelentésük lehet (pl. WordPress `?s=` keresés), ezért ott megmaradnak.
- `TRACKING_PREFIXES`: előtaggal törölt paraméterek (`utm_`, `hsa_`, `mtm_`, `pk_`, `piwik_`, `gad_`, `__`).
- `SOURCES`: a felismert források és a hozzájuk tartozó színek.

A Chrome-bővítmény (`chrome-extension/popup.js`) egy saját, egyszerűbb paraméterlistát használ.
