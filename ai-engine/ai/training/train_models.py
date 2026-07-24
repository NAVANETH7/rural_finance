import os
import pickle
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, IsolationForest, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split

def train_and_export():
    dataset_path = "ai-engine/ai/dataset/synthetic_data.csv"
    if not os.path.exists(dataset_path):
        from ai.dataset.generate_synthetic import generate_synthetic_data
        generate_synthetic_data(output_path=dataset_path)

    df = pd.read_csv(dataset_path)
    print(f"Loaded synthetic dataset with {len(df)} records.")

    # 1. Train Credit Risk Random Forest Model
    X_risk = []
    y_risk = []

    for i in range(1000):
        monthly_income = np.random.uniform(15000, 150000)
        monthly_expenses = np.random.uniform(5000, monthly_income * 1.2)
        cash_margin_ratio = (monthly_income - monthly_expenses) / (monthly_income + 1)
        shg_score = np.random.uniform(40, 100)
        business_age = np.random.uniform(3, 180)

        # Label: Default Risk (1 = High Risk, 0 = Low Risk)
        is_default_risk = 1 if cash_margin_ratio < 0.15 or (monthly_expenses > monthly_income) else 0

        X_risk.append([monthly_income, monthly_expenses, cash_margin_ratio, shg_score, business_age])
        y_risk.append(is_default_risk)

    X_risk = np.array(X_risk)
    y_risk = np.array(y_risk)

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_risk)

    risk_model = RandomForestClassifier(n_estimators=150, random_state=42)
    risk_model.fit(X_scaled, y_risk)

    # 2. Train Isolation Forest Anomaly Detection Model
    X_anomaly = np.random.normal(loc=2500, scale=1000, size=(1000, 2))
    # Inject outliers
    outliers = np.random.uniform(low=20000, high=100000, size=(50, 2))
    X_anomaly = np.vstack([X_anomaly, outliers])

    anomaly_model = IsolationForest(contamination=0.05, random_state=42)
    anomaly_model.fit(X_anomaly)

    # 3. Train Gradient Boosting Cash Flow & Mandi Yield Regressor
    X_cashflow = []
    y_cashflow = []

    for _ in range(800):
        day_of_year = np.random.randint(1, 365)
        mandi_index = np.random.uniform(0.8, 1.5)
        rainfall_mm = np.random.uniform(10, 300)
        historical_sales = np.random.uniform(10000, 80000)

        # Forecast formula with seasonality
        predicted = historical_sales * (1 + 0.15 * np.sin(2 * np.pi * day_of_year / 365)) * mandi_index

        X_cashflow.append([day_of_year, mandi_index, rainfall_mm, historical_sales])
        y_cashflow.append(predicted)

    X_cashflow = np.array(X_cashflow)
    y_cashflow = np.array(y_cashflow)

    cashflow_model = GradientBoostingRegressor(n_estimators=100, random_state=42)
    cashflow_model.fit(X_cashflow, y_cashflow)

    # Save Models & Artifacts
    save_dirs = ["ai-engine/ai/saved-model", "ai-engine/ai/models"]
    for sdir in save_dirs:
        os.makedirs(sdir, exist_ok=True)
        with open(os.path.join(sdir, "risk_model.pkl"), "wb") as f:
            pickle.dump(risk_model, f)
        with open(os.path.join(sdir, "scaler.pkl"), "wb") as f:
            pickle.dump(scaler, f)
        with open(os.path.join(sdir, "anomaly_model.pkl"), "wb") as f:
            pickle.dump(anomaly_model, f)
        with open(os.path.join(sdir, "cashflow_model.pkl"), "wb") as f:
            pickle.dump(cashflow_model, f)

    print(f"All 3 AI Models (Risk RF, Anomaly IF, Cashflow GBR) & Scalers exported successfully!")

if __name__ == "__main__":
    train_and_export()
