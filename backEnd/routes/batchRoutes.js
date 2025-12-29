const express = require('express');
const { spawn } = require('child_process');
const path = require('path');

const router = express.Router();

// Load reference dataset for material averages
const loadMaterialAverages = () => {
  try {
    const csvPath = path.join(process.cwd(), 'ml/mining_material_dataset_1000.csv');
    if (!fs.existsSync(csvPath)) return {};
    
    const csvData = fs.readFileSync(csvPath, 'utf8');
    const parsed = require('papaparse').parse(csvData, { header: true, skipEmptyLines: true });
    
    const materialStats = {};
    parsed.data.forEach(row => {
      if (!row.MaterialType) return;
      if (!materialStats[row.MaterialType]) {
        materialStats[row.MaterialType] = { recycle: [], reuse: [], landfill: [] };
      }
      if (row.RecyclePercent) materialStats[row.MaterialType].recycle.push(parseFloat(row.RecyclePercent));
      if (row.ReusePercent) materialStats[row.MaterialType].reuse.push(parseFloat(row.ReusePercent));
      if (row.LandfillPercent) materialStats[row.MaterialType].landfill.push(parseFloat(row.LandfillPercent));
    });
    
    // Calculate averages
    const averages = {};
    Object.keys(materialStats).forEach(material => {
      const stats = materialStats[material];
      averages[material] = {
        recyclePercent: stats.recycle.length > 0 ? Math.round(stats.recycle.reduce((a, b) => a + b, 0) / stats.recycle.length) : 30,
        reusePercent: stats.reuse.length > 0 ? Math.round(stats.reuse.reduce((a, b) => a + b, 0) / stats.reuse.length) : 20,
        landfillPercent: stats.landfill.length > 0 ? Math.round(stats.landfill.reduce((a, b) => a + b, 0) / stats.landfill.length) : 50
      };
    });
    
    return averages;
  } catch (error) {
    return {};
  }
};

// Batch analysis for CSV data
router.post('/batch', async (req, res) => {
  try {
    const { data } = req.body;
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: 'No data provided for batch analysis' });
    }

    const materialAverages = loadMaterialAverages();
    const results = [];
    
    // Process each row
    for (const row of data) {
      try {
        // Get material averages or defaults
        const materialType = row.MaterialType || 'Unknown';
        const averages = materialAverages[materialType] || { recyclePercent: 30, reusePercent: 20, landfillPercent: 50 };
        
        // Map CSV fields to analysis format
        const analysisData = {
          ElectricityConsumption_kWh: parseFloat(row.ElectricityConsumption_kWh) || 0,
          FuelEnergy_MJ: parseFloat(row.FuelEnergy_MJ) || 0,
          TransportDistance_km: 500, // Default transport distance
          RecyclePercent: averages.recyclePercent,
          ReusePercent: averages.reusePercent,
          MaterialType: materialType,
          FuelType: row.FuelType || 'Natural Gas',
          TransportMode: 'Truck' // Default transport mode
        };

        // Try ML prediction first
        let result;
        try {
          const pythonProcess = spawn('python', [
            path.join(__dirname, '../ml/ml_predict.py'),
            JSON.stringify(analysisData)
          ]);

          let output = '';
          let error = '';

          pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
          });

          pythonProcess.stderr.on('data', (data) => {
            error += data.toString();
          });

          await new Promise((resolve, reject) => {
            pythonProcess.on('close', (code) => {
              if (code === 0) {
                try {
                  result = JSON.parse(output.trim());
                  resolve(result);
                } catch (parseError) {
                  reject(new Error('Failed to parse ML output'));
                }
              } else {
                reject(new Error(`Python process failed: ${error}`));
              }
            });
          });
        } catch (mlError) {
          // Fallback calculation
          const elec = analysisData.ElectricityConsumption_kWh;
          const fuel = analysisData.FuelEnergy_MJ;
          const transport = analysisData.TransportDistance_km;
          const recycle = analysisData.RecyclePercent;
          const reuse = analysisData.ReusePercent;

          result = {
            carbonEmissions: Math.round((elec * 0.5 + fuel * 0.07 + transport * 0.2) * 100) / 100,
            energyConsumed: Math.round((elec * 3.6 + fuel) * 100) / 100,
            waterUse: Math.round((elec * 0.5 + fuel * 0.1) * 100) / 100,
            circularityPercent: Math.round(Math.min(100, recycle * 0.7 + reuse * 0.5) * 10) / 10,
            recommendations: []
          };
        }

        results.push({
          ...row,
          analysis: {
            ...result,
            recyclePercent: averages.recyclePercent,
            reusePercent: averages.reusePercent,
            landfillPercent: averages.landfillPercent
          },
          status: 'completed'
        });

      } catch (rowError) {
        results.push({
          ...row,
          analysis: null,
          status: 'failed',
          error: rowError.message
        });
      }
    }

    res.json({
      message: 'Batch analysis completed',
      totalRows: data.length,
      successfulRows: results.filter(r => r.status === 'completed').length,
      failedRows: results.filter(r => r.status === 'failed').length,
      results: results
    });

  } catch (error) {
    console.error('Batch analysis error:', error);
    res.status(500).json({ error: 'Batch analysis failed' });
  }
});

module.exports = router;