import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score
import joblib
import json
import sys
from typing import Dict, List
from collections import Counter
import os

def two_product_concentrate_mass(m_feed, grade_feed_pct, recovery_frac, grade_conc_pct):
    """Simple algebraic formula for concentrate mass calculation"""
    grade_feed = grade_feed_pct / 100.0
    grade_conc = grade_conc_pct / 100.0
    m_recovered = m_feed * grade_feed * recovery_frac
    if grade_conc <= 0:
        return 0.0, m_recovered
    m_conc = m_recovered / grade_conc
    return m_conc, m_recovered

def calculate_lca_row(row: Dict) -> Dict:
    """Deterministic LCA calculation"""
    elec = float(row.get('ElectricityConsumption_kWh') or 0.0)
    fuel_mj = float(row.get('FuelEnergy_MJ') or 0.0)
    trans_km = float(row.get('TransportDistance_km') or 0.0)
    recycle = float(row.get('RecyclePercent') or 0.0)
    reuse = float(row.get('ReusePercent') or 0.0)

    carbon_from_elec = elec * 0.5
    carbon_from_fuel = fuel_mj * 0.07
    carbon_from_transport = trans_km * 0.2

    carbon_emissions = carbon_from_elec + carbon_from_fuel + carbon_from_transport
    energy_consumed = elec * 3.6 + fuel_mj
    water_use = elec * 0.5 + fuel_mj * 0.1
    circularity = min(100.0, recycle * 0.7 + reuse * 0.5)

    recs = []
    if recycle < 50: recs.append("Increase recycled content")
    if trans_km > 200: recs.append("Optimize transport routes/modes")
    if elec > 1000: recs.append("Investigate renewable electricity / efficiency")

    return {
        "carbonEmissions": round(carbon_emissions, 2),
        "energyConsumed": round(energy_consumed, 2),
        "waterUse": round(water_use, 2),
        "circularityPercent": round(circularity, 1),
        "recommendations": recs
    }

def process_csv_data(csv_data: List[Dict]) -> Dict:
    """Process CSV data with ML training and prediction"""
    try:
        df = pd.DataFrame(csv_data)
        
        # Ensure numeric columns exist
        num_cols = ['ElectricityConsumption_kWh', 'FuelEnergy_MJ', 'TransportDistance_km',
                   'RecyclePercent', 'ReusePercent', 'LandfillPercent']
        
        for c in num_cols:
            if c not in df.columns:
                df[c] = 0
            df[c] = pd.to_numeric(df[c], errors='coerce').fillna(0.0)

        # Feature engineering
        df['transport_impact_est'] = df['TransportDistance_km'] * 0.2
        df['circularity_simple'] = (df['RecyclePercent'] + df['ReusePercent']).clip(upper=100)
        
        # Handle MaterialType encoding
        if 'MaterialType' in df.columns:
            df['MaterialType_cat'] = df['MaterialType'].astype('category').cat.codes
        else:
            df['MaterialType_cat'] = 0

        # Calculate LCA outputs
        lca_outputs = df.apply(lambda r: calculate_lca_row(r), axis=1)
        lca_df = pd.DataFrame(list(lca_outputs))
        df = pd.concat([df.reset_index(drop=True), lca_df.reset_index(drop=True)], axis=1)

        # Prepare ML features and target
        target = 'carbonEmissions'
        features = ['ElectricityConsumption_kWh', 'FuelEnergy_MJ', 'TransportDistance_km',
                   'transport_impact_est', 'circularity_simple', 'MaterialType_cat']

        X = df[features].values
        y = df[target].values

        # Train model if we have enough data
        model_metrics = {}
        if len(df) >= 10:  # Minimum data for training
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
            rf = RandomForestRegressor(n_estimators=100, random_state=42)
            rf.fit(X_train, y_train)
            
            y_pred = rf.predict(X_test)
            model_metrics = {
                "rmse": float(np.sqrt(mean_squared_error(y_test, y_pred))),
                "r2_score": float(r2_score(y_test, y_pred)),
                "training_samples": len(X_train),
                "test_samples": len(X_test)
            }
            
            # Make predictions on full dataset
            df['predicted_carbon'] = rf.predict(X)
        else:
            df['predicted_carbon'] = df['carbonEmissions']

        # Calculate concentrate mass
        if 'feed_mass' not in df.columns:
            df['feed_mass'] = 1000.0
        if 'grade_pct' not in df.columns:
            df['grade_pct'] = 2.0
            
        df['recovery_frac'] = (df['predicted_carbon'] / (df['predicted_carbon'].max() + 1)) * 0.8
        concentrate_results = df.apply(
            lambda r: two_product_concentrate_mass(r['feed_mass'], r['grade_pct'], r['recovery_frac'], 20.0), axis=1)
        df['conc_mass'], df['recovered_mass'] = zip(*concentrate_results)

        # Generate summary statistics
        summary_stats = {
            "total_rows": len(df),
            "avg_carbon_emissions": float(df['carbonEmissions'].mean()),
            "avg_energy_consumed": float(df['energyConsumed'].mean()),
            "avg_water_use": float(df['waterUse'].mean()),
            "avg_circularity": float(df['circularityPercent'].mean()),
            "total_concentrate_mass": float(df['conc_mass'].sum()),
            "total_recovered_mass": float(df['recovered_mass'].sum())
        }

        # Generate recommendations
        all_recs = sum(df['recommendations'].tolist(), [])
        rec_counts = Counter(all_recs)
        top_recommendations = [{"recommendation": rec, "frequency": count} 
                             for rec, count in rec_counts.most_common(5)]

        # Material distribution
        material_dist = {}
        if 'MaterialType' in df.columns:
            material_dist = df['MaterialType'].value_counts().to_dict()

        return {
            "success": True,
            "model_metrics": model_metrics,
            "summary_stats": summary_stats,
            "top_recommendations": top_recommendations,
            "material_distribution": material_dist,
            "detailed_results": df.to_dict('records')[:100],  # Limit to first 100 for response size
            "charts_data": {
                "carbon_vs_energy": df[['predicted_carbon', 'energyConsumed']].to_dict('records'),
                "circularity_distribution": df['circularityPercent'].tolist(),
                "end_of_life": {
                    "recycle": float(df['RecyclePercent'].mean()),
                    "reuse": float(df['ReusePercent'].mean()),
                    "landfill": float(df['LandfillPercent'].mean())
                }
            }
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to process CSV data"
        }

if __name__ == "__main__":
    if len(sys.argv) > 1:
        input_data = json.loads(sys.argv[1])
        result = process_csv_data(input_data)
        print(json.dumps(result))
    else:
        print(json.dumps({"success": False, "error": "No input data provided"}))