from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
from pyDecision.algorithm import ahp_method

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── AHP ───────────────────────────────────────────────────────

class AHPRequest(BaseModel):
    matrix: list[list[float]]

@app.get("/")
def read_root():
    return {"message": "Backend žije! Vítej v MCDM API."}

@app.post("/api/calculate-ahp")
def calculate_ahp(data: AHPRequest):
    dataset = np.array(data.matrix)
    weights, rc = ahp_method(dataset)
    return {
        "weights": weights.tolist(),
        "consistency_ratio": float(rc),
        "is_consistent": bool(rc < 0.1),
    }

# ── SMART ─────────────────────────────────────────────────────

class SMARTRequest(BaseModel):
    weights: list[float]          # direct weights 0-100, one per criterion
    ratings: list[list[float]]    # [n_alts][n_crits], 0-100
    criteria_types: list[str]     # "benefit" | "cost" per criterion

@app.post("/api/calculate-smart")
def calculate_smart(data: SMARTRequest):
    w = np.array(data.weights, dtype=float)
    w_norm = w / w.sum()

    r = np.array(data.ratings, dtype=float)   # shape (n_alts, n_crits)
    n_crits = r.shape[1]

    v = np.zeros_like(r)
    for j in range(n_crits):
        col = r[:, j]
        mn, mx = col.min(), col.max()
        rng = mx - mn if mx != mn else 1.0
        if data.criteria_types[j] == "cost":
            v[:, j] = (mx - col) / rng
        else:
            v[:, j] = (col - mn) / rng

    scores = (v * w_norm).sum(axis=1)
    order = np.argsort(-scores)   # indices from best to worst

    return {
        "scores": scores.tolist(),
        "normalized_weights": w_norm.tolist(),
        "normalized_ratings": v.tolist(),
        "ranking": order.tolist(),  # 0-indexed, best first
    }

# ── PAPRIKA ───────────────────────────────────────────────────

class PAPRIKARequest(BaseModel):
    ratings: list[list[float]]    # [n_alts][n_crits], 1-10
    comparisons: list[dict]       # [{"i": int, "j": int, "winner": int}]

@app.post("/api/calculate-paprika")
def calculate_paprika(data: PAPRIKARequest):
    r = np.array(data.ratings, dtype=float)   # (n_alts, n_crits)
    n_crits = r.shape[1]

    # Derive weights from pairwise trade-off comparisons (Laplace smoothing)
    wins = np.ones(n_crits, dtype=float)
    for comp in data.comparisons:
        wins[int(comp["winner"])] += 1
    weights = wins / wins.sum()

    # Normalize ratings per criterion (benefit direction, 1-10 scale)
    v = np.zeros_like(r)
    for j in range(n_crits):
        col = r[:, j]
        mn, mx = col.min(), col.max()
        rng = mx - mn if mx != mn else 1.0
        v[:, j] = (col - mn) / rng

    scores = (v * weights).sum(axis=1)
    order = np.argsort(-scores)

    return {
        "weights": weights.tolist(),
        "scores": scores.tolist(),
        "normalized_ratings": v.tolist(),
        "ranking": order.tolist(),  # 0-indexed, best first
        "criteria_wins": (wins - 1).tolist(),  # subtract Laplace prior
    }
