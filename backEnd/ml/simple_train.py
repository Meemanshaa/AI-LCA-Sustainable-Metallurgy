import json
import numpy as np
from sklearn.ensemble import RandomForestRegressor
import joblib

# Generate training data
def generate_training_data():
    materials = ['Bauxite', 'Copper', 'Gold', 'Iron Ore', 'Zinc', 'Silver', 'Nickel', 'Platinum']
    fuels = ['Natural Gas', 'Coal', 'Diesel', 'Biomass']
    transports = ['Truck', 'Rail', 'Ship']
    
    data = []
    for _ in range(1000):
        material = np.random.choice(materials)
        fuel = np.random.choice(fuels)
        transport = np.random.choice(transports)
        
        # Material encoding
        material_idx = materials.index(material)
        fuel_idx = fuels.index(fuel)
        transport_idx = transports.index(transport)
        
        electricity = np.random.randint(800, 3500)
        fuel_energy = np.random.randint(1000, 4500)
        distance = np.random.randint(50, 1000)
        
        # Calculate CO2 (target)
        co2 = electricity * 0.5 + fuel_energy * 0.2 + distance * 1.2
        
        data.append([material_idx, fuel_idx, transport_idx, electricity, fuel_energy, distance, co2])
    
    return np.array(data)

# Train model
data = generate_training_data()
X = data[:, :-1]  # Features
y = data[:, -1]   # Target (CO2)

model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X, y)

# Save model
joblib.dump(model, 'lca_model.joblib')
print("Model trained and saved as lca_model.joblib")