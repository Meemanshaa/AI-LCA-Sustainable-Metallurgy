import json
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Tuple

class LCAPipeline:
    """Life Cycle Assessment Pipeline for environmental impact calculations"""
    
    def __init__(self):
        # Emission factors (kg CO2 equivalent per unit)
        self.emission_factors = {
            'electricity': 0.5,  # kg CO2 per kWh
            'natural_gas': 0.18,  # kg CO2 per MJ
            'coal': 0.34,  # kg CO2 per MJ
            'diesel': 0.27,  # kg CO2 per MJ
            'petrol': 0.25,  # kg CO2 per MJ
            'biomass': 0.05,  # kg CO2 per MJ
            'lpg': 0.21,  # kg CO2 per MJ
        }
        
        # Transport emission factors (kg CO2 per ton-km)
        self.transport_emissions = {
            'truck': 0.12,
            'ship': 0.015,
            'rail': 0.03,
            'air': 0.8
        }
        
        # Material processing factors
        self.material_factors = {
            'bauxite': {'energy_intensity': 15.0, 'water_use': 2.5, 'waste_factor': 0.3},
            'copper': {'energy_intensity': 18.5, 'water_use': 3.2, 'waste_factor': 0.4},
            'gold': {'energy_intensity': 45.0, 'water_use': 8.0, 'waste_factor': 0.8},
            'iron_ore': {'energy_intensity': 12.0, 'water_use': 2.0, 'waste_factor': 0.25},
            'zinc': {'energy_intensity': 14.5, 'water_use': 2.8, 'waste_factor': 0.35},
            'silver': {'energy_intensity': 35.0, 'water_use': 6.5, 'waste_factor': 0.6},
            'nickel': {'energy_intensity': 22.0, 'water_use': 4.0, 'waste_factor': 0.45},
            'platinum': {'energy_intensity': 50.0, 'water_use': 9.0, 'waste_factor': 0.9}
        }

    def calculate_extraction_impact(self, material_type: str, quantity: float = 1.0) -> Dict[str, float]:
        """Calculate environmental impact of material extraction"""
        material_key = material_type.lower().replace(' ', '_')
        factors = self.material_factors.get(material_key, self.material_factors['iron_ore'])
        
        return {
            'energy_consumption': factors['energy_intensity'] * quantity,
            'water_consumption': factors['water_use'] * quantity,
            'waste_generation': factors['waste_factor'] * quantity,
            'co2_emissions': factors['energy_intensity'] * quantity * 0.3  # Rough conversion
        }

    def calculate_processing_impact(self, electricity_kwh: float, fuel_type: str, fuel_mj: float) -> Dict[str, float]:
        """Calculate environmental impact of material processing"""
        # Electricity impact
        electricity_co2 = electricity_kwh * self.emission_factors['electricity']
        
        # Fuel impact
        fuel_key = fuel_type.lower().replace(' ', '_')
        fuel_emission_factor = self.emission_factors.get(fuel_key, 0.2)
        fuel_co2 = fuel_mj * fuel_emission_factor
        
        return {
            'electricity_co2': electricity_co2,
            'fuel_co2': fuel_co2,
            'total_processing_co2': electricity_co2 + fuel_co2,
            'energy_consumption': electricity_kwh * 3.6 + fuel_mj  # Convert kWh to MJ
        }

    def calculate_transport_impact(self, transport_mode: str, distance_km: float, weight_tons: float = 10.0) -> Dict[str, float]:
        """Calculate environmental impact of transportation"""
        mode_key = transport_mode.lower()
        emission_factor = self.transport_emissions.get(mode_key, 0.1)
        
        transport_co2 = distance_km * weight_tons * emission_factor
        
        return {
            'transport_co2': transport_co2,
            'fuel_consumption': transport_co2 / 2.3,  # Rough conversion to liters
            'distance': distance_km,
            'weight': weight_tons
        }

    def calculate_end_of_life_impact(self, landfill_location: str, material_type: str) -> Dict[str, float]:
        """Calculate end-of-life environmental impact"""
        # Landfill-specific factors
        landfill_factors = {
            'ghazipur_delhi': {'methane_factor': 1.2, 'leachate_factor': 1.1},
            'deonar_mumbai': {'methane_factor': 1.0, 'leachate_factor': 1.0},
            'kodungaiyur_chennai': {'methane_factor': 0.9, 'leachate_factor': 0.95}
        }
        
        landfill_key = landfill_location.lower().replace(' ', '_')
        factors = landfill_factors.get(landfill_key, landfill_factors['deonar_mumbai'])
        
        # Material-specific end-of-life impact
        material_key = material_type.lower().replace(' ', '_')
        base_impact = self.material_factors.get(material_key, self.material_factors['iron_ore'])
        
        return {
            'methane_emissions': base_impact['waste_factor'] * factors['methane_factor'] * 25,  # CH4 to CO2 equivalent
            'leachate_impact': base_impact['waste_factor'] * factors['leachate_factor'],
            'total_eol_co2': base_impact['waste_factor'] * factors['methane_factor'] * 25 * 0.1
        }

    def calculate_circularity_score(self, recycle_percent: float = 0, reuse_percent: float = 0) -> Dict[str, float]:
        """Calculate circularity metrics"""
        circularity_score = min(100, (recycle_percent * 0.7 + reuse_percent * 0.8))
        
        # Circularity benefits (CO2 reduction)
        co2_reduction = circularity_score * 0.05  # 5% reduction per circularity point
        
        return {
            'circularity_score': circularity_score,
            'co2_reduction': co2_reduction,
            'resource_efficiency': circularity_score * 0.8
        }

    def run_full_lca(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Run complete LCA analysis"""
        try:
            # Extract input parameters
            material_type = input_data.get('materialType', 'Iron Ore')
            electricity_kwh = float(input_data.get('electricityConsumption', 0))
            fuel_type = input_data.get('fuelType', 'Natural Gas')
            fuel_mj = float(input_data.get('fuelEnergy', 0))
            transport_mode = input_data.get('transportMode', 'Truck')
            distance_km = float(input_data.get('transportDistance', 0))
            landfill_location = input_data.get('landfillLocation', 'Deonar Mumbai')
            recycle_percent = float(input_data.get('recyclePercent', 0))
            reuse_percent = float(input_data.get('reusePercent', 0))
            
            # Calculate each phase impact
            extraction_impact = self.calculate_extraction_impact(material_type)
            processing_impact = self.calculate_processing_impact(electricity_kwh, fuel_type, fuel_mj)
            transport_impact = self.calculate_transport_impact(transport_mode, distance_km)
            eol_impact = self.calculate_end_of_life_impact(landfill_location, material_type)
            circularity = self.calculate_circularity_score(recycle_percent, reuse_percent)
            
            # Calculate total impacts
            total_co2 = (
                extraction_impact['co2_emissions'] +
                processing_impact['total_processing_co2'] +
                transport_impact['transport_co2'] +
                eol_impact['total_eol_co2'] -
                circularity['co2_reduction']
            )
            
            total_energy = (
                extraction_impact['energy_consumption'] +
                processing_impact['energy_consumption']
            )
            
            total_water = extraction_impact['water_consumption']
            
            # Calculate efficiency scores
            efficiency_score = max(10, min(100, 100 - (total_co2 / max(total_energy, 1)) * 20))
            
            # Generate phase breakdown
            phase_breakdown = {
                'extraction': {
                    'co2': round(extraction_impact['co2_emissions'], 2),
                    'percentage': round((extraction_impact['co2_emissions'] / max(total_co2, 1)) * 100, 1)
                },
                'processing': {
                    'co2': round(processing_impact['total_processing_co2'], 2),
                    'percentage': round((processing_impact['total_processing_co2'] / max(total_co2, 1)) * 100, 1)
                },
                'transport': {
                    'co2': round(transport_impact['transport_co2'], 2),
                    'percentage': round((transport_impact['transport_co2'] / max(total_co2, 1)) * 100, 1)
                },
                'end_of_life': {
                    'co2': round(eol_impact['total_eol_co2'], 2),
                    'percentage': round((eol_impact['total_eol_co2'] / max(total_co2, 1)) * 100, 1)
                }
            }
            
            return {
                'success': True,
                'results': {
                    'total_co2_emissions': round(total_co2, 2),
                    'total_energy_consumption': round(total_energy, 2),
                    'total_water_consumption': round(total_water, 2),
                    'efficiency_score': round(efficiency_score, 1),
                    'circularity_score': round(circularity['circularity_score'], 1),
                    'phase_breakdown': phase_breakdown,
                    'detailed_impacts': {
                        'extraction': extraction_impact,
                        'processing': processing_impact,
                        'transport': transport_impact,
                        'end_of_life': eol_impact,
                        'circularity': circularity
                    }
                }
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'LCA calculation failed: {str(e)}'
            }

def main():
    """Main function for command line usage"""
    if len(sys.argv) != 2:
        print(json.dumps({'success': False, 'error': 'Invalid input'}))
        return
    
    try:
        input_data = json.loads(sys.argv[1])
        lca_pipeline = LCAPipeline()
        result = lca_pipeline.run_full_lca(input_data)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({'success': False, 'error': str(e)}))

if __name__ == "__main__":
    import sys
    main()