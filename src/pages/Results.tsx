import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/store/useStore";
import { lcaAPI } from "@/lib/api"; // Backend API
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";
import {
  ArrowRight,
  Download,
  Share,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Leaf,
  Zap,
  Droplets,
  Recycle,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart as PieChartIcon,
} from "lucide-react";

const Results = () => {
  const navigate = useNavigate();
  const { currentResult, setCurrentResult } = useStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch fresh result from backend if currentResult has an id (skip for mock results)
  useEffect(() => {
    const fetchResult = async () => {
      if (!currentResult?.id || currentResult.id.startsWith('analysis-')) return; // Skip mock results
      setLoading(true);
      setError(null);
      try {
        const freshResult = await lcaAPI.getResultById(currentResult.id);
        if (!freshResult) {
          console.log("Result not found from backend, using current result");
          setLoading(false);
          return;
        }
        setCurrentResult(freshResult);
      } catch (err) {
        console.log("Backend unavailable, using current result");
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [currentResult?.id, setCurrentResult]);

  if (!currentResult && !loading) {
    return (
      <div className="min-h-screen bg-subtle-gradient flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-warning mx-auto" />
          <h2 className="text-2xl font-bold text-foreground">
            No Results Available
          </h2>
          <p className="text-muted-foreground">
            Please run an analysis first to view results.
          </p>
          <Button onClick={() => navigate("/input")}>
            Start Analysis
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Loading results from backend...</p>
      </div>
    );
  }

  // Remove error display for better UX with fallback analysis

  // Destructure currentResult data
  const {
    input,
    carbonEmissions,
    energyConsumed,
    waterUse,
    circularityPercent,
    recommendations,
  } = currentResult;

  // Generate comparison data for charts
  const virginData = {
    carbonEmissions: carbonEmissions * 1.8,
    energyConsumed: energyConsumed * 1.6,
    waterUse: waterUse * 2.2,
    circularityPercent: 15,
  };

  const comparisonData = [
    {
      category: "Carbon Emissions",
      current: carbonEmissions,
      virgin: virginData.carbonEmissions,
      unit: "kg CO₂e",
    },
    {
      category: "Energy Use",
      current: energyConsumed,
      virgin: virginData.energyConsumed,
      unit: "MJ",
    },
    {
      category: "Water Use",
      current: waterUse,
      virgin: virginData.waterUse,
      unit: "L",
    },
  ];

  // Use ML data if available, otherwise generate dynamic data
  const generateCircularityData = () => {
    // Check if we have ML analysis data
    if (currentResult.mlData && currentResult.mlData.chartsData && currentResult.mlData.chartsData.end_of_life) {
      const eolData = currentResult.mlData.chartsData.end_of_life;
      return [
        { name: "Recycled", value: Math.round(eolData.recycle), color: "#22c55e" },
        { name: "Reused", value: Math.round(eolData.reuse), color: "#3b82f6" },
        { name: "Landfill", value: Math.round(eolData.landfill), color: "#ef4444" },
      ];
    }
    
    // Check if we have batch analysis data with recycling info
    if (currentResult.batchData && currentResult.batchData.length > 0) {
      const batchItem = currentResult.batchData[0];
      if (batchItem.analysis && batchItem.analysis.recyclePercent !== undefined) {
        return [
          { name: "Recycled", value: batchItem.analysis.recyclePercent, color: "#22c55e" },
          { name: "Reused", value: batchItem.analysis.reusePercent, color: "#3b82f6" },
          { name: "Landfill", value: batchItem.analysis.landfillPercent, color: "#ef4444" },
        ];
      }
    }
    
    // Fallback: Create variation based on carbon emissions and material type
    const carbonFactor = Math.min(carbonEmissions / 1000, 1);
    const materialBonus = input.materialType === 'Steel' ? 10 : 
                         input.materialType === 'Bauxite' ? 15 : 
                         input.materialType === 'Copper' ? 8 : 5;
    
    const recycled = Math.round(45 + (1 - carbonFactor) * 35 + materialBonus);
    const reused = Math.round(10 + (1 - carbonFactor) * 20 + Math.random() * 10);
    const landfill = Math.max(0, 100 - recycled - reused);
    
    return [
      { name: "Recycled", value: recycled, color: "#22c55e" },
      { name: "Reused", value: reused, color: "#3b82f6" },
      { name: "Landfill", value: landfill, color: "#ef4444" },
    ];
  };
  
  const circularityData = generateCircularityData();
  
  // Debug log
  console.log('Circularity Data:', circularityData);
  console.log('Carbon Emissions:', carbonEmissions);
  console.log('Material Type:', input.materialType);

  const impactCategories = [
    {
      icon: Leaf,
      title: "Carbon Footprint",
      value: carbonEmissions,
      unit: "kg CO₂e",
      color: "text-success",
      bgColor: "bg-success/10",
      change: -(
        ((virginData.carbonEmissions - carbonEmissions) /
          virginData.carbonEmissions) *
        100
      ),
      benchmark: "vs virgin route",
    },
    {
      icon: Zap,
      title: "Energy Consumption",
      value: energyConsumed,
      unit: "MJ",
      color: "text-warning",
      bgColor: "bg-warning/10",
      change: -(
        ((virginData.energyConsumed - energyConsumed) / virginData.energyConsumed) *
        100
      ),
      benchmark: "vs virgin route",
    },
    {
      icon: Droplets,
      title: "Water Usage",
      value: waterUse,
      unit: "L",
      color: "text-primary",
      bgColor: "bg-primary/10",
      change: -(((virginData.waterUse - waterUse) / virginData.waterUse) * 100),
      benchmark: "vs virgin route",
    },
    {
      icon: Recycle,
      title: "Circularity Index",
      value: circularityPercent,
      unit: "%",
      color: "text-accent",
      bgColor: "bg-accent/10",
      change: circularityPercent - virginData.circularityPercent,
      benchmark: "vs virgin route",
    },
  ];

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
              LCA Analysis Results
            </h1>
            <p className="text-lg text-muted-foreground">
              {currentResult.name} •{" "}
              {new Date(currentResult.timestamp).toLocaleDateString()}
            </p>
            <div className="flex justify-center gap-2">
              <Badge variant="secondary">{input.materialType}</Badge>
              <Badge variant="outline">{input.route} route</Badge>
            </div>
          </motion.div>
        </div>
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {impactCategories.map((metric, index) => (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="card-stat hover:scale-105 transition-transform duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                      <metric.icon className={`h-6 w-6 ${metric.color}`} />
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-foreground">
                        {metric.value.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {metric.unit}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-medium text-foreground">{metric.title}</h3>
                    <div className="flex items-center gap-2">
                      {metric.change < 0 ? (
                        <TrendingDown className="h-4 w-4 text-success" />
                      ) : (
                        <TrendingUp className="h-4 w-4 text-destructive" />
                      )}
                      <span
                        className={`text-sm font-medium ${
                          metric.change < 0 ? "text-success" : "text-destructive"
                        }`}
                      >
                        {Math.abs(metric.change).toFixed(1)}%
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {metric.benchmark}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
        {/* ML Model Metrics (if available) */}
        {currentResult.mlData && currentResult.mlData.modelMetrics && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <Card className="card-eco">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Machine Learning Model Performance
                </CardTitle>
                <CardDescription>
                  Model trained on {currentResult.mlData.modelMetrics.training_samples || 0} samples
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {((currentResult.mlData.modelMetrics.r2_score || 0) * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">R² Score</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-warning">
                      {(currentResult.mlData.modelMetrics.rmse || 0).toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground">RMSE</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-accent">
                      {currentResult.mlData.summaryStats?.total_rows || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Data Points</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Environmental Impact Comparison */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="card-eco">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Environmental Impact Comparison
                </CardTitle>
                <CardDescription>
                  Current route vs virgin material production
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="category"
                      fontSize={12}
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis
                      fontSize={12}
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      itemStyle={{ color: "green" }}
                    />
                    <Bar
                      dataKey="current"
                      fill="hsl(var(--primary))"
                      name="Current Route"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="virgin"
                      fill="hsl(var(--muted))"
                      name="Virgin Route"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
          {/* Circularity Breakdown */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="card-eco">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  End-of-Life Distribution
                </CardTitle>
                <CardDescription>Material fate after use phase</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart key={`pie-${currentResult.id}-${Date.now()}`}>
                    <Pie
                      data={circularityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {circularityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-6 mt-4">
                  {circularityData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-sm font-medium">
                        {entry.name}: {entry.value}%
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
        {/* ML Carbon vs Energy Chart (if available) */}
        {currentResult.mlData && currentResult.mlData.chartsData && currentResult.mlData.chartsData.carbon_vs_energy && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="mb-8"
          >
            <Card className="card-eco">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Carbon vs Energy Relationship (ML Data)
                </CardTitle>
                <CardDescription>
                  Scatter plot showing relationship between predicted carbon emissions and energy consumption
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={currentResult.mlData.chartsData.carbon_vs_energy.slice(0, 50)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="predicted_carbon" 
                      fontSize={12}
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                      label={{ value: 'Carbon Emissions (kg CO₂e)', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      dataKey="energyConsumed"
                      fontSize={12}
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                      label={{ value: 'Energy (MJ)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="energyConsumed"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-8"
        >
          <Card className="card-eco">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                {currentResult.mlData ? 'ML-Generated Recommendations' : 'AI-Generated Recommendations'}
              </CardTitle>
              <CardDescription>
                {currentResult.mlData ? 'Data-driven optimization opportunities from machine learning analysis' : 'Optimization opportunities to improve sustainability'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations.map((recommendation, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg"
                  >
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <p className="text-foreground">{recommendation}</p>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-wrap gap-4 justify-center"
        >
          <Button
            size="lg"
            onClick={() => navigate("/compare")}
            className="bg-eco-gradient"
          >
            Compare Scenarios
            <BarChart3 className="ml-2 h-5 w-5" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={async () => {
              try {
                console.log('Generating PDF report for:', currentResult.name);
                
                // Try backend first, then fallback to client-side generation
                let blob;
                try {
                  let resultId = currentResult._id || currentResult.id;
                  if (!resultId || !resultId.match(/^[0-9a-fA-F]{24}$/)) {
                    const latestResult = await lcaAPI.getResults();
                    if (latestResult.length > 0) {
                      resultId = latestResult[0]._id;
                    }
                  }
                  
                  if (resultId) {
                    const report = await lcaAPI.generateReport(resultId);
                    blob = await lcaAPI.downloadReport(report.reportId);
                  } else {
                    throw new Error('No backend result ID');
                  }
                } catch (backendError) {
                  console.log('Using client-side PDF generation');
                  blob = await lcaAPI.generateClientPDF(currentResult);
                }
                
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${currentResult.name.replace(/[^a-zA-Z0-9]/g, '_')}_Report.pdf`;
                a.click();
                window.URL.revokeObjectURL(url);
                
                console.log('✅ PDF report downloaded successfully');
              } catch (error) {
                console.error('Report generation failed:', error);
                alert('Report generation failed. Please try again.');
              }
            }}
          >
            Generate Report
            <Download className="ml-2 h-5 w-5" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate("/input")}
          >
            New Analysis
            <RefreshCw className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>
        {/* Process Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mt-8"
        >
          <Card className="card-eco">
            <CardHeader>
              <CardTitle>Process Configuration Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <h4 className="font-medium text-foreground">
                    {currentResult.mlData ? 'ML Analysis Summary' : 'Material & Route'}
                  </h4>
                  <div className="text-sm space-y-1">
                    {currentResult.mlData ? (
                      <>
                        <div>Total Rows: {currentResult.mlData.summaryStats?.total_rows || 0}</div>
                        <div>Avg Circularity: {(currentResult.mlData.summaryStats?.avg_circularity || 0).toFixed(1)}%</div>
                        <div>Total Concentrate: {(currentResult.mlData.summaryStats?.total_concentrate_mass || 0).toFixed(0)} kg</div>
                      </>
                    ) : (
                      <>
                        <div>Type: {input.materialType}</div>
                        <div>Route: {input.route}</div>
                        {input.route === "mixed" && (
                          <div>Recycled: {input.recycledPercentage}%</div>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-foreground">Energy Inputs</h4>
                  <div className="text-sm space-y-1">
                    <div>Electricity: {input.electricityKwh} kWh</div>
                    <div>Fuel Type: {input.fuelType}</div>
                    <div>Fuel Energy: {input.fuelMj} MJ</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-foreground">
                    Transportation
                  </h4>
                  <div className="text-sm space-y-1">
                    <div>Distance: {input.transportDistance} km</div>
                    <div>Mode: {input.transportMode}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
export default Results;
