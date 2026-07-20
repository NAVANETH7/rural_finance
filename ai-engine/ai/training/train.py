import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import joblib
import os

def train_models(data_path="ai-engine/ai/dataset/synthetic_data.csv", model_dir="ai-engine/ai/models"):
    os.makedirs(model_dir, exist_ok=True)
    
    if not os.path.exists(data_path):
        print(f"Dataset not found at {data_path}. Please run generator first.")
        return
        
    df = pd.read_csv(data_path)
    
    # 1. Feature Engineering: Group by business to build classification dataset
    print("Pre-processing data and engineering features...")
    
    business_groups = df.groupby("business_id")
    
    features = []
    labels = []
    
    for business_id, group in business_groups:
        business_age = group["business_age"].iloc[0]
        category = group["business_category"].iloc[0]
        
        income_tx = group[group["tx_type"] == "Income"]
        expense_tx = group[group["tx_type"] == "Expense"]
        
        total_income = income_tx["tx_amount"].sum()
        total_expenses = expense_tx["tx_amount"].sum()
        net_savings = total_income - total_expenses
        expense_to_income = total_expenses / max(total_income, 1.0)
        
        tx_count = len(group)
        avg_tx_size = group["tx_amount"].mean() if tx_count > 0 else 0
        
        # One-hot encoding categories manually for simplicity
        cat_agri = 1.0 if category == "Agriculture" else 0.0
        cat_retail = 1.0 if category == "Retail" else 0.0
        cat_services = 1.0 if category == "Services" else 0.0
        
        risk_label = group["default_risk_label"].iloc[0]
        
        features.append([
            business_age, total_income, total_expenses, 
            net_savings, expense_to_income, tx_count, avg_tx_size,
            cat_agri, cat_retail, cat_services
        ])
        labels.append(risk_label)
        
    X = np.array(features)
    y = np.array(labels)
    
    # Train / Test split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print(f"Training Random Forest Classifier on {len(X_train)} samples...")
    clf = RandomForestClassifier(n_estimators=100, random_state=42)
    clf.fit(X_train, y_train)
    
    # Evaluate
    y_pred = clf.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"Model Training completed. Test Accuracy: {accuracy:.4f}")
    print("Classification Report:")
    print(classification_report(y_test, y_pred))
    
    # Save Model
    model_path = os.path.join(model_dir, "risk_model.pkl")
    joblib.dump(clf, model_path)
    print(f"Saved Random Forest classifier model to: {model_path}")
    
if __name__ == "__main__":
    train_models()
