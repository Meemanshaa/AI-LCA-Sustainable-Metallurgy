const { spawn } = require('child_process');
const path = require('path');
const ResultData = require('../models/ResultData');

function calculateFallbackLCA(inputData) {
  const elec = parseFloat(inputData.electricityKwh || 0);
  const fuel = parseFloat(inputData.fuelMj || 0);
  const transport = parseFloat(inputData.transportDistance || 0);
  const recycle = parseFloat(inputData.recyclePercent || 0);
  const reuse = parseFloat(inputData.reusePercent || 0);
  
  const carbonEmissions = Math.round(elec * 0.5 + fuel * 0.07 + transport * 0.2);
  const energyConsumed = Math.round(elec * 3.6 + fuel);
  const waterUse = Math.round(elec * 0.5 + fuel * 0.1);
  const circularityPercent = Math.round(Math.min(100, recycle * 0.7 + reuse * 0.5));
  
  const recommendations = [];
  if (recycle < 50) recommendations.push("Increase recycled content to lower emissions");
  if (transport > 200) recommendations.push("Optimize transport routes or modes");
  if (elec > 1000) recommendations.push("Investigate renewable electricity or efficiency");
  
  return { carbonEmissions, energyConsumed, waterUse, circularityPercent, recommendations };
}

exports.analyzeLCA = async (req, res) => {
  try {
    const inputData = req.body;
    
    // Call Python ML service
    const mlResult = await callMLService(inputData);
    
    // Create result object
    const resultData = {
      input: inputData,
      name: `${inputData.materialType} LCA Analysis`,
      carbonEmissions: mlResult.carbonEmissions,
      energyConsumed: mlResult.energyConsumed,
      waterUse: mlResult.waterUse,
      circularityPercent: mlResult.circularityPercent,
      recommendations: mlResult.recommendations,
      timestamp: new Date()
    };
    
    // Save to database
    const savedResult = new ResultData(resultData);
    await savedResult.save();
    
    res.status(201).json(savedResult);
    
  } catch (error) {
    console.error('Analysis error:', error);
    
    // Fallback calculation if ML fails
    try {
      const fallbackResult = calculateFallbackLCA(inputData);
      const resultData = {
        input: inputData,
        name: `${inputData.materialType} LCA Analysis (Fallback)`,
        ...fallbackResult,
        timestamp: new Date()
      };
      
      const savedResult = new ResultData(resultData);
      await savedResult.save();
      
      res.status(201).json(savedResult);
    } catch (fallbackError) {
      res.status(500).json({ message: 'Analysis failed', error: error.message });
    }
  }
};

function callMLService(inputData) {
  return new Promise((resolve, reject) => {
    const pythonPath = 'python';
    const scriptPath = path.join(__dirname, '../ml/ml_predict.py');
    
    const pythonProcess = spawn(pythonPath, [scriptPath]);
    
    let result = '';
    let error = '';
    
    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          const cleanResult = result.trim();
          console.log('Raw Python output:', cleanResult);
          const mlResult = JSON.parse(cleanResult);
          resolve(mlResult);
        } catch (parseError) {
          console.error('Parse error - Raw result:', result);
          console.error('Parse error - Trimmed result:', result.trim());
          reject(new Error(`Failed to parse ML result: ${parseError.message}. Raw output: ${result.substring(0, 100)}`));
        }
      } else {
        reject(new Error(`Python process failed with code ${code}: ${error}`));
      }
    });
    
    // Send input data to Python process
    pythonProcess.stdin.write(JSON.stringify(inputData));
    pythonProcess.stdin.end();
  });
}