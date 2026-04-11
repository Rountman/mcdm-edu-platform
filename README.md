# MCDM Edu Platform

Výuková platforma pro předmět **Systémy pro podporu managementu**.
Obsahuje interaktivní lab a teorii pro metody vícekriteriálního rozhodování.

## Dostupné moduly

| Modul | Teorie | Lab (výpočet) |
|---|---|---|
| Metoda AHP | ✅ | ✅ |
| Metoda SMART | ✅ | ✅ |
| Metoda PAPRIKA | ✅ | ✅ |
| Analýza citlivosti | ✅ | ✅ |
| Rozhodovací stromy | ✅ | ✅ |

---

## Spuštění

### Backend (FastAPI)

```bash
cd backend

# Aktivace virtuálního prostředí
venv\Scripts\activate

# Spuštění serveru
uvicorn main:app --reload
```

Server běží na `http://localhost:8000`.

### Frontend (React + Vite)

```bash
cd frontend

# Instalace závislostí (pouze poprvé)
npm install

# Spuštění dev serveru
npm run dev
```

Aplikace běží na `http://localhost:5173`.

---

## Struktura projektu

```
mcdm-edu-platform/
├── backend/
│   ├── main.py          # FastAPI endpoints
│   └── venv/            # Python virtuální prostředí
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── ahp/         # AHP metoda
    │   │   ├── smart/       # SMART metoda
    │   │   ├── paprika/     # PAPRIKA metoda
    │   │   ├── sensitivity/ # Analýza citlivosti
    │   │   └── dtree/       # Rozhodovací stromy
    │   ├── App.jsx
    │   ├── Sidebar.jsx
    │   └── ModuleContent.jsx
    └── package.json
```

## API Endpointy

| Metoda | Endpoint | Popis |
|---|---|---|
| POST | `/api/calculate-ahp` | Výpočet AHP (váhy, CR) |
| POST | `/api/calculate-smart` | Výpočet SMART (skóre, ranking) |
| POST | `/api/calculate-paprika` | Výpočet PAPRIKA (váhy z preferencí) |
