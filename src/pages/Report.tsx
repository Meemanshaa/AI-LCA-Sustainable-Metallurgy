import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Download, 
  AlertTriangle, 
  Leaf, 
  Zap, 
  Droplets, 
  Recycle,
  Lightbulb,
  TrendingUp,
  Factory,
  ArrowRight
} from 'lucide-react';

const Report = () => {
  const navigate = useNavigate();
  const { currentResult } = useStore();
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate AI recommendations based on material and results
  const generateAIRecommendations = (result: any) => {
    const { input, carbonEmissions, energyConsumed, waterUse, circularityPercent } = result;
    const material = input.materialType;
    
    const recommendations = {
      'Bauxite': [
        'Implement closed-loop recycling systems - Bauxite has 95% recyclability potential',
        'Switch to renewable energy sources to reduce the high energy intensity (15.2 kWh/kg)',
        'Optimize smelting processes using advanced electrolysis technology',
        'Establish regional processing centers to reduce transport emissions by 40%'
      ],
      'Copper': [
        'Increase scrap copper utilization - saves 85% energy compared to virgin production',
        'Implement hydrometallurgical processes to reduce water consumption',
        'Use bioleaching techniques for low-grade ores to minimize environmental impact',
        'Establish urban mining programs to recover copper from electronic waste'
      ],
      'Gold': [
        'Adopt mercury-free extraction methods to reduce toxicity',
        'Implement cyanide-free processing using thiosulfate or chloride solutions',
        'Maximize recycling from electronic waste - gold is 100% recyclable',
        'Use renewable energy for high-intensity processing (245.8 kWh/kg)'
      ],
      'Iron Ore': [
        'Increase use of direct reduced iron (DRI) technology',
        'Implement hydrogen-based steel production to eliminate coal dependency',
        'Maximize steel scrap recycling - reduces emissions by 75%',
        'Optimize pelletizing processes to improve energy efficiency'
      ],
      'Zinc': [
        'Implement Imperial Smelting Process for better energy efficiency',
        'Increase secondary zinc production from galvanized steel scrap',
        'Use solvent extraction techniques to reduce processing waste',
        'Establish zinc recovery from industrial dust and residues'
      ]
    };
    
    const materialRecs = recommendations[material as keyof typeof recommendations] || [
      'Increase recycled content to reduce virgin material demand',
      'Optimize energy sources by switching to renewable alternatives',
      'Implement circular economy principles in material flow',
      'Establish local supply chains to minimize transportation impact'
    ];
    
    // Add performance-based recommendations
    const performanceRecs = [];
    if (carbonEmissions > 1000) performanceRecs.push('Priority: Reduce carbon emissions through process optimization');
    if (energyConsumed > 2000) performanceRecs.push('Focus on energy efficiency improvements and renewable energy adoption');
    if (waterUse > 5000) performanceRecs.push('Implement water recycling and closed-loop systems');
    if (circularityPercent < 50) performanceRecs.push('Increase end-of-life material recovery and recycling rates');
    
    return [...performanceRecs, ...materialRecs];
  };

  if (!currentResult) {
    return (
      <div className="min-h-screen bg-subtle-gradient flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-warning mx-auto" />
          <h2 className="text-2xl font-bold text-foreground">No Report Data</h2>
          <p className="text-muted-foreground">
            Please run an analysis first to generate a report.
          </p>
          <Button onClick={() => navigate('/input')}>
            Start Analysis
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  const aiRecommendations = generateAIRecommendations(currentResult);

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF();
      let yPos = 30;
      
      // Header
      pdf.setFontSize(20);
      pdf.text('LCA Analysis Report', 20, yPos);
      yPos += 15;
      
      pdf.setFontSize(12);
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, yPos);
      yPos += 20;
      
      // Analysis Summary
      pdf.setFontSize(16);
      pdf.text('Analysis Summary', 20, yPos);
      yPos += 10;
      
      pdf.setFontSize(11);
      pdf.text(`Material: ${currentResult.input.materialType}`, 25, yPos); yPos += 8;
      pdf.text(`Route: ${currentResult.input.route}`, 25, yPos); yPos += 8;
      pdf.text(`Carbon Emissions: ${currentResult.carbonEmissions} kg CO₂e`, 25, yPos); yPos += 8;
      pdf.text(`Energy Consumed: ${currentResult.energyConsumed} MJ`, 25, yPos); yPos += 8;
      pdf.text(`Water Use: ${currentResult.waterUse} L`, 25, yPos); yPos += 8;
      pdf.text(`Circularity: ${currentResult.circularityPercent}%`, 25, yPos); yPos += 15;
      
      // AI Recommendations
      pdf.setFontSize(16);
      pdf.text('AI Optimization Recommendations', 20, yPos);
      yPos += 10;
      
      pdf.setFontSize(10);
      aiRecommendations.forEach((rec, index) => {
        const lines = pdf.splitTextToSize(`${index + 1}. ${rec}`, 170);
        lines.forEach((line: string) => {
          pdf.text(line, 25, yPos);
          yPos += 6;
        });
        yPos += 2;
      });
      
      pdf.save(`LCA_Report_${currentResult.input.materialType}_${new Date().toISOString().split('T')[0]}.pdf`);
      alert('Report generated successfully!');
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('PDF generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const { input, carbonEmissions, energyConsumed, waterUse, circularityPercent } = currentResult;

  return (
    <div className="min-h-screen bg-subtle-gradient py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{currentResult.name}</h1>
            <p className="text-muted-foreground">Detailed LCA Analysis Report</p>
          </div>
          <Button onClick={generatePDF} disabled={isGenerating} className="bg-eco-gradient">
            {isGenerating ? 'Generating...' : 'Download PDF'}
            <Download className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {/* Analysis Overview */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Card className="card-eco">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Factory className="h-5 w-5" />
                Analysis Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Material Information</h4>
                  <div className="space-y-1 text-sm">
                    <div>Type: <Badge variant="secondary">{input.materialType}</Badge></div>
                    <div>Route: <Badge variant="outline">{input.route}</Badge></div>
                    <div>Date: {new Date(currentResult.timestamp).toLocaleDateString()}</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Energy Inputs</h4>
                  <div className="space-y-1 text-sm">
                    <div>Electricity: {input.electricityKwh} kWh</div>
                    <div>Fuel: {input.fuelType}</div>
                    <div>Fuel Energy: {input.fuelMj} MJ</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Transportation</h4>
                  <div className="space-y-1 text-sm">
                    <div>Mode: {input.transportMode}</div>
                    <div>Distance: {input.transportDistance} km</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Environmental Impact Metrics */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
          <Card className="card-eco">
            <CardHeader>
              <CardTitle>Environmental Impact Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <Leaf className="h-8 w-8 text-success mx-auto mb-2" />
                  <div className="text-2xl font-bold">{carbonEmissions}</div>
                  <div className="text-sm text-muted-foreground">kg CO₂e</div>
                  <div className="text-xs font-medium">Carbon Footprint</div>
                </div>
                <div className="text-center">
                  <Zap className="h-8 w-8 text-warning mx-auto mb-2" />
                  <div className="text-2xl font-bold">{energyConsumed}</div>
                  <div className="text-sm text-muted-foreground">MJ</div>
                  <div className="text-xs font-medium">Energy Consumed</div>
                </div>
                <div className="text-center">
                  <Droplets className="h-8 w-8 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold">{waterUse}</div>
                  <div className="text-sm text-muted-foreground">L</div>
                  <div className="text-xs font-medium">Water Usage</div>
                </div>
                <div className="text-center">
                  <Recycle className="h-8 w-8 text-accent mx-auto mb-2" />
                  <div className="text-2xl font-bold">{circularityPercent}%</div>
                  <div className="text-sm text-muted-foreground">Index</div>
                  <div className="text-xs font-medium">Circularity</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* AI Recommendations */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-8">
          <Card className="card-eco">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-warning" />
                AI Optimization Recommendations
              </CardTitle>
              <CardDescription>
                Intelligent suggestions to improve sustainability and metal utilization for {input.materialType}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {aiRecommendations.map((recommendation, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg border-l-4 border-primary"
                  >
                    <TrendingUp className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-foreground font-medium">{recommendation}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex gap-4 justify-center">
          <Button onClick={() => navigate('/compare')} variant="outline" size="lg">
            Compare Scenarios
          </Button>
          <Button onClick={() => navigate('/input')} size="lg">
            New Analysis
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default Report;
