import json
import sys
import numpy as np

def predict_lca(input_data):
    """Predict LCA results from input data"""
    
    # Material factors
    material_factors = {
        'Bauxite': {'carbon': 1.2, 'energy': 1.1, 'water': 1.3},
        'Copper': {'carbon': 1.5, 'energy': 1.2, 'water': 1.4},
        'Gold': {'carbon': 2.8, 'energy': 2.0, 'water': 2.5},
        'Iron Ore': {'carbon': 1.0, 'energy': 1.0, 'water': 1.0},
        'Zinc': {'carbon': 1.3, 'energy': 1.1, 'water': 1.2},
        'Silver': {'carbon': 2.2, 'energy': 1.8, 'water': 2.0},
        'Nickel': {'carbon': 1.8, 'energy': 1.5, 'water': 1.6},
        'Platinum': {'carbon': 3.0, 'energy': 2.5, 'water': 2.8}
    }
    
    # Fuel factors
    fuel_factors = {
        'Natural Gas': 0.18,
        'Coal': 0.34,
        'Diesel': 0.27,
        'Petrol': 0.25,
        'Biomass': 0.05,
        'LPG': 0.21
    }
    
    # Transport factors
    transport_factors = {
        'Truck': 0.12,
        'Ship': 0.015,
        'Rail': 0.03,
        'Air': 0.8
    }
    
    # Get factors
    material = input_data.get('materialType', 'Iron Ore')
    mat_factor = material_factors.get(material, material_factors['Iron Ore'])
    fuel_factor = fuel_factors.get(input_data.get('fuelType', 'Natural Gas'), 0.2)
    transport_factor = transport_factors.get(input_data.get('transportMode', 'Truck'), 0.12)
    
    # Extract values
    electricity = float(input_data.get('electricityKwh', 0))
    fuel_energy = float(input_data.get('fuelMj', 0))
    transport_distance = float(input_data.get('transportDistance', 0))
    recycle_percent = float(input_data.get('recyclePercent', 0))
    reuse_percent = float(input_data.get('reusePercent', 0))
    
    # Calculate impacts
    carbon_from_elec = electricity * 0.5 * mat_factor['carbon']
    carbon_from_fuel = fuel_energy * fuel_factor * mat_factor['carbon']
    carbon_from_transport = transport_distance * transport_factor * 10  # 10 tons assumed
    
    total_carbon = carbon_from_elec + carbon_from_fuel + carbon_from_transport
    
    # Apply recycling benefits
    recycling_benefit = (recycle_percent / 100) * 0.3
    total_carbon = total_carbon * (1 - recycling_benefit)
    
    # Energy calculation
    total_energy = (electricity * 3.6 + fuel_energy) * mat_factor['energy']
    total_energy = total_energy * (1 - recycling_benefit * 0.2)
    
    # Water calculation
    total_water = (electricity * 2.5 + fuel_energy * 0.1) * mat_factor['water']
    total_water = total_water * (1 - recycling_benefit * 0.4)
    
    # Circularity calculation
    circularity = min(100, recycle_percent * 0.7 + reuse_percent * 0.8)
    
    # Generate recommendations
    recommendations = []
    if recycle_percent < 50:
        recommendations.append("Increase recycled content to reduce environmental impact")
    if transport_distance > 500:
        recommendations.append("Consider rail or ship transport for long distances")
    if input_data.get('fuelType') == 'Coal':
        recommendations.append("Switch to cleaner fuels like natural gas or biomass")
    if electricity > 2000:
        recommendations.append("Implement energy efficiency measures or renewable energy")
    
    if not recommendations:
        recommendations.append("Consider circular economy principles to further reduce impact")
    
    return {
        'carbonEmissions': round(max(0, total_carbon)),
        'energyConsumed': round(max(0, total_energy)),
        'waterUse': round(max(0, total_water)),
        'circularityPercent': round(circularity),
        'recommendations': recommendations
    }

if __name__ == "__main__":
    try:
        # Read input from stdin
        input_data = json.loads(sys.stdin.read())
        result = predict_lca(input_data)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({'error': str(e)}), file=sys.stderr)
        sys.exit(1)