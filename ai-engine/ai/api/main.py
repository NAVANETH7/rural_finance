from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import numpy as np
import pandas as pd
import joblib
import os
from datetime import datetime, timedelta

app = FastAPI(title="AI Rural Finance ML Engine", version="1.0.0")

MODEL_PATH = "ai-engine/ai/models/risk_model.pkl"
risk_model = None

# Attempt to load the trained model on startup
if os.path.exists(MODEL_PATH):
    try:
        risk_model = joblib.load(MODEL_PATH)
        print(f"Loaded trained risk classification model from {MODEL_PATH}")
    except Exception as e:
        print(f"Failed to load model from {MODEL_PATH}: {e}")

class TransactionItem(BaseModel):
    date: str
    type: str # 'Income' or 'Expense'
    category: str
    amount: float
    paymentMethod: str

class PredictCashflowRequest(BaseModel):
    business_id: str
    horizon: str = Field(default="month", description="week, month, quarter, or year")
    transactions: List[TransactionItem]

class PredictCashflowResponse(BaseModel):
    business_id: str
    horizon: str
    forecast: List[Dict[str, Any]]
    confidence_score: float

class RiskScoreRequest(BaseModel):
    business_id: str
    category: str
    monthly_income: float
    monthly_expenses: float
    business_age: int
    transactions: List[TransactionItem]

class FlagItem(BaseModel):
    flagName: str
    explanation: str

class RiskScoreResponse(BaseModel):
    business_id: str
    score: float
    color: str # 'green', 'yellow', 'red'
    severity: str # 'Low', 'Medium', 'High'
    triggered_flags: List[FlagItem]
    explainability_data: Dict[str, Any]

@app.get("/health")
def health_check():
    return {
        "status": "OK", 
        "service": "ML Engine",
        "model_loaded": risk_model is not None
    }

