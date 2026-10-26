# CleanMark

URL-tisztító és könyvjelző-kezelő. Eltávolítja a linkekből a követőkódokat (`fbclid`, `gclid`, `utm_*`, `si`, `igshid`, Mailchimp/HubSpot paraméterek stb.), kibontja az átirányításokat (`l.facebook.com/l.php`, `google.com/url`), felismeri a link forrását (Facebook, Google, YouTube, Instagram, LinkedIn, Reddit, GitHub, hírlevél, közvetlen), és a tiszta linket címkékkel, jegyzettel könyvjelzőként elmenti.

A felület magyar nyelvű.

**Élő oldal:** https://sotcsa.github.io/CleanMark/

## Részek

| Rész | Hely | Leírás |
|---|---|---|
| Webalkalmazás | `src/` | React 19 + Vite 8 + Tailwind CSS 4, Firebase (Google-bejelentkezés + Firestore) szinkronnal. A teljes logika a `src/App.jsx` fájlban van. |
| Chrome-bővítmény | `chrome-extension/` | Manifest V3 popup, build nélkül betölthető. Önálló, nem kommunikál a webalkalmazással. |
| Mobil | – | Nincs natív app. A webalkalmazás reszponzív (mobilon alsó navigáció), és bookmarklettel vagy iOS Rövidítéssel is használható (lásd lent). |

### Webalkalmazás fülei

- **Könyvjelzők**: lista, keresés, szűrés forrás / címke / állapot (kedvenc, olvasatlan, tisztított) szerint, szerkesztés, törlés (megerősítéssel), „röntgen” nézet az eltávolított paraméterekről, JSON export.
- **Tisztító**: URL beillesztése, valós idejű elemzés és tisztítás, mentés. Mintalinkek a gyors kipróbáláshoz.
- **Plugin**: telepítési útmutató a Chrome-bővítményhez, bemásolható bővítménykód és bookmarklet, mobilos tippek.

## Indítás

### Chrome-bővítmény

A bővítmény nincs fent a Chrome Web Store-ban, ezért „kicsomagolt bővítményként” kell betölteni. Buildelni nem kell, a `chrome-extension/` mappa tartalma közvetlenül betölthető. Bármely Chromium-alapú böngészőben működik (Chrome, Edge, Brave, Arc, Opera).

**1. A kód letöltése** (ha még nincs meg a gépeden):

```bash
git clone https://github.com/sotcsa/CleanMark.git
```

Vagy a GitHub-oldalon **Code → Download ZIP**, majd a ZIP kicsomagolása. A mappát ne töröld és ne helyezd át telepítés után, mert a Chrome onnan tölti be a bővítményt.

**2. Telepítés:**

1. Nyisd meg a `chrome://extensions` oldalt (Edge-ben `edge://extensions`, Brave-ben `brave://extensions`).
2. Jobb felső sarokban kapcsold be a **Fejlesztői mód** (Developer mode) kapcsolót.
3. Kattints a **Kicsomagolt bővítmény betöltése** (Load unpacked) gombra, és válaszd ki a repó `chrome-extension/` mappáját (azt, amelyikben a `manifest.json` van, ne a repó gyökerét).
4. A bővítmény megjelenik a listában „CleanMark - URL Cleaner & Bookmark” néven.
5. Kattints a címsor melletti puzzle (Bővítmények) ikonra, és a CleanMark melletti gombostűvel tűzd ki az eszköztárra.

**3. Használat:** bármely http(s) oldalon a bővítmény ikonjára kattintva a popup megtisztítja az aktuális fül URL-jét. A **Másolás és mentés** gomb a vágólapra másolja a tiszta linket, és új fülön megnyitja a webappot (`?add_url=…&title=…&tags=…`), ahol egy kattintással menthető. Így a bővítményből mentett linkek is a közös, szinkronizált listába kerülnek. A mentéshez a webappban be kell jelentkezni Google-fiókkal, különben a link csak az adott böngésző `localStorage`-ába kerül.

**4. Frissítés:** `git pull` (vagy új ZIP letöltése ugyanabba a mappába), majd a `chrome://extensions` oldalon a CleanMark kártyáján a **frissítés** (körkörös nyíl) ikon. Ugyanez kell, ha a `chrome-extension/` fájljait helyben módosítod.

**Eltávolítás:** `chrome://extensions` → CleanMark → **Eltávolítás**.

