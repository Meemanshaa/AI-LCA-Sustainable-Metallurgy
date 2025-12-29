import json
import sys
import os
from smart_ai_assistant import SmartAIAssistant
from lca_pipeline import LCAPipeline

class MLService:
    """Main ML service that coordinates different AI functionalities"""
    
    def __init__(self):
        self.ai_assistant = SmartAIAssistant()
        self.lca_pipeline = LCAPipeline()
    
    def handle_request(self, request_type: str, input_data: dict) -> dict:
        """Handle different types of ML requests"""
        try:
            if request_type == 'smart_fill':
                return self.ai_assistant.process_smart_fill(input_data)
            elif request_type == 'lca_analysis':
                return self.lca_pipeline.run_full_lca(input_data)
            elif request_type == 'predict_missing':
                return self.predict_missing_values(input_data)
            elif request_type == 'optimize_parameters':
                return self.optimize_parameters(input_data)
            else:
                return {
                    'success': False,
                    'error': f'Unknown request type: {request_type}'
                }
        except Exception as e:
            return {
                'success': False,
                'error': f'ML service error: {str(e)}'
            }
    
    def predict_missing_values(self, input_data: dict) -> dict:
        """Predict missing values using ML algorithms"""
        try:
            # Use the smart fill functionality
            result = self.ai_assistant.process_smart_fill(input_data)
            
            if result['success']:
                # Add prediction confidence scores
                completed_data = result['data']['completedData']
                confidence_scores = {}
                
                for key, value in completed_data.items():
                    if not input_data.get(key) or input_data.get(key) == '':
                        # Calculate confidence based on material type and context
                        if key == 'electricityConsumption':
                            confidence_scores[key] = 0.85
                        elif key == 'fuelEnergy':
                            confidence_scores[key] = 0.80
                        elif key == 'transportDistance':
                            confidence_scores[key] = 0.75
                        else:
                            confidence_scores[key] = 0.70
                
                result['data']['confidence_scores'] = confidence_scores
            
            return result
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Prediction failed: {str(e)}'
            }
    
    def optimize_parameters(self, input_data: dict) -> dict:
        """Optimize parameters for minimum environmental impact"""
        try:
            current_impact = self.lca_pipeline.run_full_lca(input_data)
            
            if not current_impact['success']:
                return current_impact
            
            current_co2 = current_impact['results']['total_co2_emissions']
            
            # Generate optimization suggestions
            optimizations = []
            
            # Fuel optimization
            fuel_options = ['Natural Gas', 'Biomass', 'LPG']
            for fuel in fuel_options:
                if fuel != input_data.get('fuelType'):
                    test_data = input_data.copy()
                    test_data['fuelType'] = fuel
                    test_impact = self.lca_pipeline.run_full_lca(test_data)
                    
                    if test_impact['success']:
                        test_co2 = test_impact['results']['total_co2_emissions']
                        if test_co2 < current_co2:
                            reduction = ((current_co2 - test_co2) / current_co2) * 100
                            optimizations.append({
                                'parameter': 'fuelType',
                                'current_value': input_data.get('fuelType', 'Unknown'),
                                'optimized_value': fuel,
                                'co2_reduction': round(reduction, 1),
                                'new_co2': round(test_co2, 2)
                            })
            
            # Transport optimization
            transport_options = ['Rail', 'Ship', 'Truck']
            distance = float(input_data.get('transportDistance', 0))
            
            for transport in transport_options:
                if transport != input_data.get('transportMode') and distance > 0:
                    test_data = input_data.copy()
                    test_data['transportMode'] = transport
                    test_impact = self.lca_pipeline.run_full_lca(test_data)
                    
                    if test_impact['success']:
                        test_co2 = test_impact['results']['total_co2_emissions']
                        if test_co2 < current_co2:
                            reduction = ((current_co2 - test_co2) / current_co2) * 100
                            optimizations.append({
                                'parameter': 'transportMode',
                                'current_value': input_data.get('transportMode', 'Unknown'),
                                'optimized_value': transport,
                                'co2_reduction': round(reduction, 1),
                                'new_co2': round(test_co2, 2)
                            })
            
            # Sort optimizations by CO2 reduction
            optimizations.sort(key=lambda x: x['co2_reduction'], reverse=True)
            
            return {
                'success': True,
                'data': {
                    'current_co2_emissions': round(current_co2, 2),
                    'optimizations': optimizations[:5],  # Top 5 optimizations
                    'total_potential_reduction': sum([opt['co2_reduction'] for opt in optimizations[:3]]) if optimizations else 0
                }
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Optimization failed: {str(e)}'
            }

def main():
    """Main function for command line usage"""
    if len(sys.argv) < 3:
        print(json.dumps({
            'success': False, 
            'error': 'Usage: python ml_service.py <request_type> <input_data_json>'
        }))
        return
    
    try:
        request_type = sys.argv[1]
        input_data = json.loads(sys.argv[2])
        
        ml_service = MLService()
        result = ml_service.handle_request(request_type, input_data)
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({
            'success': False,
            'error': f'Service error: {str(e)}'
        }))

if __name__ == "__main__":
    main()