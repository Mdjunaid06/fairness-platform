from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="Universal AI Fairness Engine",
    description="Bias Detection and Mitigation API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "ai-engine"}


# ── DATASET ANALYSIS ─────────────────────────────────────────────────────────
class DatasetAnalysisRequest(BaseModel):
    gcs_uri: str
    target_column: str
    sensitive_features: List[str]
    task_type: str = "classification"


@app.post("/analyze/dataset")
async def analyze_dataset(request: DatasetAnalysisRequest):
    try:
        from bias_detection.dataset_analyzer import DatasetAnalyzer
        analyzer = DatasetAnalyzer()
        result = analyzer.analyze(
            gcs_uri=request.gcs_uri,
            target_column=request.target_column,
            sensitive_features=request.sensitive_features
        )
        return JSONResponse(content=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── MODEL AUDIT ───────────────────────────────────────────────────────────────
class ModelAuditRequest(BaseModel):
    gcs_uri: str
    target_column: str
    sensitive_features: List[str]
    model_type: str = "auto"


@app.post("/analyze/model")
async def audit_model(request: ModelAuditRequest):
    try:
        from bias_detection.model_auditor import ModelAuditor
        auditor = ModelAuditor()
        result = auditor.audit(
            gcs_uri=request.gcs_uri,
            target_column=request.target_column,
            sensitive_features=request.sensitive_features,
            model_type=request.model_type
        )
        return JSONResponse(content=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── LLM TESTING ───────────────────────────────────────────────────────────────
class LLMTestRequest(BaseModel):
    provider: str
    model_name: str
    test_suite: str = "default"
    custom_prompts: List[dict] = []


@app.post("/analyze/llm")
async def test_llm_bias(request: LLMTestRequest):
    try:
        from bias_detection.llm_tester import LLMTester
        tester = LLMTester()
        result = tester.run_test_suite(
            provider=request.provider,
            model_name=request.model_name,
            test_suite=request.test_suite,
            custom_prompts=request.custom_prompts
        )
        return JSONResponse(content=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── MITIGATION ────────────────────────────────────────────────────────────────
class MitigationRequest(BaseModel):
    gcs_uri: str
    target_column: str
    sensitive_features: List[str]
    strategy: str


@app.post("/mitigate")
async def mitigate_bias(request: MitigationRequest):
    try:
        if request.strategy == "resample":
            from mitigation.resampler import DataResampler
            engine = DataResampler()
        elif request.strategy == "remove_feature":
            from mitigation.feature_remover import FeatureRemover
            engine = FeatureRemover()
        else:
            raise HTTPException(status_code=400, detail="Unknown strategy")

        result = engine.mitigate(
            gcs_uri=request.gcs_uri,
            target_column=request.target_column,
            sensitive_features=request.sensitive_features
        )
        return JSONResponse(content=result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)