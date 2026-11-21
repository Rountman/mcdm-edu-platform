"""Vygeneruje referenční výsledky z původního Python backendu pro Vitest testy.

Každý případ se pošle skutečnému FastAPI endpointu přes TestClient, takže fixtures
obsahují i validaci a chybové odpovědi přesně tak, jak je vracel server.

Spuštění (z kořene repa):
    python scripts/generate_fixtures.py

Výstup: frontend/src/lib/mcdm/__fixtures__/backend.json
"""
import json
import os
import random
import sys
from importlib.metadata import version

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "backend"))

from fastapi.testclient import TestClient  # noqa: E402
from main import app  # noqa: E402

OUT = os.path.join(ROOT, "frontend", "src", "lib", "mcdm", "__fixtures__", "backend.json")
SAATY = [1, 2, 3, 4, 5, 6, 7, 8, 9]

client = TestClient(app, raise_server_exceptions=False)
rng = random.Random(20261121)


def random_pairwise(n, consistent=False):
    """Reciproční matice v Saatyho škále; consistent=True → a_ij = w_i / w_j."""
    if consistent:
        w = [rng.choice(SAATY) for _ in range(n)]
        return [[w[i] / w[j] for j in range(n)] for i in range(n)]
    m = [[1.0] * n for _ in range(n)]
    for i in range(n):
        for j in range(i + 1, n):
            v = rng.choice(SAATY)
            if rng.random() < 0.5:
                v = 1 / v
            m[i][j] = v
            m[j][i] = 1 / v
    return m


def random_evaluation(n_alts):
    method = rng.choice(["pairwise", "direct", "smart"])
    if method == "pairwise":
        return {"method": "pairwise", "matrix": random_pairwise(n_alts, consistent=rng.random() < 0.2)}
    if method == "direct":
        return {"method": "direct", "scores": [rng.choice([0, 10, 25, 50, 75, 90, 100]) for _ in range(n_alts)]}
    return {
        "method": "smart",
        "values": [round(rng.uniform(-50, 500), 2) for _ in range(n_alts)],
        "type": rng.choice(["benefit", "cost"]),
    }


def ahp_cases():
    c3 = [[1, 2, 2], [1 / 2, 1, 1], [1 / 2, 1, 1]]
    k1 = [[1, 3, 3], [1 / 3, 1, 1], [1 / 3, 1, 1]]
    cyclic = [[1, 9, 1 / 9], [1 / 9, 1, 9], [9, 1 / 9, 1]]
    cases = [
        ("ruční příklad 3×3", {"criteria_matrix": c3, "alternative_evaluations": [
            {"method": "pairwise", "matrix": k1},
            {"method": "pairwise", "matrix": [[1, 1 / 2, 1], [2, 1, 2], [1, 1 / 2, 1]]},
            {"method": "pairwise", "matrix": [[1, 1, 1 / 4], [1, 1, 1 / 4], [4, 4, 1]]},
        ]}),
        ("n = 2", {"criteria_matrix": [[1, 3], [1 / 3, 1]], "alternative_evaluations": [
            {"method": "pairwise", "matrix": [[1, 1 / 4], [4, 1]]},
            {"method": "direct", "scores": [30, 70]},
        ]}),
        ("SMART shodné hodnoty", {"criteria_matrix": c3, "alternative_evaluations": [
            {"method": "smart", "values": [5, 5, 5], "type": "benefit"},
            {"method": "smart", "values": [1, 2, 3], "type": "cost"},
            {"method": "direct", "scores": [0, 0, 0]},
        ]}),
        ("shoda skóre – pořadí", {"criteria_matrix": [[1, 1], [1, 1]], "alternative_evaluations": [
            {"method": "direct", "scores": [50, 50, 50]},
            {"method": "direct", "scores": [20, 20, 20]},
        ]}),
        ("nekonzistentní matice", {"criteria_matrix": cyclic, "alternative_evaluations": [
            {"method": "pairwise", "matrix": cyclic},
            {"method": "pairwise", "matrix": k1},
            {"method": "direct", "scores": [10, 20, 30]},
        ]}),
        ("4×4 Saaty", {"criteria_matrix": [[1, 3, 5, 7], [1 / 3, 1, 3, 5], [1 / 5, 1 / 3, 1, 3], [1 / 7, 1 / 5, 1 / 3, 1]],
                       "alternative_evaluations": [{"method": "direct", "scores": [10, 20]} for _ in range(4)]}),
        # chybové případy (422 s českou zprávou)
        ("chyba: nereciproční", {"criteria_matrix": [[1, 2, 2], [1, 1, 1], [1 / 2, 1, 1]],
                                 "alternative_evaluations": [{"method": "direct", "scores": [1, 2]}] * 3}),
        ("chyba: nečtvercová", {"criteria_matrix": [[1, 2], [1 / 2, 1, 3]],
                                "alternative_evaluations": [{"method": "direct", "scores": [1, 2]}] * 2}),
        ("chyba: záporná hodnota", {"criteria_matrix": [[1, -2], [-0.5, 1]],
                                    "alternative_evaluations": [{"method": "direct", "scores": [1, 2]}] * 2}),
        ("chyba: diagonála", {"criteria_matrix": [[2, 1], [1, 1]],
                              "alternative_evaluations": [{"method": "direct", "scores": [1, 2]}] * 2}),
        ("chyba: počet hodnocení", {"criteria_matrix": c3,
                                    "alternative_evaluations": [{"method": "direct", "scores": [1, 2]}] * 2}),
        ("chyba: direct mimo rozsah", {"criteria_matrix": [[1, 1], [1, 1]],
                                       "alternative_evaluations": [{"method": "direct", "scores": [1, 101]}] * 2}),
        ("chyba: různý počet alternativ", {"criteria_matrix": [[1, 1], [1, 1]], "alternative_evaluations": [
            {"method": "direct", "scores": [1, 2]}, {"method": "direct", "scores": [1, 2, 3]}]}),
        ("chyba: moc alternativ", {"criteria_matrix": [[1, 1], [1, 1]],
                                   "alternative_evaluations": [{"method": "direct", "scores": [1] * 7}] * 2}),
        ("chyba: matice alternativ", {"criteria_matrix": [[1, 1], [1, 1]], "alternative_evaluations": [
            {"method": "pairwise", "matrix": [[1, 3], [3, 1]]}, {"method": "direct", "scores": [1, 2]}]}),
    ]
    for k in range(40):
        n_crit = rng.randint(2, 8)
        n_alts = rng.randint(2, 6)
        cases.append((f"náhodný #{k}", {
            "criteria_matrix": random_pairwise(n_crit, consistent=rng.random() < 0.2),
            "alternative_evaluations": [random_evaluation(n_alts) for _ in range(n_crit)],
        }))
    return cases


