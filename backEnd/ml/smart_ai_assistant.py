import json
import sys
import numpy as np
from typing import Dict, List, Any

class SmartAIAssistant:
    def __init__(self):
        # Material-specific data patterns
        self.material_data = {
            'Bauxite': {'avg_electricity': 1500, 'avg_fuel': 2200, 'density': 2.7, 'co2_factor': 1.2},
            'Copper': {'avg_electricity': 1800, 'avg_fuel': 2500, 'density': 8.9, 'co2_factor': 1.5},
            'Gold': {'avg_electricity': 3000, 'avg_fuel': 4000, 'density': 19.3, 'co2_factor': 2.8},
            'Iron Ore': {'avg_electricity': 1200, 'avg_fuel': 1800, 'density': 5.2, 'co2_factor': 1.0},
            'Zinc': {'avg_electricity': 1400, 'avg_fuel': 2000, 'density': 7.1, 'co2_factor': 1.3},
            'Silver': {'avg_electricity': 2500, 'avg_fuel': 3500, 'density': 10.5, 'co2_factor': 2.2},
            'Nickel': {'avg_electricity': 2000, 'avg_fuel': 2800, 'density': 8.9, 'co2_factor': 1.8},
            'Platinum': {'avg_electricity': 3500, 'avg_fuel': 4500, 'density': 21.5, 'co2_factor': 3.0}
        }
        
        # Fuel efficiency factors
        self.fuel_data = {
            'Natural Gas': {'efficiency': 0.85, 'co2_factor': 0.18, 'cost': 1.0},
            'Coal': {'efficiency': 0.65, 'co2_factor': 0.34, 'cost': 0.7},
            'Diesel': {'efficiency': 0.75, 'co2_factor': 0.27, 'cost': 1.3},
            'Petrol': {'efficiency': 0.70, 'co2_factor': 0.25, 'cost': 1.4},
            'Biomass': {'efficiency': 0.60, 'co2_factor': 0.05, 'cost': 0.9},
            'LPG': {'efficiency': 0.80, 'co2_factor': 0.21, 'cost': 1.1}
        }
        
        # Transport emission factors
        self.transport_data = {
            'Truck': {'emission_factor': 0.12, 'cost_factor': 1.0, 'max_distance': 1000},
            'Ship': {'emission_factor': 0.015, 'cost_factor': 0.3, 'max_distance': 10000},
            'Rail': {'emission_factor': 0.03, 'cost_factor': 0.5, 'max_distance': 5000},
            'Air': {'emission_factor': 0.8, 'cost_factor': 3.0, 'max_distance': 15000}
        }

    def smart_fill_data(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Smart fill missing data based on material type and context"""
        material = input_data.get('materialType', 'Iron Ore')
        material_info = self.material_data.get(material, self.material_data['Iron Ore'])
        
        # Fill missing electricity consumption
        electricity = input_data.get('electricityConsumption')
        if not electricity or electricity == '':
            electricity = material_info['avg_electricity'] + np.random.randint(-200, 200)
            electricity = max(500, electricity)  # Minimum 500 kWh
        
        # Fill missing fuel energy
        fuel_energy = input_data.get('fuelEnergy')
        if not fuel_energy or fuel_energy == '':
            fuel_energy = material_info['avg_fuel'] + np.random.randint(-300, 300)
            fuel_energy = max(800, fuel_energy)  # Minimum 800 MJ
        
        # Fill missing transport distance
        transport_distance = input_data.get('transportDistance')
        if not transport_distance or transport_distance == '':
            transport_distance = np.random.randint(150, 450)  # 150-450 km range
        
        # Smart fuel type selection
        fuel_type = input_data.get('fuelType')
        if not fuel_type or fuel_type == '':
            if material_info['avg_fuel'] > 3000:
                fuel_type = 'Natural Gas'  # High energy materials
            elif material_info['avg_fuel'] > 2000:
                fuel_type = np.random.choice(['Natural Gas', 'Diesel'], p=[0.7, 0.3])
            else:
                fuel_type = np.random.choice(['Natural Gas', 'Biomass'], p=[0.6, 0.4])
        
        # Smart transport mode selection
        transport_mode = input_data.get('transportMode')
        if not transport_mode or transport_mode == '':
            distance = float(transport_distance)
            if distance < 200:
                transport_mode = 'Truck'
            elif distance < 800:
                transport_mode = np.random.choice(['Rail', 'Truck'], p=[0.6, 0.4])
            else:
                if material in ['Bauxite', 'Iron Ore']:
                    transport_mode = 'Ship'
                else:
                    transport_mode = 'Rail'
        
        # Default landfill if missing
        landfill_location = input_data.get('landfillLocation')
        if not landfill_location or landfill_location == '':
            landfills = ['Ghazipur Delhi', 'Deonar Mumbai', 'Kodungaiyur Chennai']
            landfill_location = np.random.choice(landfills)
        
        return {
            'materialType': material,
            'fuelType': fuel_type,
            'electricityConsumption': str(electricity),
            'fuelEnergy': str(fuel_energy),
            'transportDistance': str(transport_distance),
            'transportMode': transport_mode,
            'landfillLocation': landfill_location
        }

    def calculate_environmental_impact(self, data: Dict[str, Any]) -> Dict[str, float]:
        """Calculate environmental impact metrics"""
        material = data.get('materialType', 'Iron Ore')
        material_info = self.material_data.get(material, self.material_data['Iron Ore'])
        fuel_info = self.fuel_data.get(data.get('fuelType', 'Natural Gas'), self.fuel_data['Natural Gas'])
        transport_info = self.transport_data.get(data.get('transportMode', 'Truck'), self.transport_data['Truck'])
        
        electricity = float(data.get('electricityConsumption', 0))
        fuel_energy = float(data.get('fuelEnergy', 0))
        distance = float(data.get('transportDistance', 0))
        
        # CO2 calculations
        electricity_co2 = electricity * 0.5  # kg CO2 per kWh
        fuel_co2 = fuel_energy * fuel_info['co2_factor']
        transport_co2 = distance * transport_info['emission_factor'] * 10  # assuming 10 tons
        material_co2 = (electricity + fuel_energy) * material_info['co2_factor'] * 0.1
        
        total_co2 = round(electricity_co2 + fuel_co2 + transport_co2 + material_co2)
        
        # Total energy calculation
        total_energy = round(electricity * 3.6 + fuel_energy)  # Convert kWh to MJ
        
        # Fuel efficiency score (0-100)
        base_efficiency = fuel_info['efficiency'] * 100
        distance_penalty = min(20, distance / 50)  # Penalty for long distances
        material_bonus = 10 if material_info['co2_factor'] < 1.5 else 0
        fuel_efficiency_score = round(max(10, min(100, base_efficiency - distance_penalty + material_bonus)))
        
        return {
            'co2Emissions': total_co2,
            'totalEnergy': total_energy,
            'fuelEfficiencyScore': fuel_efficiency_score
        }

    def generate_explanations(self, data: Dict[str, Any], impact: Dict[str, float]) -> List[str]:
        """Generate explanations for the calculations"""
        explanations = [
            f"Material processing for {data['materialType']} requires {data['electricityConsumption']} kWh electricity, generating {round(float(data['electricityConsumption']) * 0.5)} kg CO2",
            f"{data['fuelType']} fuel provides {data['fuelEnergy']} MJ energy with {self.fuel_data.get(data['fuelType'], {}).get('efficiency', 0.75)} efficiency rating",
            f"Transport via {data['transportMode']} over {data['transportDistance']}km generates approximately {round(float(data['transportDistance']) * self.transport_data.get(data['transportMode'], {}).get('emission_factor', 0.1) * 10)} kg CO2",
            f"Total environmental impact: {impact['co2Emissions']} kg CO2 emissions with {impact['fuelEfficiencyScore']}/100 efficiency score"
        ]
        return explanations

    def generate_recommendations(self, data: Dict[str, Any], impact: Dict[str, float]) -> List[str]:
        """Generate sustainability recommendations"""
        recommendations = []
        material = data['materialType']
        fuel = data['fuelType']
        transport = data['transportMode']
        distance = float(data['transportDistance'])
        electricity = float(data['electricityConsumption'])
        
        # Electricity recommendations
        if electricity > 2000:
            recommendations.append('Consider renewable energy sources or energy-efficient equipment to reduce high electricity consumption')
        elif electricity > 1500:
            recommendations.append('Implement energy management systems to optimize electricity usage')
        
        # Fuel recommendations
        if fuel == 'Coal':
            recommendations.append('Switch from coal to natural gas or biomass to reduce CO2 emissions by 40-80%')
        elif fuel in ['Diesel', 'Petrol']:
            recommendations.append('Consider cleaner fuel alternatives like natural gas or biomass for lower emissions')
        
        # Transport recommendations
        if distance > 500 and transport == 'Truck':
            recommendations.append('For distances over 500km, rail transport can reduce emissions by 60% compared to trucks')
        elif distance > 1000 and material in ['Bauxite', 'Iron Ore']:
            recommendations.append('For bulk materials over long distances, ship transport offers the lowest emissions per ton-km')
        
        # Material-specific recommendations
        if material in ['Gold', 'Platinum', 'Silver']:
            recommendations.append('High-value materials justify investment in advanced recycling and circular economy practices')
        
        # Efficiency score recommendations
        if impact['fuelEfficiencyScore'] < 50:
            recommendations.append('Low efficiency score indicates potential for significant improvements in fuel and energy management')
        
        # Default recommendations if none generated
        if not recommendations:
            recommendations.extend([
                'Implement circular economy practices to reduce waste generation',
                'Consider carbon offset programs for remaining emissions'
            ])
        
        return recommendations

    def process_smart_fill(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Main smart fill processing function"""
        try:
            # Complete missing data
            completed_data = self.smart_fill_data(input_data)
            
            # Calculate environmental impact
            environmental_impact = self.calculate_environmental_impact(completed_data)
            
            # Generate explanations and recommendations
            explanations = self.generate_explanations(completed_data, environmental_impact)
            recommendations = self.generate_recommendations(completed_data, environmental_impact)
            
            # Detect which fields were missing
            missing_fields = []
            for key in completed_data.keys():
                if not input_data.get(key) or input_data.get(key) == '':
                    # Convert camelCase to readable format
                    readable_key = ''.join([' ' + c.lower() if c.isupper() else c for c in key]).strip()
                    missing_fields.append(readable_key)
            
            return {
                'success': True,
                'data': {
                    'completedData': completed_data,
                    'explanation': explanations,
                    'recommendations': recommendations,
                    'environmentalImpact': environmental_impact,
                    'missingFieldsDetected': missing_fields
                }
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'AI processing failed: {str(e)}'
            }

def main():
    """Main function to handle command line input"""
    if len(sys.argv) != 2:
        print(json.dumps({'success': False, 'error': 'Invalid input'}))
        return
    
    try:
        input_data = json.loads(sys.argv[1])
        ai_assistant = SmartAIAssistant()
        result = ai_assistant.process_smart_fill(input_data)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({'success': False, 'error': str(e)}))

if __name__ == "__main__":
    main()