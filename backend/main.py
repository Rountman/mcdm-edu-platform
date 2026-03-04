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
        "is_consistent": bool(rc < 0.1)
    }