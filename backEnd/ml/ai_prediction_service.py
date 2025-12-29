import json
import sys
import numpy as np

def predict_missing_data(input_data):
    """Predict missing LCA data fields"""
    
    # Material defaults
    material_defaults = {
        'Copper': {'electricity': 1800, 'fuel': 2500},
        'Aluminium': {'electricity': 2200, 'fuel': 1800},
        'Steel': {'electricity': 1500, 'fuel': 2000}
    }
    
    material = input_data.get('materialType', 'Copper')
    defaults = material_defaults.get(material, material_defaults['Copper'])
    
    # Fill missing values
    result = input_data.copy()
    
    if not result.get('electricityConsumption'):
        result['electricityConsumption'] = str(defaults['electricity'] + np.random.randint(-200, 200))
    
    if not result.get('fuelEnergy'):
        result['fuelEnergy'] = str(defaults['fuel'] + np.random.randint(-300, 300))
    
    if not result.get('transportDistance'):
        result['transportDistance'] = str(np.random.randint(150, 450))
    
    if not result.get('fuelType'):
        result['fuelType'] = 'Natural Gas' if defaults['fuel'] > 2500 else 'Biomass'
    
    if not result.get('transportMode'):
        distance = int(result['transportDistance'])
        result['transportMode'] = 'Rail' if distance > 300 else 'Truck'
    
    if not result.get('landfillLocation'):
        result['landfillLocation'] = np.random.choice(['Ghazipur Delhi', 'Deonar Mumbai', 'Kodungaiyur Chennai'])
    
    return result

def calculate_impact(data):
    """Calculate environmental impact"""
    electricity = float(data.get('electricityConsumption', 0))
    fuel = float(data.get('fuelEnergy', 0))
    distance = float(data.get('transportDistance', 0))
    
    co2 = round(electricity * 0.5 + fuel * 0.2 + distance * 1.2)
    energy = round(electricity * 3.6 + fuel)
    score = max(10, min(100, 90 - (co2 / max(energy, 1)) * 20))
    
    return {
        'co2Emissions': co2,
        'totalEnergy': energy,
        'fuelEfficiencyScore': round(score)
    }

if __name__ == "__main__":
    input_data = json.loads(sys.argv[1])
    completed = predict_missing_data(input_data)
    impact = calculate_impact(completed)
    
    missing_fields = [k for k in completed.keys() if not input_data.get(k)]
    
    result = {
        'success': True,
        'data': {
            'completedData': completed,
            'environmentalImpact': impact,
            'missingFieldsDetected': missing_fields,
            'explanation': [
                f"Electricity: {completed['electricityConsumption']} kWh",
                f"Fuel: {completed['fuelEnergy']} MJ",
                f"Transport: {completed['transportDistance']}km via {completed['transportMode']}",
                f"Total CO2: {impact['co2Emissions']} kg"
            ],
            'recommendations': [
                'Use renewable energy to reduce emissions',
                'Optimize transport routes',
                'Consider cleaner fuel alternatives'
            ]
        }
    }
    
    print(json.dumps(result))