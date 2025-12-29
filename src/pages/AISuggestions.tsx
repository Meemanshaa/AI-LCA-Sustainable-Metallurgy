import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Zap, Leaf, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react';

interface OptimalChoice {
  type: string;
  current: string;
  recommended: string;
  reason: string;
  savings: string;
  environmental: string;
}

interface AIResponse {
  completedData: any;
  explanation: string[];
  recommendations: string[];
  environmentalImpact: {
    co2Emissions: number;
    totalEnergy: number;
    fuelEfficiencyScore: number;
  };
  missingFieldsDetected: string[];
  optimalChoices?: OptimalChoice[];
}

const AISuggestions = () => {
  const [formData, setFormData] = useState({
    materialType: '',
    fuelType: '',
    electricityConsumption: '',
    fuelEnergy: '',
    transportDistance: '',
    transportMode: '',
    landfillLocation: ''
  });
  
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const materials = ['Copper', 'Aluminium', 'Steel'];
  const fuels = ['Natural Gas', 'Coal', 'Diesel', 'Petrol', 'Biomass', 'LPG'];
  const transports = ['Truck', 'Ship', 'Rail', 'Air'];
  const landfills = ['Ghazipur Delhi', 'Deonar Mumbai', 'Kodungaiyur Chennai'];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getOptimalChoices = (material: string, landfill: string, distance: number) => {
    const recommendations = [];
    
    // Transport Mode Recommendations
    if (distance < 200) {
      recommendations.push({
        type: 'Transport',
        current: 'Any',
        recommended: 'Truck',
        reason: `For ${distance}km distance, trucks are most cost-effective and flexible`,
        savings: '15-25% cost reduction vs rail for short distances',
        environmental: 'Moderate emissions but optimal for short routes'
      });
    } else if (distance < 800) {
      recommendations.push({
        type: 'Transport',
        current: 'Truck',
        recommended: 'Rail',
        reason: `For ${distance}km, rail transport reduces emissions by 60% vs trucks`,
        savings: '30-40% lower transport costs',
        environmental: 'Significantly lower CO2 emissions per ton-km'
      });
    } else {
      const mode = ['Bauxite', 'Iron Ore'].includes(material) ? 'Ship' : 'Rail';
      recommendations.push({
        type: 'Transport',
        current: 'Other',
        recommended: mode,
        reason: `For ${distance}km with ${material}, ${mode.toLowerCase()} transport is most efficient`,
        savings: mode === 'Ship' ? '50-70% cost reduction' : '40-50% cost reduction',
        environmental: `${mode} has lowest emissions for long-distance bulk transport`
      });
    }
    
    // Fuel Type Recommendations based on material
    const fuelRecommendations = {
      'Copper': { fuel: 'Biomass', reason: 'Carbon neutral option, supports circular economy for copper processing' },
      'Aluminium': { fuel: 'Natural Gas', reason: 'High energy efficiency for aluminum smelting, 35% less emissions than coal' },
      'Steel': { fuel: 'Natural Gas', reason: 'Optimal for steel production, cleaner combustion and better temperature control' },
      'Bauxite': { fuel: 'Natural Gas', reason: 'Lower energy intensity, 40% less emissions than coal' },
      'Gold': { fuel: 'Natural Gas', reason: 'High energy needs require efficient clean fuel' },
      'Iron Ore': { fuel: 'Natural Gas', reason: 'Best cost-efficiency for large scale processing' },
      'Zinc': { fuel: 'Biomass', reason: 'Renewable option with lower processing temperatures' },
      'Silver': { fuel: 'Natural Gas', reason: 'Precise temperature control with lower emissions' },
      'Nickel': { fuel: 'Natural Gas', reason: 'Optimal for high-temperature smelting processes' },
      'Platinum': { fuel: 'Natural Gas', reason: 'Premium metal requires cleanest fuel option' }
    };
    
    if (material && fuelRecommendations[material]) {
      const fuelRec = fuelRecommendations[material];
      recommendations.push({
        type: 'Fuel',
        current: 'Current fuel',
        recommended: fuelRec.fuel,
        reason: fuelRec.reason,
        savings: fuelRec.fuel === 'Biomass' ? '20-30% cost savings long-term' : '25-35% emission reduction',
        environmental: fuelRec.fuel === 'Biomass' ? 'Carbon neutral, supports sustainability' : 'Lower CO2 emissions, cleaner combustion'
      });
    }
    
    // Landfill-specific recommendations
    const landfillOptimizations = {
      'Ghazipur Delhi': {
        suggestion: 'Use rail transport to Delhi, then local truck distribution',
        benefit: 'Reduces urban pollution, 35% cost savings on long routes'
      },
      'Deonar Mumbai': {
        suggestion: 'Ship transport via Mumbai port for coastal materials',
        benefit: 'Port proximity reduces final transport costs by 40%'
      },
      'Kodungaiyur Chennai': {
        suggestion: 'Rail network optimization via Chennai junction',
        benefit: 'Well-connected rail hub, 30% faster delivery times'
      }
    };
    
    if (landfill && landfillOptimizations[landfill]) {
      const opt = landfillOptimizations[landfill];
      recommendations.push({
        type: 'Logistics',
        current: 'Direct transport',
        recommended: opt.suggestion,
        reason: `${landfill} location offers strategic advantages`,
        savings: opt.benefit,
        environmental: 'Optimized routes reduce total transport emissions'
      });
    }
    
    return recommendations;
  };

  const getAISuggestions = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:5000/api/ai/smart-fill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) throw new Error('Failed to get AI suggestions');
      
      const result = await response.json();
      if (result.success) {
        // Add optimal choices to the response
        const distance = parseFloat(result.data.completedData.transportDistance) || 200;
        const optimalChoices = getOptimalChoices(
          formData.materialType || result.data.completedData.materialType,
          formData.landfillLocation || result.data.completedData.landfillLocation,
          distance
        );
        result.data.optimalChoices = optimalChoices;
        setAiResponse(result.data);
      } else {
        setError(result.error || 'Failed to process request');
      }
    } catch (err) {
      setError('AI service unavailable. Please ensure the backend server is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  const getImpactColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">AI Environmental Assistant</h1>
        <p className="text-lg text-gray-600">Get intelligent suggestions for your LCA data and sustainability improvements</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              LCA Data Input
            </CardTitle>
            <CardDescription>
              Fill in any available data. AI will complete missing fields and provide recommendations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="material">Material Type</Label>
                <Select onValueChange={(value) => handleInputChange('materialType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select material" />
                  </SelectTrigger>
                  <SelectContent>
                    {materials.map(material => (
                      <SelectItem key={material} value={material}>{material}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="fuel">Fuel Type</Label>
                <Select onValueChange={(value) => handleInputChange('fuelType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select fuel" />
                  </SelectTrigger>
                  <SelectContent>
                    {fuels.map(fuel => (
                      <SelectItem key={fuel} value={fuel}>{fuel}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="electricity">Electricity (kWh)</Label>
                <Input
                  id="electricity"
                  type="number"
                  placeholder="e.g., 1500"
                  value={formData.electricityConsumption}
                  onChange={(e) => handleInputChange('electricityConsumption', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="fuelEnergy">Fuel Energy (MJ)</Label>
                <Input
                  id="fuelEnergy"
                  type="number"
                  placeholder="e.g., 2000"
                  value={formData.fuelEnergy}
                  onChange={(e) => handleInputChange('fuelEnergy', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="distance">Transport Distance (km)</Label>
                <Input
                  id="distance"
                  type="number"
                  placeholder="e.g., 200"
                  value={formData.transportDistance}
                  onChange={(e) => handleInputChange('transportDistance', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="transport">Transport Mode</Label>
                <Select onValueChange={(value) => handleInputChange('transportMode', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    {transports.map(transport => (
                      <SelectItem key={transport} value={transport}>{transport}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="landfill">Landfill Location</Label>
              <Select onValueChange={(value) => handleInputChange('landfillLocation', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select landfill" />
                </SelectTrigger>
                <SelectContent>
                  {landfills.map(landfill => (
                    <SelectItem key={landfill} value={landfill}>{landfill}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={getAISuggestions} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Processing...' : 'Get AI Suggestions'}
            </Button>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Response */}
        {aiResponse && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                AI Analysis Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Missing Fields Detected */}
              {aiResponse.missingFieldsDetected.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">Missing Fields Completed:</h4>
                  <div className="flex flex-wrap gap-1">
                    {aiResponse.missingFieldsDetected.map(field => (
                      <Badge key={field} variant="secondary" className="text-xs">
                        {field}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Environmental Impact */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Environmental Impact</h4>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span>CO2 Emissions:</span>
                    <span className="font-medium">{aiResponse.environmentalImpact.co2Emissions} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Energy:</span>
                    <span className="font-medium">{aiResponse.environmentalImpact.totalEnergy} MJ</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Efficiency Score:</span>
                    <span className={`font-medium ${getImpactColor(aiResponse.environmentalImpact.fuelEfficiencyScore)}`}>
                      {aiResponse.environmentalImpact.fuelEfficiencyScore}/100
                    </span>
                  </div>
                </div>
              </div>

              {/* Completed Data */}
              <div>
                <h4 className="font-semibold mb-2">Completed Data:</h4>
                <div className="bg-blue-50 p-3 rounded text-sm space-y-1">
                  {Object.entries(aiResponse.completedData).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* AI Recommendations */}
      {aiResponse && (
        <div className="space-y-6">
          {/* Optimal Choices - New Section */}
          {aiResponse.optimalChoices && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  🎯 Optimal Choices for Your Project
                </CardTitle>
                <CardDescription>
                  AI-recommended best choices for transport, fuel, and logistics based on your material and location
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {aiResponse.optimalChoices.map((choice, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-gradient-to-br from-blue-50 to-green-50">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs font-semibold">
                          {choice.type}
                        </Badge>
                        {choice.type === 'Transport' && <span>🚛</span>}
                        {choice.type === 'Fuel' && <span>⛽</span>}
                        {choice.type === 'Logistics' && <span>📍</span>}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-semibold text-green-700">Recommended: </span>
                          <span className="font-medium">{choice.recommended}</span>
                        </div>
                        
                        <div className="text-xs text-gray-600">
                          <div className="mb-1">
                            <span className="font-medium">Why: </span>
                            {choice.reason}
                          </div>
                          
                          <div className="mb-1 text-blue-600">
                            <span className="font-medium">💰 Cost: </span>
                            {choice.savings}
                          </div>
                          
                          <div className="text-green-600">
                            <span className="font-medium">🌱 Environment: </span>
                            {choice.environmental}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Explanations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  AI Calculations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {aiResponse.explanation.map((explanation, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>{explanation}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* General Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Leaf className="h-5 w-5" />
                  General Sustainability Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {aiResponse.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-green-50 rounded-lg">
                      <TrendingDown className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-green-800">{recommendation}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default AISuggestions;