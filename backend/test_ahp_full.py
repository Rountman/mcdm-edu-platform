"""Testy kompletního AHP modelu (/api/calculate-ahp-full).

Spuštění bez pytestu:  python backend/test_ahp_full.py
"""
import os
import sys

import numpy as np
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from main import app, compute_ahp_full  # noqa: E402

client = TestClient(app)
TOL = 1e-9

# Konzistentní matice kritérií s vahami (0,5; 0,25; 0,25).
# Součty sloupců: 2, 4, 4 → každý normalizovaný sloupec = (0,5; 0,25; 0,25) → průměr řádků = w.
CRITERIA_3 = [[1, 2, 2], [1 / 2, 1, 1], [1 / 2, 1, 1]]


def post_full(payload):
    return client.post("/api/calculate-ahp-full", json=payload)


def assert_close(actual, expected, tol=TOL):
    assert np.allclose(actual, expected, atol=tol), f"{actual} != {expected}"


def test_criteria_weights_match_old_endpoint():
    matrices = [
        CRITERIA_3,
        [[1, 3, 5, 7], [1 / 3, 1, 3, 5], [1 / 5, 1 / 3, 1, 3], [1 / 7, 1 / 5, 1 / 3, 1]],
        [[1, 9, 1 / 9], [1 / 9, 1, 9], [9, 1 / 9, 1]],  # silně nekonzistentní
    ]
    for m in matrices:
        n = len(m)
        old = client.post("/api/calculate-ahp", json={"matrix": m}).json()
        evals = [{"method": "direct", "scores": [10, 20]} for _ in range(n)]
        res = post_full({"criteria_matrix": m, "alternative_evaluations": evals})
        assert res.status_code == 200, res.text
        new = res.json()["criteria"]
        assert_close(new["weights"], old["weights"])
        assert abs(new["consistency"]["cr"] - old["consistency_ratio"]) < TOL
        assert new["consistency"]["is_consistent"] == old["is_consistent"]


def test_hand_example_pairwise_3x3():
    # Kritéria: w = (0,5; 0,25; 0,25), CR = 0 (viz CRITERIA_3).
    # K1: [[1,3,3],[1/3,1,1],[1/3,1,1]] – součty sloupců 5/3, 5, 5 → p = (0,6; 0,2; 0,2)
    # K2: [[1,1/2,1],[2,1,2],[1,1/2,1]] – součty sloupců 4, 2, 4 → p = (0,25; 0,5; 0,25)
    # K3: [[1,1,1/4],[1,1,1/4],[4,4,1]] – součty sloupců 6, 6, 1,5 → p = (1/6; 1/6; 2/3)
    # A1 = 0,5·0,6 + 0,25·0,25 + 0,25·1/6 = 0,3 + 0,0625 + 0,041667 = 0,404167
    # A2 = 0,5·0,2 + 0,25·0,5  + 0,25·1/6 = 0,1 + 0,125  + 0,041667 = 0,266667
    # A3 = 0,5·0,2 + 0,25·0,25 + 0,25·2/3 = 0,1 + 0,0625 + 0,166667 = 0,329167
    # Pořadí: A1 > A3 > A2 → [0, 2, 1]; všechny matice konzistentní (λmax = 3, CR = 0).
    payload = {
        "criteria_matrix": CRITERIA_3,
        "alternative_evaluations": [
            {"method": "pairwise", "matrix": [[1, 3, 3], [1 / 3, 1, 1], [1 / 3, 1, 1]]},
            {"method": "pairwise", "matrix": [[1, 1 / 2, 1], [2, 1, 2], [1, 1 / 2, 1]]},
            {"method": "pairwise", "matrix": [[1, 1, 1 / 4], [1, 1, 1 / 4], [4, 4, 1]]},
        ],
    }
    res = post_full(payload)
    assert res.status_code == 200, res.text
    r = res.json()
    assert_close(r["criteria"]["weights"], [0.5, 0.25, 0.25])
    assert_close(r["local_priorities"][0]["normalized"], [0.6, 0.2, 0.2])
    assert_close(r["local_priorities"][1]["normalized"], [0.25, 0.5, 0.25])
    assert_close(r["local_priorities"][2]["normalized"], [1 / 6, 1 / 6, 2 / 3])
    assert_close(r["global_scores"], [0.3 + 0.0625 + 0.25 / 6, 0.1 + 0.125 + 0.25 / 6, 0.1 + 0.0625 + 0.5 / 3])
    assert_close(r["weighted_contributions"][0], [0.3, 0.0625, 0.25 / 6])
    assert r["ranking"] == [0, 2, 1]
    assert r["inconsistent_matrices"] == []
    for lp in r["local_priorities"]:
        assert abs(lp["consistency"]["lambda_max"] - 3) < 1e-9
        assert abs(lp["consistency"]["cr"]) < 1e-9


