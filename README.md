# CleanMark

URL-tisztító és könyvjelző-kezelő. Eltávolítja a linkekből a követőkódokat (`fbclid`, `gclid`, `utm_*`, `si`, `igshid`, Mailchimp/HubSpot paraméterek stb.), kibontja az átirányításokat (`l.facebook.com/l.php`, `google.com/url`), felismeri a link forrását (Facebook, Google, YouTube, Instagram, LinkedIn, Reddit, GitHub, hírlevél, közvetlen), és a tiszta linket címkékkel, jegyzettel könyvjelzőként elmenti.

A felület magyar nyelvű.

## Részek

| Rész | Hely | Leírás |
|---|---|---|
| Webalkalmazás | `src/` | React 19 + Vite 8 + Tailwind CSS 4, Firebase (Auth + Firestore) háttérrel. A teljes logika a `src/App.jsx` fájlban van. |
| Chrome-bővítmény | `chrome-extension/` | Manifest V3 popup, build nélkül betölthető. Önálló, nem kommunikál a webalkalmazással. |
| Mobil | – | Nincs natív app. A webalkalmazás reszponzív (mobilon alsó navigáció), és bookmarklettel vagy iOS Rövidítéssel is használható (lásd lent). |

### Webalkalmazás fülei

- **Könyvjelzők**: lista, keresés, szűrés forrás / címke / állapot (kedvenc, olvasatlan, tisztított) szerint, szerkesztés, törlés, „röntgen” nézet az eltávolított paraméterekről.
- **Tisztító**: URL beillesztése, valós idejű elemzés és tisztítás, mentés. Mintalinkek a gyors kipróbáláshoz.
- **Plugin**: telepítési útmutató a Chrome-bővítményhez, bemásolható bővítménykód és bookmarklet, mobilos tippek.

## Indítás

### Chrome-bővítmény

1. Nyisd meg a `chrome://extensions` oldalt, és kapcsold be a **Fejlesztői módot**.
2. **Kicsomagolt bővítmény betöltése**, majd válaszd ki a `chrome-extension/` mappát.
3. A bővítmény ikonjára kattintva a popup megtisztítja az aktuális fül URL-jét. A **Mentés** gomb a vágólapra másolja a tiszta linket, és elmenti a könyvjelzőt a `chrome.storage.local`-ba.

Jogosultságok: `activeTab`, `storage`, `clipboardWrite`. A manifestben nincs ikon megadva.

### Webalkalmazás

Követelmény: Node.js (a Vite 8 miatt friss LTS ajánlott).

```bash
npm install
npm run dev       # fejlesztői szerver (http://localhost:5173)
npm run build     # production build a dist/ mappába
npm run preview   # a build kiszolgálása helyben
npm run lint      # oxlint
```

> **Figyelem: a webalkalmazás jelenleg nem indul el** az alábbi ismert hibák miatt.

## Ismert hibák

1. **Tailwind beállítás v3-as, a telepített csomag v4-es.** A `postcss.config.js` a `tailwindcss` plugint használja, a `src/index.css` pedig `@tailwind base/components/utilities` direktívákat. A build ezzel a hibával áll le:
   `It looks like you're trying to use tailwindcss directly as a PostCSS plugin…`
   Javítás: `npm i -D @tailwindcss/postcss`, a `postcss.config.js`-ben `'@tailwindcss/postcss': {}`, az `index.css`-ben `@import "tailwindcss";`. A `tailwind.config.js` és az `autoprefixer` v4 alatt már nem szükséges.
2. **Hiányzik a `firebase` függőség.** Az `App.jsx` importálja a `firebase/app`, `firebase/auth` és `firebase/firestore` modult, de a csomag nincs a `package.json`-ban (`npm i firebase`).
3. **Nincs Firebase konfiguráció.** A kód a `__firebase_config`, `__app_id` és `__initial_auth_token` globális változókat várja (ezeket az a sandbox-környezet adta, ahol a kód eredetileg készült). Helyben üres konfigurációval indul, így a bejelentkezés és a mentés nem működik. Saját Firebase projekt kell hozzá (Anonymous Auth + Firestore), és a konfigurációt be kell kötni, például `import.meta.env` változókon keresztül.

## Adattárolás

- **Webalkalmazás:** Firestore, a `artifacts/{appId}/users/{uid}/bookmarks` gyűjteményben. Az alapértelmezett `appId` értéke `cleanmark-bookmark-app`. A felhasználó névtelen (anonymous) bejelentkezéssel kap azonosítót.
- **Chrome-bővítmény:** `chrome.storage.local`, `bookmarks` kulccsal. Nincs szinkronizálva a webalkalmazással.

## Mobil és gyorsmentés

- **URL-paraméter:** a webalkalmazás az `?add_url=<url>` (vagy `?url=<url>`) paraméterrel megnyitva automatikusan átveszi és megtisztítja a linket.
- **iOS Rövidítések:** egy „URL megnyitása” művelettel, például `https://<app-cím>/?add_url=[Vágólap]`, egyetlen érintéssel menthető a link a Megosztás menüből.
- **Bookmarklet:** a Plugin fülről a könyvjelzősávra húzható. Bármely oldalon megtisztítja az aktuális URL-t, és a vágólapra másolja (mobil böngészőben is működik).

## Projektstruktúra

```
chrome-extension/   manifest.json, popup.html, popup.js
public/             favicon.svg, icons.svg
src/
  App.jsx           teljes alkalmazás: URL-elemző motor, Firebase, UI
  main.jsx          React belépési pont
  index.css         Tailwind direktívák
index.html
vite.config.js
postcss.config.js
tailwind.config.js
.oxlintrc.json
```

## Tisztítási szabályok

Az `App.jsx` tetején találhatók:

- `TRACKING_PARAMS_EXACT`: pontos egyezéssel törölt paraméterek (pl. `fbclid`, `gclid`, `msclkid`, `ttclid`, `mc_cid`, `si`, `ref`, `spm` …).
- `TRACKING_PREFIXES`: előtaggal törölt paraméterek (`utm_`, `hsa_`, `mtm_`, `pk_`, `piwik_`, `gad_`, `__`).
- `SOURCES`: a felismert források és a hozzájuk tartozó színek.

A Chrome-bővítmény (`chrome-extension/popup.js`) egy saját, egyszerűbb paraméterlistát használ.
