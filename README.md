# MCDM Edu Platform

Výuková platforma pro předmět **Systémy pro podporu managementu**.
Obsahuje interaktivní lab a teorii pro metody vícekriteriálního rozhodování.

**Aplikace běží na:** https://rountman.github.io/mcdm-edu-platform/

Jde o čistě statickou aplikaci (React + Vite). Všechny výpočty běží v prohlížeči,
není potřeba žádný server ani backend.

## Dostupné moduly

| Modul | Teorie | Lab (výpočet) | Odkaz |
|---|---|---|---|
| Metoda AHP | ✅ | ✅ | `#/ahp/teorie`, `#/ahp/lab` |
| Metoda SMART | ✅ | ✅ | `#/smart/…` |
| Metoda PAPRIKA | ✅ | ✅ | `#/paprika/…` |
| Analýza citlivosti | ✅ | ✅ | `#/citlivost/…` |
| Rozhodovací stromy | ✅ | ✅ | `#/stromy/…` |

---

## Lokální spuštění

Potřebujete Node.js 24 (viz `frontend/.nvmrc`; stačí ≥ 22.12).

```powershell
cd frontend
npm ci              # instalace závislostí (poprvé nebo po změně package-lock.json)
npm run dev         # vývojový server → http://localhost:5173/mcdm-edu-platform/
```

Další příkazy (ve složce `frontend`):

```powershell
npm test            # Vitest testy výpočtů (včetně shody s původním Python backendem)
npm run typecheck   # kontrola typů výpočetní knihovny (TypeScript)
npm run build       # produkční build do frontend/dist
npm run preview     # náhled buildu → http://localhost:4173/mcdm-edu-platform/
```

## Nasazení

Nasazuje se automaticky přes GitHub Actions ([.github/workflows/deploy.yml](.github/workflows/deploy.yml))
při každém pushi do `main` (ručně jde spustit v záložce *Actions → Deploy to GitHub Pages → Run workflow*).
Workflow spustí typecheck a testy, potom build a výsledek `frontend/dist` publikuje na GitHub Pages.
Složka `frontend/dist` se do gitu necommituje.

Jednorázové nastavení repozitáře: *Settings → Pages → Build and deployment → Source: **GitHub Actions***.

---

## Struktura projektu

```
mcdm-edu-platform/
├── .github/workflows/deploy.yml   # build + deploy na GitHub Pages
├── frontend/
│   ├── src/
│   │   ├── lib/mcdm/              # výpočty (TypeScript, čisté funkce bez UI)
│   │   │   ├── ahp.ts             # AHP – váhy, λmax, CI, CR, syntéza
│   │   │   ├── smart.ts           # SMART
│   │   │   ├── paprika.ts         # PAPRIKA
│   │   │   ├── api.ts             # adaptér se stejným rozhraním jako dřívější API
│   │   │   ├── __fixtures__/      # referenční výsledky z Python backendu
│   │   │   └── __tests__/         # Vitest testy
│   │   ├── components/            # moduly ahp, smart, paprika, sensitivity, dtree
│   │   ├── App.jsx                # routing (HashRouter)
│   │   └── main.jsx
│   └── vite.config.js             # base: '/mcdm-edu-platform/'
├── scripts/generate_fixtures.py   # generuje __fixtures__/backend.json z backendu
└── backend/                       # původní FastAPI backend (už se nepoužívá v produkci)
```

## Výpočty

Výpočty jsou převedené 1:1 z původního backendu (`backend/main.py`):

- **AHP** – váhy počítá stejně jako `pyDecision.ahp_method` s výchozí volbou `wd='m'`:
  průměr řádků matice s normalizovanými sloupci. Je to aproximace hlavního vlastního vektoru,
  ne přesný vlastní vektor. λmax = průměr (A·w)ᵢ / wᵢ, CI = (λmax − n)/(n − 1), CR = CI/RI,
  Saatyho tabulka RI, práh CR < 0,1; pro n ≤ 2 je CR = 0.
- **SMART** – normalizované přímé váhy, min-max hodnotová funkce (benefit/cost), vážený součet.
- **PAPRIKA** – váhy z počtu vítězství v párových srovnáních (Laplaceovo vyhlazení +1), min-max normalizace.

### Ověření shody s Python backendem

Testy porovnávají TypeScript s výsledky původního backendu s tolerancí 1e-6 (včetně textu
chybových hlášek). Referenční data se generují skutečným voláním FastAPI endpointů:

```powershell
# z kořene repa, jednorázově
& "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe" -m venv backend\venv   # Python 3.12 z winget
.\backend\venv\Scripts\python.exe -m pip install -r backend\requirements.txt
.\backend\venv\Scripts\python.exe scripts\generate_fixtures.py
```

Výsledek se uloží do `frontend/src/lib/mcdm/__fixtures__/backend.json` a commitne se do repa.
Po změně výpočtu v backendu (nebo verze pyDecision) je potřeba fixtures vygenerovat znovu.

## Backend (legacy)

Složka `backend/` obsahuje původní FastAPI + NumPy + pyDecision backend. **Pro produkci už neslouží.**
Zůstává v repu jako referenční implementace a zdroj fixtures pro testy. Lokálně se dá pořád spustit:

```powershell
.\backend\venv\Scripts\Activate.ps1
cd backend
uvicorn main:app --reload      # http://localhost:8000
```

Frontend ho ale nevolá.