def test_mixed_methods():
    # Kritéria: w = (0,5; 0,25; 0,25).
    # K1 párově [[1,3,3],[1/3,1,1],[1/3,1,1]] → (0,6; 0,2; 0,2)
    # K2 přímo (50, 30, 20) → součet 100 → (0,5; 0,3; 0,2)
    # K3 SMART cost (100, 200, 300): v = (300 − x)/200 = (1; 0,5; 0) → součet 1,5 → (2/3; 1/3; 0)
    # A1 = 0,3 + 0,125 + 0,25·2/3 = 0,591667
    # A2 = 0,1 + 0,075 + 0,25·1/3 = 0,258333
    # A3 = 0,1 + 0,05  + 0         = 0,15
    r = compute_ahp_full(CRITERIA_3, [
        {"method": "pairwise", "matrix": [[1, 3, 3], [1 / 3, 1, 1], [1 / 3, 1, 1]]},
        {"method": "direct", "scores": [50, 30, 20]},
        {"method": "smart", "values": [100, 200, 300], "type": "cost"},
    ])
    assert_close(r["local_priorities"][1]["raw"], [50, 30, 20])
    assert_close(r["local_priorities"][1]["normalized"], [0.5, 0.3, 0.2])
    assert_close(r["local_priorities"][2]["raw"], [1, 0.5, 0])
    assert_close(r["local_priorities"][2]["normalized"], [2 / 3, 1 / 3, 0])
    assert r["local_priorities"][1]["consistency"] is None
    assert r["local_priorities"][2]["consistency"] is None
    assert_close(r["global_scores"], [0.3 + 0.125 + 0.5 / 3, 0.1 + 0.075 + 0.25 / 3, 0.15])
    assert r["ranking"] == [0, 1, 2]


def test_n_equals_2():
    # 2 kritéria i 2 alternativy: RI = 0 → CR = 0, žádné dělení nulou.
    # Kritéria [[1,3],[1/3,1]] → w = (0,75; 0,25); alternativy u K1 [[1,1/4],[4,1]] → (0,2; 0,8)
    res = post_full({
        "criteria_matrix": [[1, 3], [1 / 3, 1]],
        "alternative_evaluations": [
            {"method": "pairwise", "matrix": [[1, 1 / 4], [4, 1]]},
            {"method": "direct", "scores": [40, 60]},
        ],
    })
    assert res.status_code == 200, res.text
    r = res.json()
    c = r["criteria"]["consistency"]
    assert c["cr"] == 0 and c["ri"] == 0 and c["ci"] == 0 and c["is_consistent"]
    assert abs(c["lambda_max"] - 2) < 1e-9
    assert_close(r["criteria"]["weights"], [0.75, 0.25])
    assert_close(r["local_priorities"][0]["normalized"], [0.2, 0.8])
    assert r["local_priorities"][0]["consistency"]["cr"] == 0
    # A1 = 0,75·0,2 + 0,25·0,4 = 0,25; A2 = 0,75·0,8 + 0,25·0,6 = 0,75
    assert_close(r["global_scores"], [0.25, 0.75])
    assert r["ranking"] == [1, 0]


def test_smart_equal_values():
    for kind in ("benefit", "cost"):
        r = compute_ahp_full(CRITERIA_3, [
            {"method": "smart", "values": [7, 7, 7], "type": kind},
            {"method": "direct", "scores": [10, 20, 30]},
            {"method": "direct", "scores": [10, 20, 30]},
        ])
        assert_close(r["local_priorities"][0]["raw"], [0, 0, 0])
        assert_close(r["local_priorities"][0]["normalized"], [1 / 3] * 3)
        assert all(np.isfinite(r["global_scores"]))


def test_direct_zeros():
    r = compute_ahp_full(CRITERIA_3, [
        {"method": "direct", "scores": [0, 0, 0]},
        {"method": "direct", "scores": [0, 50, 0]},
        {"method": "direct", "scores": [100, 100, 100]},
    ])
    assert_close(r["local_priorities"][0]["normalized"], [1 / 3] * 3)
    assert_close(r["local_priorities"][1]["normalized"], [0, 1, 0])
    assert_close(r["local_priorities"][2]["normalized"], [1 / 3] * 3)
    assert all(np.isfinite(r["global_scores"]))


