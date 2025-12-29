import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import {
  ArrowRight,
  Download,
  ArrowUp,
  ArrowDown,
  Minus,
  TrendingUp,
  TrendingDown,
  BarChart3,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { lcaAPI } from '@/lib/api';

const Compare = () => {
  const navigate = useNavigate();
  const { results, selectedScenarios, setSelectedScenarios } = useStore();

  const [comparisonMode, setComparisonMode] = useState<'scenarios' | 'materials' | 'routes'>('scenarios');
  const [scenario1Id, setScenario1Id] = useState(selectedScenarios[0] || '');
  const [scenario2Id, setScenario2Id] = useState(selectedScenarios[1] || '');
  const [material1, setMaterial1] = useState('');
  const [material2, setMaterial2] = useState('');
  const [routeMaterial, setRouteMaterial] = useState('');
  const [route1, setRoute1] = useState('');
  const [route2, setRoute2] = useState('');
  const [comparisonData, setComparisonData] = useState<any[]>([]);
  const [radarData, setRadarData] = useState<any[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [recommendation, setRecommendation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const materials = ['Copper', 'Aluminium', 'Steel'];
  const routes = ['virgin', 'mixed', 'recycled'];

  // Generate radar chart data from two scenarios
  const generateRadarData = (s1: any, s2: any) => {
    const maxCarbon = Math.max(s1.carbonEmissions, s2.carbonEmissions);
    const maxEnergy = Math.max(s1.energyConsumed, s2.energyConsumed);
    const maxWater = Math.max(s1.waterUse, s2.waterUse);
    return [
      {
        metric: 'Low Carbon',
        scenario1: 100 - (s1.carbonEmissions / maxCarbon) * 100,
        scenario2: 100 - (s2.carbonEmissions / maxCarbon) * 100,
      },
      {
        metric: 'Energy Efficiency',
        scenario1: 100 - (s1.energyConsumed / maxEnergy) * 100,
        scenario2: 100 - (s2.energyConsumed / maxEnergy) * 100,
      },
      {
        metric: 'Water Efficiency',
        scenario1: 100 - (s1.waterUse / maxWater) * 100,
        scenario2: 100 - (s2.waterUse / maxWater) * 100,
      },
      {
        metric: 'Circularity',
        scenario1: s1.circularityPercent,
        scenario2: s2.circularityPercent,
      },
    ];
  };

  // Generate bar chart data from two scenarios
  const generateComparisonData = (s1: any, s2: any) => [
    {
      metric: 'Carbon Emissions',
      scenario1: s1.carbonEmissions,
      scenario2: s2.carbonEmissions,
      unit: 'kg CO₂e',
    },
    {
      metric: 'Energy Consumption',
      scenario1: s1.energyConsumed,
      scenario2: s2.energyConsumed,
      unit: 'MJ',
    },
    {
      metric: 'Water Usage',
      scenario1: s1.waterUse,
      scenario2: s2.waterUse,
      unit: 'L',
    },
    {
      metric: 'Circularity',
      scenario1: s1.circularityPercent,
      scenario2: s2.circularityPercent,
      unit: '%',
    },
  ];

  // Calculate percent difference for UI table
  const calculateDifference = (value1: number, value2: number) => {
    if(value1 === 0) return { value: 0, isImprovement: false, isNeutral: true };
    const diff = ((value2 - value1) / value1) * 100;
    return {
      value: Math.abs(diff),
      isImprovement: diff < 0,
      isNeutral: Math.abs(diff) < 1,
    };
  };

  // When compare button clicked, fetch compare API and update local comparison state
  const handleCompare = async () => {
    if (comparisonMode === 'scenarios' && (!scenario1Id || !scenario2Id)) return;
    if (comparisonMode === 'materials' && (!material1 || !material2)) return;
    if (comparisonMode === 'routes' && (!routeMaterial || !route1 || !route2)) return;
    
    setLoading(true);
    setError(null);
    
    try {
      let res;
      if (comparisonMode === 'materials') {
        res = await lcaAPI.compareResults({ mode: 'metals', metals: [material1, material2] });
      } else if (comparisonMode === 'routes') {
        res = await lcaAPI.compareResults({ mode: 'routes', material: routeMaterial, routes: [route1, route2] });
      } else {
        setSelectedScenarios([scenario1Id, scenario2Id]);
        res = await lcaAPI.compareResults({ mode: 'ids', ids: [scenario1Id, scenario2Id] });
      }
      
      if (res.data && res.data.length === 2) {
        const [s1, s2] = res.data;
        setComparisonData(generateComparisonData(s1, s2));
        setRadarData(generateRadarData(s1, s2));
        
        // Set insights and recommendations
        if (res.insights) setInsights(res.insights);
        if (res.recommendation) setRecommendation(res.recommendation);
      } else {
        setError('Invalid comparison data received.');
      }
    } catch (err) {
      setError('Error fetching comparison data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate comparison scenarios if only one result exists
  const generateComparisonScenarios = () => {
    if (results.length === 1) {
      const baseResult = results[0];
      const input = baseResult.input;
      
      const virginScenario = {
        id: `virgin-${Date.now()}`,
        name: `${input.materialType} Virgin Route`,
        input: { ...input, route: 'virgin' as const, recycledPercentage: 0 },
        carbonEmissions: Math.round(baseResult.carbonEmissions * 1.8),
        energyConsumed: Math.round(baseResult.energyConsumed * 1.6),
        waterUse: Math.round(baseResult.waterUse * 2.2),
        circularityPercent: 15,
        recommendations: ['Consider recycled content to reduce environmental impact'],
        timestamp: new Date()
      };
      
      const optimizedScenario = {
        id: `optimized-${Date.now()}`,
        name: `${input.materialType} Optimized Route`,
        input: { ...input, route: 'mixed' as const, recycledPercentage: 80 },
        carbonEmissions: Math.round(baseResult.carbonEmissions * 0.6),
        energyConsumed: Math.round(baseResult.energyConsumed * 0.7),
        waterUse: Math.round(baseResult.waterUse * 0.5),
        circularityPercent: 85,
        recommendations: ['Excellent sustainability performance achieved'],
        timestamp: new Date()
      };
      
      return [baseResult, virginScenario, optimizedScenario];
    }
    return results;
  };

  const availableResults = generateComparisonScenarios();
  const scenario1 = comparisonMode === 'scenarios' ? availableResults.find(r => r.id === scenario1Id) : null;
  const scenario2 = comparisonMode === 'scenarios' ? availableResults.find(r => r.id === scenario2Id) : null;

  // Fetch results from backend on mount if store empty (optional)
  useEffect(() => {
    if (results.length === 0) {
      const fetchResults = async () => {
        setLoading(true);
        setError(null);
        try {
          const res = await lcaAPI.getResults();
          if (res.length < 2) {
            setError('You need at least 2 analysis results to compare scenarios.');
            setLoading(false);
            return;
          }
          // Optionally update store if you have a setResults method
          // setResults(res);
        } catch (err) {
          setError('Failed to fetch results from backend.');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchResults();
    }
  }, [results]);

  React.useEffect(() => {
    if (comparisonMode === 'scenarios' && availableResults.length >= 2 && !scenario1Id) {
      setScenario1Id(availableResults[0].id);
      setScenario2Id(availableResults[1].id);
    }
  }, [availableResults, scenario1Id, comparisonMode]);

  // Auto-update comparison when materials or routes change
  React.useEffect(() => {
    if (comparisonMode === 'materials' && material1 && material2) {
      handleCompare();
    }
  }, [material1, material2, comparisonMode]);

  React.useEffect(() => {
    if (comparisonMode === 'routes' && routeMaterial && route1 && route2) {
      handleCompare();
    }
  }, [routeMaterial, route1, route2, comparisonMode]);

  React.useEffect(() => {
    if (comparisonMode === 'scenarios' && scenario1 && scenario2) {
      setComparisonData(generateComparisonData(scenario1, scenario2));
      setRadarData(generateRadarData(scenario1, scenario2));
      setInsights([]);
      setRecommendation('');
    }
  }, [scenario1, scenario2, comparisonMode]);

  if (loading) {
    return <div className="p-6 text-center">Loading comparison data...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-subtle-gradient flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-2xl font-bold text-foreground">{error}</h2>
          <Button onClick={() => navigate('/input')}>Run New Analysis</Button>
        </div>
      </div>
    );
  }

  if (availableResults.length < 2) {
    return (
      <div className="min-h-screen bg-subtle-gradient flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-warning mx-auto" />
          <h2 className="text-2xl font-bold text-foreground">No Analysis Results</h2>
          <p className="text-muted-foreground max-w-md">
            Please run at least one analysis to enable comparison features.
          </p>
          <Button onClick={() => navigate('/input')}>
            Run Analysis
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-subtle-gradient py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground">
              Scenario Comparison
            </h1>
            <p className="text-lg text-muted-foreground">
              Compare different LCA scenarios to identify the best sustainable option
            </p>
          </motion.div>
        </div>

        {/* Materials Database Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-8"
        >
          <Card className="card-eco">
            <CardHeader>
              <CardTitle>Materials Database Overview</CardTitle>
              <CardDescription>
                Complete analysis data for all available materials
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Material</th>
                      <th className="text-center p-3 font-medium">Energy Intensity</th>
                      <th className="text-center p-3 font-medium">Carbon Factor</th>
                      <th className="text-center p-3 font-medium">Water Use</th>
                      <th className="text-center p-3 font-medium">Recycle Rate</th>
                      <th className="text-center p-3 font-medium">Processing Temp</th>
                      <th className="text-center p-3 font-medium">Abundance</th>
                      <th className="text-center p-3 font-medium">Sustainability</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'Copper', energy: 22.4, carbon: 0.7, water: 5.7, recycle: 85, temp: 1085, abundance: 'Medium', sustainability: 'Good' },
                      { name: 'Steel', energy: 18.5, carbon: 0.65, water: 4.2, recycle: 90, temp: 1538, abundance: 'High', sustainability: 'Excellent' },
                      { name: 'Aluminium', energy: 45.2, carbon: 0.42, water: 8.1, recycle: 95, temp: 660, abundance: 'High', sustainability: 'Excellent' }
                    ].map((material, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="p-3 font-medium">
                          <Badge variant="outline">{material.name}</Badge>
                        </td>
                        <td className="p-3 text-center">{material.energy} kWh/kg</td>
                        <td className="p-3 text-center">{material.carbon}</td>
                        <td className="p-3 text-center">{material.water} L/kg</td>
                        <td className="p-3 text-center">
                          <Badge variant={material.recycle >= 90 ? 'default' : material.recycle >= 80 ? 'secondary' : 'outline'}>
                            {material.recycle}%
                          </Badge>
                        </td>
                        <td className="p-3 text-center">{material.temp}°C</td>
                        <td className="p-3 text-center">
                          <Badge variant={
                            material.abundance === 'Very High' ? 'default' : 
                            material.abundance === 'High' ? 'secondary' : 
                            material.abundance === 'Medium' ? 'outline' : 'destructive'
                          }>
                            {material.abundance}
                          </Badge>
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant={
                            material.sustainability === 'Excellent' ? 'default' : 
                            material.sustainability === 'Good' ? 'secondary' : 
                            material.sustainability === 'Fair' ? 'outline' : 'destructive'
                          }>
                            {material.sustainability}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-xs text-muted-foreground">
                <p>* Energy Intensity: kWh per kg of material processed</p>
                <p>* Carbon Factor: Relative CO₂ emission multiplier</p>
                <p>* Water Use: Liters per kg of material processed</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Comparison Mode Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="card-eco">
            <CardHeader>
              <CardTitle>Comparison Type</CardTitle>
              <CardDescription>
                Choose between comparing saved scenarios or different materials
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <Button 
                  variant={comparisonMode === 'scenarios' ? 'default' : 'outline'}
                  onClick={() => setComparisonMode('scenarios')}
                >
                  Compare Scenarios
                </Button>
                <Button 
                  variant={comparisonMode === 'materials' ? 'default' : 'outline'}
                  onClick={() => setComparisonMode('materials')}
                >
                  Compare Materials
                </Button>
                <Button 
                  variant={comparisonMode === 'routes' ? 'default' : 'outline'}
                  onClick={() => setComparisonMode('routes')}
                >
                  Compare Routes
                </Button>
              </div>

              {comparisonMode === 'scenarios' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Scenario 1</label>
                    <Select value={scenario1Id} onValueChange={setScenario1Id}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select first scenario" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableResults.map(result => (
                          <SelectItem key={result.id} value={result.id}>
                            {result.name} - {result.input.materialType} ({result.input.route})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Scenario 2</label>
                    <Select value={scenario2Id} onValueChange={setScenario2Id}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select second scenario" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableResults.map(result => (
                          <SelectItem key={result.id} value={result.id}>
                            {result.name} - {result.input.materialType} ({result.input.route})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : comparisonMode === 'materials' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Material 1</label>
                    <Select value={material1} onValueChange={setMaterial1}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select first material" />
                      </SelectTrigger>
                      <SelectContent>
                        {materials.map(material => (
                          <SelectItem key={material} value={material}>
                            {material}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Material 2</label>
                    <Select value={material2} onValueChange={setMaterial2}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select second material" />
                      </SelectTrigger>
                      <SelectContent>
                        {materials.filter(m => m !== material1).map(material => (
                          <SelectItem key={material} value={material}>
                            {material}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Material</label>
                    <Select value={routeMaterial} onValueChange={setRouteMaterial}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select material to compare routes" />
                      </SelectTrigger>
                      <SelectContent>
                        {materials.map(material => (
                          <SelectItem key={material} value={material}>
                            {material}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Route 1</label>
                      <Select value={route1} onValueChange={setRoute1}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select first route" />
                        </SelectTrigger>
                        <SelectContent>
                          {routes.map(route => (
                            <SelectItem key={route} value={route}>
                              {route.charAt(0).toUpperCase() + route.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Route 2</label>
                      <Select value={route2} onValueChange={setRoute2}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select second route" />
                        </SelectTrigger>
                        <SelectContent>
                          {routes.filter(r => r !== route1).map(route => (
                            <SelectItem key={route} value={route}>
                              {route.charAt(0).toUpperCase() + route.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
              
              {comparisonMode === 'scenarios' && scenario1Id && scenario2Id && (
                <div className="mt-6 flex justify-center">
                  <Button onClick={handleCompare} className="bg-eco-gradient" disabled={loading}>
                    {loading ? 'Analyzing...' : 'Compare Scenarios'}
                    <BarChart3 className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
              
              {comparisonMode === 'materials' && material1 && material2 && (
                <div className="mt-6 text-center">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Auto-updating comparison: {material1} vs {material2}</span>
                  </div>
                </div>
              )}
              
              {comparisonMode === 'routes' && routeMaterial && route1 && route2 && (
                <div className="mt-6 text-center">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Auto-updating comparison: {routeMaterial} {route1} vs {route2}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {comparisonData.length > 0 && (
          <>
            {/* Quick Material Stats */}
            {comparisonMode === 'materials' && material1 && material2 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
                className="mb-8"
              >
                <Card className="card-eco">
                  <CardHeader>
                    <CardTitle>Quick Material Comparison</CardTitle>
                    <CardDescription>
                      Key properties comparison between {material1} and {material2}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: 'Energy Intensity', m1: material1 === 'Copper' ? '22.4' : material1 === 'Steel' ? '18.5' : '45.2', m2: material2 === 'Copper' ? '22.4' : material2 === 'Steel' ? '18.5' : '45.2', unit: 'kWh/kg' },
                        { label: 'Recycle Rate', m1: material1 === 'Copper' ? '85' : material1 === 'Steel' ? '90' : '95', m2: material2 === 'Copper' ? '85' : material2 === 'Steel' ? '90' : '95', unit: '%' },
                        { label: 'Processing Temp', m1: material1 === 'Copper' ? '1085' : material1 === 'Steel' ? '1538' : '660', m2: material2 === 'Copper' ? '1085' : material2 === 'Steel' ? '1538' : '660', unit: '°C' },
                        { label: 'Water Use', m1: material1 === 'Copper' ? '5.7' : material1 === 'Steel' ? '4.2' : '8.1', m2: material2 === 'Copper' ? '5.7' : material2 === 'Steel' ? '4.2' : '8.1', unit: 'L/kg' }
                      ].map((stat, index) => (
                        <div key={index} className="text-center p-3 bg-muted/30 rounded-lg">
                          <div className="text-xs text-muted-foreground mb-1">{stat.label}</div>
                          <div className="flex justify-between items-center">
                            <div className="text-sm font-medium text-primary">{stat.m1}</div>
                            <div className="text-xs text-muted-foreground">vs</div>
                            <div className="text-sm font-medium text-secondary">{stat.m2}</div>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">{stat.unit}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Analysis Insights for Material and Route Comparison */}
            {(comparisonMode === 'materials' || comparisonMode === 'routes') && insights.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mb-8"
              >
                <Card className="card-eco">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
{comparisonMode === 'materials' ? 'Material Analysis Insights' : 'Route Analysis Insights'}
                    </CardTitle>
                    <CardDescription>
{comparisonMode === 'materials' 
                        ? `AI-powered analysis comparing ${material1} vs ${material2} (Auto-updated)`
                        : `AI-powered analysis comparing ${routeMaterial} ${route1} vs ${route2} routes (Auto-updated)`
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {insights.map((insight, index) => (
                        <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                          <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-blue-800">{insight}</span>
                        </div>
                      ))}
                      {recommendation && (
                        <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            <span className="font-semibold text-green-800">Recommendation</span>
                          </div>
                          <p className="text-green-700">{recommendation}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Comparison Headers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="card-eco">
                  <CardHeader>
                    <CardTitle className="text-primary">
{comparisonMode === 'materials' ? material1 : 
                       comparisonMode === 'routes' ? `${routeMaterial} ${route1?.charAt(0).toUpperCase() + route1?.slice(1)}` :
                       (scenario1?.name || 'Scenario 1')}
                    </CardTitle>
                    <CardDescription>
{comparisonMode === 'materials' ? `${material1} Processing Analysis` : 
                       comparisonMode === 'routes' ? `${routeMaterial} ${route1?.charAt(0).toUpperCase() + route1?.slice(1)} Route` :
                       (scenario1?.input.materialType + ' - ' + scenario1?.input.route)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Material:</span>
                        <Badge variant="secondary">
{comparisonMode === 'materials' ? material1 : 
                           comparisonMode === 'routes' ? routeMaterial :
                           scenario1?.input.materialType}
                        </Badge>
                      </div>
                      {comparisonMode === 'scenarios' && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Route:</span>
                            <Badge variant="outline">{scenario1?.input.route}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Date:</span>
                            <span className="text-sm">{scenario1?.timestamp ? new Date(scenario1.timestamp).toLocaleDateString() : 'N/A'}</span>
                          </div>
                        </>
                      )}
                      {comparisonMode === 'materials' && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Analysis:</span>
                          <Badge variant="outline">Real-time LCA</Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="card-eco">
                  <CardHeader>
                    <CardTitle className="text-secondary">
{comparisonMode === 'materials' ? material2 : 
                       comparisonMode === 'routes' ? `${routeMaterial} ${route2?.charAt(0).toUpperCase() + route2?.slice(1)}` :
                       (scenario2?.name || 'Scenario 2')}
                    </CardTitle>
                    <CardDescription>
{comparisonMode === 'materials' ? `${material2} Processing Analysis` : 
                       comparisonMode === 'routes' ? `${routeMaterial} ${route2?.charAt(0).toUpperCase() + route2?.slice(1)} Route` :
                       (scenario2?.input.materialType + ' - ' + scenario2?.input.route)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Material:</span>
                        <Badge variant="secondary">
{comparisonMode === 'materials' ? material2 : 
                           comparisonMode === 'routes' ? routeMaterial :
                           scenario2?.input.materialType}
                        </Badge>
                      </div>
                      {comparisonMode === 'scenarios' && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Route:</span>
                            <Badge variant="outline">{scenario2?.input.route}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Date:</span>
                            <span className="text-sm">{scenario2?.timestamp ? new Date(scenario2.timestamp).toLocaleDateString() : 'N/A'}</span>
                          </div>
                        </>
                      )}
                      {comparisonMode === 'materials' && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Analysis:</span>
                          <Badge variant="outline">Real-time LCA</Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Comparison Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-8"
            >
              <Card className="card-eco">
                <CardHeader>
                  <CardTitle>Environmental Impact Comparison</CardTitle>
                  <CardDescription>
                    Side-by-side comparison of key metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="metric"
                        fontSize={12}
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis 
                        fontSize={12}
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar 
                        dataKey="scenario1" 
                        fill="hsl(var(--primary))" 
                        name={comparisonMode === 'materials' ? material1 : 
                              comparisonMode === 'routes' ? `${routeMaterial} ${route1}` :
                              scenario1?.name || 'Scenario 1'}
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar 
                        dataKey="scenario2" 
                        fill="hsl(var(--secondary))" 
                        name={comparisonMode === 'materials' ? material2 : 
                              comparisonMode === 'routes' ? `${routeMaterial} ${route2}` :
                              scenario2?.name || 'Scenario 2'}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>

            {/* Detailed Comparison Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mb-8"
            >
              <Card className="card-eco">
                <CardHeader>
                  <CardTitle>Detailed Comparison</CardTitle>
                  <CardDescription>
                    Numerical comparison with percentage differences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-4 font-medium">Metric</th>
                          <th className="text-center p-4 font-medium text-primary">Scenario 1</th>
                          <th className="text-center p-4 font-medium text-secondary">Scenario 2</th>
                          <th className="text-center p-4 font-medium">Difference</th>
                          <th className="text-center p-4 font-medium">Better Option</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comparisonData.map((item, index) => {
                          const diff = calculateDifference(item.scenario1, item.scenario2);
                          const isBetterScenario2 = item.metric === 'Circularity' 
                            ? item.scenario2 > item.scenario1 
                            : item.scenario2 < item.scenario1;
                          
                          return (
                            <tr key={index} className="border-b">
                              <td className="p-4 font-medium">{item.metric}</td>
                              <td className="p-4 text-center">
                                {item.scenario1.toLocaleString()} {item.unit}
                              </td>
                              <td className="p-4 text-center">
                                {item.scenario2.toLocaleString()} {item.unit}
                              </td>
                              <td className="p-4 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  {diff.isNeutral ? (
                                    <Minus className="h-4 w-4 text-muted-foreground" />
                                  ) : item.scenario2 > item.scenario1 ? (
                                    <ArrowUp className="h-4 w-4 text-destructive" />
                                  ) : (
                                    <ArrowDown className="h-4 w-4 text-success" />
                                  )}
                                  <span className={diff.isNeutral ? 'text-muted-foreground' : item.scenario2 > item.scenario1 ? 'text-destructive' : 'text-success'}>
                                    {diff.value.toFixed(1)}%
                                  </span>
                                </div>
                              </td>
                              <td className="p-4 text-center">
                                {diff.isNeutral ? (
                                  <Badge variant="outline">Similar</Badge>
                                ) : isBetterScenario2 ? (
                                  <Badge variant="secondary">
                                    {comparisonMode === 'materials' ? material2 : 
                                     comparisonMode === 'routes' ? `${routeMaterial} ${route2}` :
                                     'Scenario 2'}
                                  </Badge>
                                ) : (
                                  <Badge variant="default">
                                    {comparisonMode === 'materials' ? material1 : 
                                     comparisonMode === 'routes' ? `${routeMaterial} ${route1}` :
                                     'Scenario 1'}
                                  </Badge>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Radar Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mb-8"
            >
              <Card className="card-eco">
                <CardHeader>
                  <CardTitle>Sustainability Performance Radar</CardTitle>
                  <CardDescription>
                    Multi-dimensional comparison of sustainability metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="metric" fontSize={12} />
                      <PolarRadiusAxis domain={[0, 100]} fontSize={10} />
                      <Radar
                        name={comparisonMode === 'materials' ? material1 : 
                              comparisonMode === 'routes' ? `${routeMaterial} ${route1}` :
                              scenario1?.name || 'Scenario 1'}
                        dataKey="scenario1"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.2}
                        strokeWidth={2}
                      />
                      <Radar
                        name={comparisonMode === 'materials' ? material2 : 
                              comparisonMode === 'routes' ? `${routeMaterial} ${route2}` :
                              scenario2?.name || 'Scenario 2'}
                        dataKey="scenario2"
                        stroke="hsl(var(--secondary))"
                        fill="hsl(var(--secondary))"
                        fillOpacity={0.2}
                        strokeWidth={2}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex flex-wrap gap-4 justify-center"
            >
              <Button
                size="lg"
                onClick={async () => {
                  try {
                    const { jsPDF } = await import('jspdf');
                    const doc = new jsPDF();
                    
                    // Header
                    doc.setFontSize(20);
                    doc.text(`LCA ${comparisonMode === 'materials' ? 'Material' : 'Scenario'} Comparison Report`, 20, 30);
                    
                    doc.setFontSize(12);
                    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 45);
                    
                    if (comparisonMode === 'materials') {
                      // Material 1
                      doc.setFontSize(16);
                      doc.text(`Material 1: ${material1}`, 20, 65);
                      doc.setFontSize(12);
                      const data1 = comparisonData.find(d => d.metric === 'Carbon Emissions');
                      doc.text(`Carbon Emissions: ${data1?.scenario1} kg CO₂e`, 25, 75);
                      const data2 = comparisonData.find(d => d.metric === 'Energy Consumption');
                      doc.text(`Energy Consumed: ${data2?.scenario1} MJ`, 25, 85);
                      const data3 = comparisonData.find(d => d.metric === 'Water Usage');
                      doc.text(`Water Use: ${data3?.scenario1} L`, 25, 95);
                      const data4 = comparisonData.find(d => d.metric === 'Circularity');
                      doc.text(`Circularity: ${data4?.scenario1}%`, 25, 105);
                      
                      // Material 2
                      doc.setFontSize(16);
                      doc.text(`Material 2: ${material2}`, 20, 125);
                      doc.setFontSize(12);
                      doc.text(`Carbon Emissions: ${data1?.scenario2} kg CO₂e`, 25, 135);
                      doc.text(`Energy Consumed: ${data2?.scenario2} MJ`, 25, 145);
                      doc.text(`Water Use: ${data3?.scenario2} L`, 25, 155);
                      doc.text(`Circularity: ${data4?.scenario2}%`, 25, 165);
                      
                      // Insights
                      if (insights.length > 0) {
                        doc.setFontSize(16);
                        doc.text('Analysis Insights', 20, 185);
                        doc.setFontSize(10);
                        insights.forEach((insight, index) => {
                          doc.text(`• ${insight}`, 25, 195 + (index * 10));
                        });
                      }
                      
                      if (recommendation) {
                        doc.setFontSize(14);
                        doc.text('Recommendation', 20, 225 + (insights.length * 10));
                        doc.setFontSize(12);
                        doc.text(recommendation, 25, 235 + (insights.length * 10));
                      }
                    } else {
                      // Scenario 1
                      doc.setFontSize(16);
                      doc.text('Scenario 1', 20, 65);
                      doc.setFontSize(12);
                      doc.text(`Name: ${scenario1?.name}`, 25, 75);
                      doc.text(`Material: ${scenario1?.input.materialType}`, 25, 85);
                      doc.text(`Route: ${scenario1?.input.route}`, 25, 95);
                      doc.text(`Carbon Emissions: ${scenario1?.carbonEmissions} kg CO₂e`, 25, 105);
                      doc.text(`Energy Consumed: ${scenario1?.energyConsumed} MJ`, 25, 115);
                      doc.text(`Water Use: ${scenario1?.waterUse} L`, 25, 125);
                      doc.text(`Circularity: ${scenario1?.circularityPercent}%`, 25, 135);
                      
                      // Scenario 2
                      doc.setFontSize(16);
                      doc.text('Scenario 2', 20, 155);
                      doc.setFontSize(12);
                      doc.text(`Name: ${scenario2?.name}`, 25, 165);
                      doc.text(`Material: ${scenario2?.input.materialType}`, 25, 175);
                      doc.text(`Route: ${scenario2?.input.route}`, 25, 185);
                      doc.text(`Carbon Emissions: ${scenario2?.carbonEmissions} kg CO₂e`, 25, 195);
                      doc.text(`Energy Consumed: ${scenario2?.energyConsumed} MJ`, 25, 205);
                      doc.text(`Water Use: ${scenario2?.waterUse} L`, 25, 215);
                      doc.text(`Circularity: ${scenario2?.circularityPercent}%`, 25, 225);
                      
                      // Comparison Summary
                      doc.setFontSize(16);
                      doc.text('Comparison Summary', 20, 245);
                      doc.setFontSize(12);
                      
                      const carbonDiff = ((scenario2?.carbonEmissions - scenario1?.carbonEmissions) / scenario1?.carbonEmissions * 100).toFixed(1);
                      const energyDiff = ((scenario2?.energyConsumed - scenario1?.energyConsumed) / scenario1?.energyConsumed * 100).toFixed(1);
                      const waterDiff = ((scenario2?.waterUse - scenario1?.waterUse) / scenario1?.waterUse * 100).toFixed(1);
                      
                      doc.text(`Carbon Emissions Difference: ${carbonDiff}%`, 25, 255);
                      doc.text(`Energy Consumption Difference: ${energyDiff}%`, 25, 265);
                      doc.text(`Water Usage Difference: ${waterDiff}%`, 25, 275);
                    }
                    
                    const fileName = comparisonMode === 'materials' 
                      ? `LCA_Material_Comparison_${material1}_vs_${material2}_${new Date().toISOString().split('T')[0]}.pdf`
                      : `LCA_Scenario_Comparison_${scenario1?.input.materialType}_${new Date().toISOString().split('T')[0]}.pdf`;
                    doc.save(fileName);
                    
                    alert('PDF exported successfully!');
                  } catch (error) {
                    console.error('PDF generation failed:', error);
                    alert('PDF generation failed. Please try again.');
                  }
                }}
                className="bg-eco-gradient"
              >
                Export Comparison PDF
                <Download className="ml-2 h-5 w-5" />
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/input')}
              >
                Run New Analysis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
};

export default Compare;
