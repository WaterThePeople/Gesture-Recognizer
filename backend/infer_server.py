from contextlib import asynccontextmanager
from typing import List

import torch
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from signs_recognizer import SignsRecognizer, signs


# 1. Define the input schema
class InferenceRequest(BaseModel):
    data: List[float]


# 2. Define the output schema
class InferenceResponse(BaseModel):
    prediction: str
    confidence: float


model_assets = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    model = SignsRecognizer()
    model.load_state_dict(torch.load("recognizer.pth", weights_only=True))

    device = torch.device("cpu")
    model.eval()
    model.to(device)

    model_assets["model"] = model
    model_assets["device"] = device
    yield
    model_assets.clear()


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/infer", response_model=InferenceResponse)
async def infer(request: InferenceRequest):
    try:
        if len(request.data) != 63:
            raise ValueError(
                f"Invalid input data length (expected 63 got {len(request.data)})"
            )

        input_tensor = torch.tensor(request.data, dtype=torch.float32)
        input_tensor = input_tensor.to(model_assets["device"])

        output_tensor = model_assets["model"](input_tensor)
        probs = torch.nn.functional.softmax(output_tensor, dim=0)

        confidence = probs.max().item()
        prediction = signs[int(probs.argmax().item())]

        return {"prediction": prediction, "confidence": confidence}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/")
def read_root():
    return {"Hello": "World"}
