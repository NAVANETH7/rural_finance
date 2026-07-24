import numpy as np
import pandas as pd
import os
import random
from datetime import datetime, timedelta

def generate_synthetic_data(num_records=5000, output_path="synthetic_transactions.csv"):
    categories = ['Agri Input', 'Retail Sales', 'Dairy & Livestock', 'Machinery Rental', 'Fertilizers', 'Personal Expense', 'Utility Bills']
    payment_methods = ['UPI', 'Cash', 'Bank Transfer']
    villages = ['Bhavani', 'Gobichettipalayam', 'Sathyamangalam', 'Anthiyur', 'Perundurai']

    start_date = datetime.now() - timedelta(days=365)
    records = []

    for i in range(num_records):
        txn_date = start_date + timedelta(days=random.randint(0, 365), hours=random.randint(6, 20))
        txn_type = 'Income' if random.random() > 0.4 else 'Expense'
        category = random.choice(categories)
        amount = round(random.uniform(200, 15000), 2)
        payment = random.choice(payment_methods)
        village = random.choice(villages)
        shg_boost = round(random.uniform(0, 15), 1)

        records.append({
            "transaction_id": f"TXN_{10000 + i}",
            "date": txn_date.strftime("%Y-%m-%d"),
            "timestamp": txn_date.isoformat(),
            "type": txn_type,
            "category": category,
            "amount": amount,
            "payment_method": payment,
            "village": village,
            "shg_boost_percent": shg_boost,
            "is_drought_season": 1 if txn_date.month in [6, 7, 8] else 0
        })

    df = pd.DataFrame(records)
    dir_name = os.path.dirname(output_path)
    if dir_name:
        os.makedirs(dir_name, exist_ok=True)
    df.to_csv(output_path, index=False)
    print(f"Synthetic dataset with {len(df)} records generated at: {output_path}")

if __name__ == "__main__":
    generate_synthetic_data(output_path="ai-engine/ai/dataset/synthetic_data.csv")