def test_scores_sum_to_one():
    rng = np.random.default_rng(42)
    saaty = [1 / 9, 1 / 7, 1 / 5, 1 / 3, 1, 3, 5, 7, 9]

    def random_pairwise(n):
        m = np.ones((n, n))
        for i in range(n):
            for j in range(i + 1, n):
                m[i, j] = rng.choice(saaty)
                m[j, i] = 1 / m[i, j]
        return m.tolist()

    for _ in range(30):
        n_crit = int(rng.integers(2, 9))
        n_alts = int(rng.integers(2, 7))
        evals = []
        for _ in range(n_crit):
            kind = rng.choice(["pairwise", "direct", "smart"])
            if kind == "pairwise":
                evals.append({"method": "pairwise", "matrix": random_pairwise(n_alts)})
            elif kind == "direct":
                evals.append({"method": "direct", "scores": rng.integers(0, 101, n_alts).tolist()})
            else:
                evals.append({"method": "smart", "values": rng.normal(0, 1000, n_alts).tolist(),
                              "type": str(rng.choice(["benefit", "cost"]))})
        res = post_full({"criteria_matrix": random_pairwise(n_crit), "alternative_evaluations": evals})
        assert res.status_code == 200, res.text
        r = res.json()
        assert abs(sum(r["global_scores"]) - 1) < 1e-9
        assert abs(sum(r["criteria"]["weights"]) - 1) < 1e-9
        for lp in r["local_priorities"]:
            assert abs(sum(lp["normalized"]) - 1) < 1e-9
        contrib = np.array(r["weighted_contributions"])
        assert contrib.shape == (n_alts, n_crit)
        assert_close(contrib.sum(axis=1), r["global_scores"])
        assert sorted(r["ranking"]) == list(range(n_alts))


def test_inconsistent_matrices_reported():
    cyclic = [[1, 9, 1 / 9], [1 / 9, 1, 9], [9, 1 / 9, 1]]
    r = compute_ahp_full(cyclic, [
        {"method": "direct", "scores": [1, 2, 3]},
        {"method": "pairwise", "matrix": cyclic},
        {"method": "pairwise", "matrix": [[1, 3, 3], [1 / 3, 1, 1], [1 / 3, 1, 1]]},
    ])
    targets = [(m["target"], m["criterion"]) for m in r["inconsistent_matrices"]]
    assert targets == [("criteria", None), ("alternatives", 1)], targets
    assert r["criteria"]["consistency"]["cr"] > 0.1


def test_validation_errors_are_czech_422():
    ok_evals = [{"method": "direct", "scores": [1, 2]} for _ in range(3)]
    cases = [
        ({"criteria_matrix": [[1, 2, 2], [1, 1, 1], [1 / 2, 1, 1]], "alternative_evaluations": ok_evals},
         "reciproční"),
        ({"criteria_matrix": [[1, 2], [1 / 2, 1, 3]], "alternative_evaluations": ok_evals[:2]}, "čtvercová"),
        ({"criteria_matrix": [[1, -2], [-0.5, 1]], "alternative_evaluations": ok_evals[:2]}, "kladná"),
        ({"criteria_matrix": [[1]], "alternative_evaluations": ok_evals[:1]}, "rozměr"),
        ({"criteria_matrix": CRITERIA_3, "alternative_evaluations": ok_evals[:2]}, "neodpovídá"),
        ({"criteria_matrix": CRITERIA_3, "alternative_evaluations": ok_evals[:2] + [
            {"method": "direct", "scores": [1, 2, 3]}]}, "liší"),
        ({"criteria_matrix": CRITERIA_3, "alternative_evaluations": ok_evals[:2] + [
            {"method": "direct", "scores": [1, 200]}]}, "0–100"),
        ({"criteria_matrix": CRITERIA_3, "alternative_evaluations": ok_evals[:2] + [
            {"method": "magic", "scores": [1, 2]}]}, "metoda"),
        ({"criteria_matrix": CRITERIA_3, "alternative_evaluations": ok_evals[:2] + [
            {"method": "smart", "values": [1, 2], "type": "maybe"}]}, "Neplatná hodnota"),
        ({"criteria_matrix": CRITERIA_3, "alternative_evaluations": ok_evals[:2] + [
            {"method": "direct", "scores": [1] * 7}]}, "počet alternativ"),
    ]
    for payload, fragment in cases:
        res = post_full(payload)
        assert res.status_code == 422, (payload, res.status_code, res.text)
        detail = res.json()["detail"]
        assert isinstance(detail, str) and fragment.lower() in detail.lower(), (fragment, detail)


def test_other_endpoints_keep_default_422():
    res = client.post("/api/calculate-ahp", json={})
    assert res.status_code == 422
    assert isinstance(res.json()["detail"], list)


if __name__ == "__main__":
    tests = [(name, fn) for name, fn in sorted(globals().items()) if name.startswith("test_") and callable(fn)]
    failed = 0
    for name, fn in tests:
        try:
            fn()
            print(f"OK    {name}")
        except Exception as exc:  # noqa: BLE001
            failed += 1
            print(f"FAIL  {name}: {exc!r}")
    print(f"\n{len(tests) - failed}/{len(tests)} testů prošlo")
    sys.exit(1 if failed else 0)