def smart_cases():
    cases = [
        ("základní", {"weights": [50, 30, 20], "ratings": [[80, 20, 50], [60, 40, 50], [40, 90, 10]],
                      "criteria_types": ["benefit", "cost", "benefit"]}),
        ("shodné hodnoty a skóre", {"weights": [50, 50], "ratings": [[50, 50], [50, 50], [50, 50]],
                                    "criteria_types": ["benefit", "benefit"]}),
    ]
    for k in range(25):
        n_crit = rng.randint(2, 7)
        n_alts = rng.randint(2, 6)
        cases.append((f"náhodný #{k}", {
            "weights": [rng.randint(0, 100) for _ in range(n_crit - 1)] + [rng.randint(1, 100)],
            "ratings": [[rng.randint(0, 100) for _ in range(n_crit)] for _ in range(n_alts)],
            "criteria_types": [rng.choice(["benefit", "cost"]) for _ in range(n_crit)],
        }))
    return cases


def paprika_cases():
    cases = [
        ("základní", {"ratings": [[8, 3, 5], [6, 7, 5], [2, 9, 1]],
                      "comparisons": [{"i": 0, "j": 1, "winner": 0}, {"i": 0, "j": 2, "winner": 2},
                                      {"i": 1, "j": 2, "winner": 2}]}),
        ("shodné hodnoty", {"ratings": [[5, 5], [5, 5]], "comparisons": [{"i": 0, "j": 1, "winner": 1}]}),
    ]
    for k in range(25):
        n_crit = rng.randint(2, 6)
        n_alts = rng.randint(2, 5)
        comps = [{"i": i, "j": j, "winner": rng.choice([i, j])} for i in range(n_crit) for j in range(i + 1, n_crit)]
        cases.append((f"náhodný #{k}", {
            "ratings": [[rng.randint(1, 10) for _ in range(n_crit)] for _ in range(n_alts)],
            "comparisons": comps,
        }))
    return cases


def run(path, cases):
    out = []
    for name, request in cases:
        res = client.post(path, json=request)
        body = res.json() if res.headers.get("content-type", "").startswith("application/json") else res.text
        out.append({"name": name, "request": request, "status": res.status_code, "response": body})
    return out


def main():
    fixtures = {
        "generated_by": "scripts/generate_fixtures.py",
        "versions": {pkg: version(pkg) for pkg in ("numpy", "pyDecision", "fastapi", "pydantic")},
        "ahp_full": run("/api/calculate-ahp-full", ahp_cases()),
        "smart": run("/api/calculate-smart", smart_cases()),
        "paprika": run("/api/calculate-paprika", paprika_cases()),
    }
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(fixtures, f, ensure_ascii=False, indent=1)
        f.write("\n")
    counts = {k: len(v) for k, v in fixtures.items() if isinstance(v, list)}
    print(f"Zapsáno {OUT}: {counts}, verze {fixtures['versions']}")


if __name__ == "__main__":
    main()
