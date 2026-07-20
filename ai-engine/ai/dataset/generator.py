import csv
import random
import os
from datetime import datetime, timedelta

def generate_synthetic_data(output_path="ai-engine/ai/dataset/synthetic_data.csv", num_businesses=50, days=365):
    # Ensure directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    categories = ["Agriculture", "Retail", "Services", "Handicrafts", "Livestock"]
    payment_methods = ["UPI", "Cash", "Bank Transfer", "Other"]
    
    headers = [
        "business_id", "business_category", "business_age", 
        "monthly_income", "monthly_expenses", "date", 
        "tx_type", "tx_category", "tx_amount", "tx_payment_method",
        "default_risk_label" # 1 = Defaulted/High-Risk, 0 = Safe
    ]
    
    start_date = datetime.now() - timedelta(days=days)
    
    with open(output_path, mode='w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(headers)
        
        for bus_idx in range(num_businesses):
            business_id = f"bus_{1000 + bus_idx}"
            category = random.choice(categories)
            business_age = random.randint(3, 60) # months
            
            # Determine profile risk type
            # 0 = Safe/Healthy, 1 = Risky/Vulnerable
            risk_profile = random.choices([0, 1], weights=[0.75, 0.25])[0]
            
            # Base income and expenses
            base_income = random.randint(15000, 100000)
            if risk_profile == 1:
                # Vulnerable profile: high expenses relative to income
                base_expenses = int(base_income * random.uniform(0.85, 1.1))
            else:
                base_expenses = int(base_income * random.uniform(0.4, 0.7))
                
            # Loop days to generate daily transactions
            for day_offset in range(days):
                current_date = start_date + timedelta(days=day_offset)
                
                # Check for seasonality (e.g. festivals in Oct/Nov, crop harvests)
                season_mult = 1.0
                if category == "Agriculture" and current_date.month in [4, 9, 10]:
                    # Harvest months see high income
                    season_mult = 1.8
                elif current_date.month in [10, 11]:
                    # Festival season multiplier for all retail/handicrafts
                    season_mult = 1.5
                
                # Number of transactions today
                num_tx = random.choices([0, 1, 2, 3], weights=[0.2, 0.5, 0.2, 0.1])[0]
                
                for _ in range(num_tx):
                    tx_type = random.choices(["Income", "Expense"], weights=[0.45, 0.55])[0]
                    
                    if tx_type == "Income":
                        tx_category = "Sales" if category != "Agriculture" else "Crop Harvesting"
                        tx_amount = round((base_income / 15) * random.uniform(0.5, 1.5) * season_mult, 2)
                    else:
                        tx_category = random.choice(["Inventory", "Rent", "Utilities", "Logistics", "Wages"])
                        tx_amount = round((base_expenses / 20) * random.uniform(0.5, 1.5), 2)
                        
                    payment_method = random.choice(payment_methods)
                    
                    writer.writerow([
                        business_id, category, business_age,
                        base_income, base_expenses, current_date.strftime("%Y-%m-%d"),
                        tx_type, tx_category, tx_amount, payment_method,
                        risk_profile
                    ])
                    
    print(f"Successfully generated synthetic dataset with {num_businesses} business records at: {output_path}")

if __name__ == "__main__":
    generate_synthetic_data(num_businesses=500, days=3650)
