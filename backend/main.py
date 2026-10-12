from typing import Annotated, Literal, Union

from fastapi import FastAPI, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.exception_handlers import request_validation_exception_handler
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, model_validator
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

# ── AHP – kompletní model (váhy kritérií + hodnocení alternativ) ─────────────
#
# Výpočetní část je v čistých funkcích bez závislosti na FastAPI, endpoint je jen
# tenká vrstva nad compute_ahp_full(). Hierarchie má zatím jednu úroveň kritérií;
# víceúrovňová by globální váhu listového kritéria získala součinem vah po cestě
# od kořene a do synthesize() předala listy – zbytek výpočtu zůstane stejný.

AHP_MIN_CRITERIA, AHP_MAX_CRITERIA = 2, 8
AHP_MIN_ALTERNATIVES, AHP_MAX_ALTERNATIVES = 2, 6
CR_THRESHOLD = 0.1
RECIPROCITY_TOLERANCE = 0.01
# Saatyho náhodné indexy – stejná tabulka jako v pyDecision.ahp_method
RANDOM_INDEX = [0, 0, 0, 0.58, 0.9, 1.12, 1.24, 1.32, 1.41, 1.45, 1.49, 1.51, 1.48, 1.56, 1.57, 1.59]


def pairwise_priorities(matrix):
    """Priority a konzistence párové matice.

    Váhy počítá pyDecision.ahp_method (stejně jako /api/calculate-ahp), λmax
    stejným vzorcem (průměr (A·w)_i / w_i). Pro n ≤ 2 je RI = 0, a tedy CR = 0.
    """
    a = np.array(matrix, dtype=float)
    n = a.shape[0]
    with np.errstate(divide="ignore", invalid="ignore"):  # pyDecision dělí RI = 0 pro n ≤ 2
        weights, _ = ahp_method(a)
    lambda_max = float(np.mean((a @ weights) / weights))
    if n <= 2:
        ci, ri, cr = 0.0, 0.0, 0.0
    else:
        ci = (lambda_max - n) / (n - 1)
        ri = RANDOM_INDEX[n]
        cr = ci / ri
    return weights, {
        "lambda_max": lambda_max,
        "ci": float(ci),
        "ri": float(ri),
        "cr": float(cr),
        "is_consistent": bool(cr < CR_THRESHOLD),
    }


def normalize_to_sum(vector):
    """Distributivní normalizace na součet 1; nulový vektor → rovnoměrné priority."""
    v = np.array(vector, dtype=float)
    total = v.sum()
    if total <= 0:
        return np.full(v.shape, 1.0 / v.size)
    return v / total


def direct_priorities(scores):
    """Přímé hodnocení 0–100 – lokální priority jsou body samotné."""
    return np.array(scores, dtype=float)


def smart_priorities(values, kind):
    """Min-max hodnotová funkce jako v /api/calculate-smart (shodné hodnoty → nuly)."""
    x = np.array(values, dtype=float)
    mn, mx = x.min(), x.max()
    rng = mx - mn if mx != mn else 1.0
    return (mx - x) / rng if kind == "cost" else (x - mn) / rng


def evaluate_alternatives(evaluation):
    """Lokální priority alternativ vůči jednomu kritériu (před i po normalizaci)."""
    method = evaluation["method"]
    consistency = None
    if method == "pairwise":
        raw, consistency = pairwise_priorities(evaluation["matrix"])
    elif method == "direct":
        raw = direct_priorities(evaluation["scores"])
    elif method == "smart":
        raw = smart_priorities(evaluation["values"], evaluation["type"])
    else:
        raise ValueError(f"Neznámá metoda hodnocení: {method}")
    return {
        "method": method,
        "raw": raw,
        "normalized": normalize_to_sum(raw),
        "consistency": consistency,
    }


def synthesize(criteria_weights, local_normalized):
    """Distributivní syntéza: příspěvek[i, j] = w_j · p_ij, skóre = součet řádku."""
    local = np.column_stack(local_normalized)          # (n_alts, n_crits)
    contributions = local * np.array(criteria_weights)
    scores = contributions.sum(axis=1)
    ranking = np.argsort(-scores, kind="stable")       # nejlepší první, při shodě nižší index
    return contributions, scores, ranking


def compute_ahp_full(criteria_matrix, alternative_evaluations):
    criteria_weights, criteria_consistency = pairwise_priorities(criteria_matrix)
    local = [evaluate_alternatives(ev) for ev in alternative_evaluations]
    contributions, scores, ranking = synthesize(criteria_weights, [l["normalized"] for l in local])

    inconsistent = []
    if not criteria_consistency["is_consistent"]:
        inconsistent.append({"target": "criteria", "criterion": None, "cr": criteria_consistency["cr"]})
    for j, l in enumerate(local):
        if l["consistency"] is not None and not l["consistency"]["is_consistent"]:
            inconsistent.append({"target": "alternatives", "criterion": j, "cr": l["consistency"]["cr"]})

    return {
        "criteria": {
            "weights": criteria_weights.tolist(),
            "consistency": criteria_consistency,
        },
        "local_priorities": [
            {
                "method": l["method"],
                "raw": l["raw"].tolist(),
                "normalized": l["normalized"].tolist(),
                "consistency": l["consistency"],
            }
            for l in local
        ],
        "weighted_contributions": contributions.tolist(),   # [alternativa][kritérium]
        "global_scores": scores.tolist(),
        "ranking": ranking.tolist(),                        # 0-indexed, nejlepší první
        "inconsistent_matrices": inconsistent,
    }


