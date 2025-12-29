#!/usr/bin/env python3
"""Test script for ML services"""

import json
from smart_ai_assistant import SmartAIAssistant
from lca_pipeline import LCAPipeline
from ml_service import MLService

def test_smart_fill():
    """Test smart fill functionality"""
    print("Testing Smart Fill...")
    
    test_data = {
        'materialType': 'Copper',
        'fuelType': '',
        'electricityConsumption': '',
        'fuelEnergy': '2000',
        'transportDistance': '',
        'transportMode': 'Truck',
        'landfillLocation': ''
    }
    
    ai_assistant = SmartAIAssistant()
    result = ai_assistant.process_smart_fill(test_data)
    
    print("Smart Fill Result:")
    print(json.dumps(result, indent=2))
    return result['success']

def test_lca_pipeline():
    """Test LCA pipeline"""
    print("\nTesting LCA Pipeline...")
    
    test_data = {
        'materialType': 'Iron Ore',
        'electricityConsumption': '1200',
        'fuelType': 'Natural Gas',
        'fuelEnergy': '1800',
        'transportMode': 'Truck',
        'transportDistance': '250',
        'landfillLocation': 'Ghazipur Delhi',
        'recyclePercent': '20',
        'reusePercent': '10'
    }
    
    lca_pipeline = LCAPipeline()
    result = lca_pipeline.run_full_lca(test_data)
    
    print("LCA Pipeline Result:")
    print(json.dumps(result, indent=2))
    return result['success']

def test_ml_service():
    """Test ML service coordinator"""
    print("\nTesting ML Service...")
    
    test_data = {
        'materialType': 'Gold',
        'electricityConsumption': '',
        'fuelType': 'Coal',
        'fuelEnergy': '',
        'transportMode': '',
        'transportDistance': '500',
        'landfillLocation': ''
    }
    
    ml_service = MLService()
    result = ml_service.handle_request('smart_fill', test_data)
    
    print("ML Service Result:")
    print(json.dumps(result, indent=2))
    return result['success']

def main():
    """Run all tests"""
    print("=== ML Service Test Suite ===\n")
    
    tests = [
        ("Smart Fill", test_smart_fill),
        ("LCA Pipeline", test_lca_pipeline),
        ("ML Service", test_ml_service)
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            success = test_func()
            results.append((test_name, success))
            print(f"✅ {test_name}: {'PASSED' if success else 'FAILED'}")
        except Exception as e:
            results.append((test_name, False))
            print(f"❌ {test_name}: ERROR - {str(e)}")
        print("-" * 50)
    
    # Summary
    print("\n=== Test Summary ===")
    passed = sum(1 for _, success in results if success)
    total = len(results)
    print(f"Tests passed: {passed}/{total}")
    
    if passed == total:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed!")
        return 1

if __name__ == "__main__":
    exit(main())