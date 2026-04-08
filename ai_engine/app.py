from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
import os
import json
import numpy as np
from dotenv import load_dotenv

load_dotenv()


# ── JSON SERIALIZER ───────────────────────────────────────────
class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.bool_):
            return bool(obj)
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return super().default(obj)


def json_safe(result):
    return json.loads(json.dumps(result, cls=NumpyEncoder))


# ── APP SETUP ─────────────────────────────────────────────────
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


# ── HEALTH ────────────────────────────────────────────────────
@app.get("/health")
def health_check():
    return {"status": "ok", "service": "ai-engine"}


# ── DATASET ANALYSIS ──────────────────────────────────────────
class DatasetAnalysisRequest(BaseModel):
    model_config = {"protected_namespaces": ()}
    gcs_uri: str
    target_column: str
    sensitive_features: List[str]
    task_type: str = "classification"
    file_id: Optional[str] = None


@app.post("/analyze/dataset")
async def analyze_dataset(request: DatasetAnalysisRequest):
    try:
        from bias_detection.dataset_analyzer import DatasetAnalyzer
        analyzer = DatasetAnalyzer()
        result = analyzer.analyze(
            gcs_uri=request.gcs_uri,
            target_column=request.target_column,
            sensitive_features=request.sensitive_features,
            file_id=request.file_id
        )
        return JSONResponse(content=json_safe(result))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── MODEL AUDIT ───────────────────────────────────────────────
class ModelAuditRequest(BaseModel):
    model_config = {"protected_namespaces": ()}
    gcs_uri: Optional[str] = ""
    target_column: str
    sensitive_features: List[str]
    model_type: str = "auto"
    file_id: Optional[str] = None


@app.post("/analyze/model")
async def audit_model(request: ModelAuditRequest):
    try:
        from bias_detection.model_auditor import ModelAuditor
        auditor = ModelAuditor()
        result = auditor.audit(
            gcs_uri=request.gcs_uri or "",
            target_column=request.target_column,
            sensitive_features=request.sensitive_features,
            model_type=request.model_type,
            file_id=request.file_id
        )
        return JSONResponse(content=json_safe(result))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── LLM TESTING ───────────────────────────────────────────────
class LLMTestRequest(BaseModel):
    model_config = {"protected_namespaces": ()}
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
        return JSONResponse(content=json_safe(result))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── MITIGATION ────────────────────────────────────────────────
class MitigationRequest(BaseModel):
    model_config = {"protected_namespaces": ()}
    gcs_uri: str
    target_column: str
    sensitive_features: List[str]
    strategy: str
    file_id: Optional[str] = None


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
            raise HTTPException(
                status_code=400,
                detail="Unknown strategy"
            )

        result = engine.mitigate(
            gcs_uri=request.gcs_uri,
            target_column=request.target_column,
            sensitive_features=request.sensitive_features
        )
        return JSONResponse(content=json_safe(result))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── COLUMN DETECTION ──────────────────────────────────────────
class ColumnDetectRequest(BaseModel):
    model_config = {"protected_namespaces": ()}
    gcs_uri: Optional[str] = ""
    file_id: Optional[str] = None


@app.post("/detect/columns")
async def detect_columns(request: ColumnDetectRequest):
    try:
        from bias_detection.column_detector import ColumnDetector
        detector = ColumnDetector()
        result = detector.detect(
            gcs_uri=request.gcs_uri,
            file_id=request.file_id
        )
        return JSONResponse(content=json_safe(result))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── DEMO DATASETS ─────────────────────────────────────────────
@app.get("/demo/datasets")
async def list_demo_datasets():
    try:
        from bias_detection.demo_datasets import DEMO_DATASETS
        return JSONResponse(content={
            "datasets": [
                {
                    "key": k,
                    "name": v["name"],
                    "description": v["description"],
                    "sensitive_features": v["sensitive_features"],
                    "target": v["target"],
                    "known_bias": v["known_bias"],
                    "legal_context": v["legal_context"],
                    "source": v["source"]
                }
                for k, v in DEMO_DATASETS.items()
            ]
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class DemoDatasetRequest(BaseModel):
    model_config = {"protected_namespaces": ()}
    dataset_key: str


@app.post("/demo/analyze")
async def analyze_demo_dataset(request: DemoDatasetRequest):
    try:
        from bias_detection.demo_datasets import (
            generate_demo_dataset, DEMO_DATASETS
        )
        from bias_detection.dataset_analyzer import DatasetAnalyzer

        if request.dataset_key not in DEMO_DATASETS:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown dataset: {request.dataset_key}"
            )

        config = DEMO_DATASETS[request.dataset_key]
        df = generate_demo_dataset(request.dataset_key)

        analyzer = DatasetAnalyzer()
        result = analyzer.analyze(
            gcs_uri="demo://",
            target_column=config["target"],
            sensitive_features=config["sensitive_features"],
            file_id=None,
            df_override=df
        )

        result["demo_info"] = {
            "key": request.dataset_key,
            "name": config["name"],
            "description": config["description"],
            "target": config["target"],
            "sensitive_features": config["sensitive_features"],
            "known_bias": config["known_bias"],
            "legal_context": config["legal_context"],
            "source": config["source"]
        }
        return JSONResponse(content=json_safe(result))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
# ── LEGAL CHECK ───────────────────────────────────────────────
class LegalCheckRequest(BaseModel):
    model_config = {"protected_namespaces": ()}
    analysis_results: dict
    sensitive_features: List[str]
    context_keywords: List[str] = []


@app.post("/analyze/legal")
async def legal_check(request: LegalCheckRequest):
    try:
        from bias_detection.legal_checker import LegalChecker
        checker = LegalChecker()
        result = checker.check(
            analysis_results=request.analysis_results,
            sensitive_features=request.sensitive_features,
            context_keywords=request.context_keywords
        )
        return JSONResponse(content=json_safe(result))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── NARRATIVE REPORT ──────────────────────────────────────────
class NarrativeRequest(BaseModel):
    model_config = {"protected_namespaces": ()}
    analysis_results: dict
    sensitive_features: List[str]
    target_column: str
    legal_results: dict = {}


@app.post("/analyze/narrative")
async def generate_narrative(request: NarrativeRequest):
    try:
        from explainability.narrative_generator import NarrativeGenerator
        generator = NarrativeGenerator()
        result = generator.generate(
            analysis_result=request.analysis_results,
            sensitive_features=request.sensitive_features,
            target_column=request.target_column,
            legal_result=request.legal_results or None
        )
        return JSONResponse(content=json_safe(result))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        reload=True
    )