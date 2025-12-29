const { calculateLCA } = require("../utils/calculator");
const ResultData = require("../models/ResultData");
const { spawn } = require('child_process');
const path = require('path');

exports.runLCA = async (req, res, next) => {
  try {
    const input = req.body;
    if (!input) return res.status(400).json({ message: "Input data is required" });

    // Run calculator
    const lcaResult = calculateLCA(input);

    const result = new ResultData({
      input,
      ...lcaResult,
      name: `${input.materialType} LCA Analysis`,
    });

    await result.save();
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

exports.smartFill = async (req, res, next) => {
  try {
    const input = req.body;
    
    // Try Python ML service first, fallback to Node.js if Python fails
    try {
      const result = await callPythonMLService('smart_fill', input);
      res.json(result);
    } catch (pythonError) {
      console.log('Python ML service unavailable, using fallback:', pythonError.message);
      
      // Fallback to Node.js implementation
      const aiService = require("../ml/aiService");
      const result = aiService.processSmartFill(input);
      res.json(result);
    }
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      error: 'AI service error: ' + err.message 
    });
  }
};

// Helper function to call Python ML service
function callPythonMLService(requestType, inputData) {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, '../ml/ai_prediction_service.py');
    const pythonProcess = spawn('python', [pythonScript, JSON.stringify(inputData)]);
    
    let output = '';
    let errorOutput = '';
    
    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(output);
          resolve(result);
        } catch (parseError) {
          reject(new Error('Failed to parse Python output'));
        }
      } else {
        reject(new Error('Python service unavailable'));
      }
    });
    
    pythonProcess.on('error', (error) => {
      reject(new Error('Python not found'));
    });
  });
}
