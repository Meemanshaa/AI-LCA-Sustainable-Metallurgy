const { spawn } = require('child_process');
const path = require('path');

const processCsvData = async (req, res) => {
  try {
    const { data } = req.body;
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid CSV data provided'
      });
    }

    // Call Python ML service
    const pythonScript = path.join(__dirname, '..', 'ml', 'csv_ml_service.py');
    const pythonProcess = spawn('python', [pythonScript, JSON.stringify(data)]);

    let result = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('Python script error:', error);
        return res.status(500).json({
          success: false,
          error: 'ML processing failed: ' + (error || 'Python script exited with code ' + code),
          details: error
        });
      }

      try {
        console.log('Raw Python output:', result);
        const mlResult = JSON.parse(result);
        
        if (!mlResult.success) {
          console.error('ML processing failed:', mlResult);
          return res.status(500).json(mlResult);
        }

        res.json({
          success: true,
          message: 'CSV data processed successfully',
          ...mlResult
        });

      } catch (parseError) {
        console.error('Failed to parse ML result:', parseError);
        console.error('Raw result was:', result);
        res.status(500).json({
          success: false,
          error: 'Failed to parse ML results: ' + parseError.message,
          rawOutput: result
        });
      }
    });

  } catch (error) {
    console.error('CSV processing error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};

module.exports = {
  processCsvData
};