def validate_pairwise_matrix(matrix, label, min_n, max_n):
    n = len(matrix)
    if not min_n <= n <= max_n:
        raise ValueError(f"{label}: rozměr musí být {min_n}–{max_n}, je {n}.")
    for row in matrix:
        if len(row) != n:
            raise ValueError(f"{label}: matice musí být čtvercová ({n}×{n}).")
    for i in range(n):
        for j in range(n):
            if not np.isfinite(matrix[i][j]) or matrix[i][j] <= 0:
                raise ValueError(f"{label}: všechny hodnoty musí být kladná konečná čísla (řádek {i + 1}, sloupec {j + 1}).")
        if abs(matrix[i][i] - 1) > RECIPROCITY_TOLERANCE:
            raise ValueError(f"{label}: na diagonále musí být 1 (řádek {i + 1}).")
        for j in range(i + 1, n):
            if abs(matrix[i][j] * matrix[j][i] - 1) > RECIPROCITY_TOLERANCE:
                raise ValueError(f"{label}: matice není reciproční (prvky [{i + 1},{j + 1}] a [{j + 1},{i + 1}]).")


class PairwiseEvaluation(BaseModel):
    method: Literal["pairwise"]
    matrix: list[list[float]]


class DirectEvaluation(BaseModel):
    method: Literal["direct"]
    scores: list[float]


class SmartEvaluation(BaseModel):
    method: Literal["smart"]
    values: list[float]
    type: Literal["benefit", "cost"]


AlternativeEvaluation = Annotated[
    Union[PairwiseEvaluation, DirectEvaluation, SmartEvaluation],
    Field(discriminator="method"),
]


class AHPFullRequest(BaseModel):
    criteria_matrix: list[list[float]]
    alternative_evaluations: list[AlternativeEvaluation]

    @model_validator(mode="after")
    def check_dimensions(self):
        validate_pairwise_matrix(self.criteria_matrix, "Matice kritérií", AHP_MIN_CRITERIA, AHP_MAX_CRITERIA)
        n_crit = len(self.criteria_matrix)
        if len(self.alternative_evaluations) != n_crit:
            raise ValueError(
                f"Počet hodnocení alternativ ({len(self.alternative_evaluations)}) "
                f"neodpovídá počtu kritérií ({n_crit})."
            )
        n_alts = None
        for j, ev in enumerate(self.alternative_evaluations):
            label = f"Kritérium {j + 1}"
            if isinstance(ev, PairwiseEvaluation):
                validate_pairwise_matrix(ev.matrix, f"{label} – párová matice alternativ",
                                         AHP_MIN_ALTERNATIVES, AHP_MAX_ALTERNATIVES)
                size = len(ev.matrix)
            elif isinstance(ev, DirectEvaluation):
                size = len(ev.scores)
                if any(not np.isfinite(s) or s < 0 or s > 100 for s in ev.scores):
                    raise ValueError(f"{label}: body přímého hodnocení musí být v rozsahu 0–100.")
            else:
                size = len(ev.values)
                if any(not np.isfinite(v) for v in ev.values):
                    raise ValueError(f"{label}: hodnoty SMART musí být konečná čísla.")
            if not AHP_MIN_ALTERNATIVES <= size <= AHP_MAX_ALTERNATIVES:
                raise ValueError(
                    f"{label}: počet alternativ musí být {AHP_MIN_ALTERNATIVES}–{AHP_MAX_ALTERNATIVES}, je {size}."
                )
            if n_alts is None:
                n_alts = size
            elif size != n_alts:
                raise ValueError(f"{label}: počet alternativ ({size}) se liší od ostatních kritérií ({n_alts}).")
        return self


AHP_FULL_PATH = "/api/calculate-ahp-full"


def czech_validation_message(errors):
    """Převede chyby Pydanticu na jednu českou zprávu."""
    messages = []
    for err in errors:
        if err["type"] == "value_error":
            messages.append(str(err.get("ctx", {}).get("error", err["msg"])))
            continue
        loc = ".".join(str(p) for p in err["loc"] if p != "body")
        if err["type"] == "missing":
            messages.append(f"Chybí povinné pole: {loc}.")
        elif err["type"] == "union_tag_not_found":
            messages.append(f"Chybí metoda hodnocení ({loc}): povolené jsou pairwise, direct, smart.")
        elif err["type"] == "union_tag_invalid":
            messages.append(f"Neplatná metoda hodnocení ({loc}): povolené jsou pairwise, direct, smart.")
        elif err["type"] == "literal_error":
            expected = str(err.get("ctx", {}).get("expected", "")).replace(" or ", ", ")
            messages.append(f"Neplatná hodnota pole {loc}, povolené hodnoty: {expected}.")
        else:
            messages.append(f"Neplatný formát vstupu v poli {loc or 'tělo požadavku'}.")
    return " ".join(dict.fromkeys(messages)) or "Neplatný vstup."


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # Česká zpráva jen pro nový endpoint, ostatní endpointy chovají jako dřív
    if request.url.path != AHP_FULL_PATH:
        return await request_validation_exception_handler(request, exc)
    return JSONResponse(
        status_code=422,
        content=jsonable_encoder({"detail": czech_validation_message(exc.errors())}),
    )


@app.post(AHP_FULL_PATH)
def calculate_ahp_full(data: AHPFullRequest):
    return compute_ahp_full(
        data.criteria_matrix,
        [ev.model_dump() for ev in data.alternative_evaluations],
    )

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