@app.post("/predict/cashflow", response_model=PredictCashflowResponse)
def predict_cashflow(payload: PredictCashflowRequest):
    txs = payload.transactions
    if not txs:
        # Generate default baseline if no transaction history exists
        txs = [
            TransactionItem(date=(datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d"), type="Income", category="Sales", amount=2000.0, paymentMethod="UPI")
            for i in range(10)
        ]

    # Process transactions into pandas DataFrame
    data = []
    for t in txs:
        try:
            date_parsed = datetime.strptime(t.date, "%Y-%m-%d")
        except:
            date_parsed = datetime.now()
        data.append({
            "date": date_parsed,
            "type": t.type,
            "amount": t.amount
        })
    df = pd.DataFrame(data)
    df = df.sort_values("date")

    # Group daily aggregates
    df["date_only"] = df["date"].dt.date
    daily = df.groupby("date_only").apply(
        lambda g: pd.Series({
            "income": g[g["type"] == "Income"]["amount"].sum(),
            "expense": g[g["type"] == "Expense"]["amount"].sum()
        })
    ).reset_index()

    # Regression trend prediction
    avg_daily_income = daily["income"].mean() if not daily.empty else 1500.0
    avg_daily_expense = daily["expense"].mean() if not daily.empty else 1000.0
    
    # Generate forecasted steps
    forecast = []
    horizon_days = 30
    if payload.horizon == "week":
        horizon_days = 7
    elif payload.horizon == "quarter":
        horizon_days = 90
    elif payload.horizon == "year":
        horizon_days = 365
        
    start_date = datetime.now()
    current_balance = avg_daily_income - avg_daily_expense
    
    for i in range(1, horizon_days + 1):
        date_fut = start_date + timedelta(days=i)
        
        # Incorporate seasonality (holidays and harvests)
        mult = 1.0
        if date_fut.month in [10, 11]:
            mult = 1.4 # Festival multiplier
            
        noise_inc = avg_daily_income * (1 + (np.random.normal(0, 0.15))) * mult
        noise_exp = avg_daily_expense * (1 + (np.random.normal(0, 0.1)))
        
        noise_inc = max(0.0, noise_inc)
        noise_exp = max(0.0, noise_exp)
        current_balance += (noise_inc - noise_exp)
        
        forecast.append({
            "date": date_fut.strftime("%Y-%m-%d"),
            "predictedIncome": round(noise_inc, 2),
            "predictedExpense": round(noise_exp, 2),
            "predictedBalance": round(current_balance, 2)
        })

    # Confidence calculation: lower with longer horizon
    confidence = 88.0 - (horizon_days * 0.05)
    confidence = max(50.0, min(95.0, confidence))

    return PredictCashflowResponse(
        business_id=payload.business_id,
        horizon=payload.horizon,
        forecast=forecast,
        confidence_score=round(confidence, 1)
    )

@app.post("/risk-score", response_model=RiskScoreResponse)
def get_risk_score(payload: RiskScoreRequest):
    # Compute features for risk classification
    business_age = payload.business_age
    category = payload.category
    
    txs = payload.transactions
    income_sum = sum(t.amount for t in txs if t.type == "Income")
    expense_sum = sum(t.amount for t in txs if t.type == "Expense")
    net_savings = income_sum - expense_sum
    expense_to_income = expense_sum / max(income_sum, 1.0)
    
    tx_count = len(txs)
    avg_tx_size = sum(t.amount for t in txs) / max(tx_count, 1.0)
    
    cat_agri = 1.0 if category == "Agriculture" else 0.0
    cat_retail = 1.0 if category == "Retail" else 0.0
    cat_services = 1.0 if category == "Services" else 0.0
    
    feature_vector = np.array([[
        business_age, income_sum, expense_sum,
        net_savings, expense_to_income, tx_count, avg_tx_size,
        cat_agri, cat_retail, cat_services
    ]])
    
    score = 15.0
    
    if risk_model is not None:
        try:
            # Predict default risk probability
            prob = risk_model.predict_proba(feature_vector)[0][1]
            score = round(prob * 100, 2)
        except Exception as e:
            print(f"Error evaluating model prediction: {e}")
            # Rollback to heuristic scoring if model prediction fails
            score = round(expense_to_income * 60.0 + (10.0 if net_savings < 0 else 0.0), 2)
    else:
        # Standard heuristic scoring
        score = round(expense_to_income * 60.0 + (10.0 if net_savings < 0 else 0.0), 2)
        
    score = max(0.0, min(100.0, score))
    
    triggered_flags = []
    if expense_to_income > 0.8:
        triggered_flags.append(FlagItem(
            flagName="high_expense_to_income", 
            explanation=f"Monthly operating expenses constitute {round(expense_to_income * 100)}% of income."
        ))
    if net_savings < 0:
        triggered_flags.append(FlagItem(
            flagName="negative_net_savings",
            explanation="Business operating ledger reflects negative net cash balances over evaluation horizon."
        ))
    if business_age < 6:
        triggered_flags.append(FlagItem(
            flagName="infant_business",
            explanation="Operating lifespan of business profile is under 6 months."
        ))
        
    color = "green"
    severity = "Low"
    if score >= 75.0:
        color = "red"
        severity = "High"
    elif score >= 40.0:
        color = "yellow"
        severity = "Medium"
        
    # Explainability mapping (Feature Importances proxy)
    explainability = {
        "expense_to_income_ratio_contribution": round(expense_to_income * 0.7, 3),
        "net_savings_contribution": round(net_savings * -0.0001, 3),
        "business_age_contribution": round(business_age * -0.005, 3),
        "transaction_volatility": round(avg_tx_size * 0.0002, 3)
    }

    return RiskScoreResponse(
        business_id=payload.business_id,
        score=score,
        color=color,
        severity=severity,
        triggered_flags=triggered_flags,
        explainability_data=explainability
    )

@app.post("/retrain")
def retrain_models():
    global risk_model
    try:
        from ai.training.train import train_models
        train_models()
        if os.path.exists(MODEL_PATH):
            risk_model = joblib.load(MODEL_PATH)
            return {"status": "success", "message": "Model retrained and reloaded successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