Jogosultságok: `activeTab`, `clipboardWrite`. A manifestben nincs ikon megadva, ezért az eszköztáron a Chrome alapértelmezett, betűs ikonja látszik. Nem http(s) oldalakon (pl. `chrome://`, Chrome Web Store) a mentés le van tiltva. Mobil Chrome-ban bővítmény nem telepíthető, ott a bookmarkletet vagy az iOS Rövidítést használd (lásd lent).

#### Közzététel a Chrome Web Store-ban (opcionális)

Ha mások számára is egy kattintással telepíthetővé akarod tenni:

1. Adj hozzá ikonokat (16, 48, 128 px PNG) a `manifest.json` `icons` mezőjében. A Store ezt megköveteli.
2. Csomagold be a mappa *tartalmát* ZIP-be: `cd chrome-extension && zip -r ../cleanmark-extension.zip .`
3. Regisztrálj a [Chrome Web Store Developer Dashboardon](https://chrome.google.com/webstore/devconsole) (egyszeri 5 USD díj), töltsd fel a ZIP-et, add meg a leírást, képernyőképeket és az adatvédelmi nyilatkozatot, majd küldd be ellenőrzésre.
4. Új verzió kiadásakor növeld a `manifest.json` `version` mezőjét, és töltsd fel az új ZIP-et.

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

- **Bejelentkezve (Google-fiók):** Firestore, a `users/{uid}/bookmarks/{id}` útvonalon. Minden eszközön (mobil, asztali böngésző) ugyanaz a lista, élő szinkronnal. Offline is lehet menteni, a kapcsolat visszatérésekor feltöltődik.
- **Bejelentkezés nélkül:** böngésző `localStorage`, `cleanmark-bookmarks` kulccsal. Csak az adott böngészőben érhető el. Első bejelentkezéskor ezek a könyvjelzők automatikusan felkerülnek a fiókba.
- **Chrome-bővítmény:** nem tárol semmit, a webappon keresztül ment.

### Firebase

- Projekt: `cleanmark-sotcsa` (Spark, ingyenes csomag). A webes config a `src/App.jsx` elején van; ez nem titkos adat.
- Bejelentkezés: Authentication → Google szolgáltató. Az engedélyezett domainek között szerepelnie kell a `sotcsa.github.io`-nak (és helyi fejlesztéshez a `localhost`-nak).
- Hozzáférés: a `firestore.rules` szerint mindenki csak a saját könyvjelzőit olvashatja és írhatja. Módosítás után a Firebase konzolban (Firestore → Rules) kell közzétenni.

## Mobil és gyorsmentés

- **URL-paraméter:** a webalkalmazás az `?add_url=<url>` (vagy `?url=<url>`) paraméterrel megnyitva automatikusan átveszi és megtisztítja a linket.
- **iOS Rövidítések:** egy „URL megnyitása” művelettel, például `https://sotcsa.github.io/CleanMark/?add_url=[Vágólap]`, egyetlen érintéssel menthető a link a Megosztás menüből.
- **Bookmarklet:** a Plugin fülről a könyvjelzősávra húzható. Bármely oldalon megtisztítja az aktuális URL-t, és a vágólapra másolja (mobil böngészőben is működik).

## Projektstruktúra

```
chrome-extension/   manifest.json, popup.html, popup.js
public/             favicon.svg, icons.svg
src/
  App.jsx           teljes alkalmazás: URL-elemző motor, Firebase/localStorage tárolás, UI
  main.jsx          React belépési pont
  index.css         Tailwind import (@import "tailwindcss")
index.html
vite.config.js
postcss.config.js   Tailwind 4 (@tailwindcss/postcss)
.oxlintrc.json
firestore.rules     Firestore hozzáférési szabályok
.github/workflows/  GitHub Pages publikálás
```

## Tisztítási szabályok

Az `App.jsx` tetején találhatók:

- `TRACKING_PARAMS_EXACT`: pontos egyezéssel törölt paraméterek (pl. `fbclid`, `gclid`, `msclkid`, `ttclid`, `mc_cid`, `si`, `ref`, `spm` …).
- `TRACKING_PARAMS_BY_HOST`: csak adott oldalakon törölt paraméterek (YouTube: `feature`, `pp`; X/Twitter: `s`, `t`; Amazon: `ref`). Máshol ezeknek tartalmi jelentésük lehet (pl. WordPress `?s=` keresés), ezért ott megmaradnak.
- `TRACKING_PREFIXES`: előtaggal törölt paraméterek (`utm_`, `hsa_`, `mtm_`, `pk_`, `piwik_`, `gad_`, `__`).
- `SOURCES`: a felismert források és a hozzájuk tartozó színek.

A Chrome-bővítmény (`chrome-extension/popup.js`) egy saját, egyszerűbb paraméterlistát használ.
