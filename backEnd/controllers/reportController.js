const ReportData = require('../models/ReportData');
const ResultData = require('../models/ResultData');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

exports.generateReport = async (req, res) => {
  try {
    const { resultId } = req.body;
    
    if (!resultId) {
      return res.status(400).json({ message: 'Result ID is required' });
    }
    
    console.log('Generating report for resultId:', resultId);
    
    // Validate ObjectId format
    if (!resultId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid result ID format' });
    }
    
    // Fetch result data from MongoDB
    const result = await ResultData.findById(resultId);
    if (!result) {
      return res.status(404).json({ message: 'Result not found' });
    }
    
    // Create report data
    const reportData = {
      resultId: result._id,
      title: `LCA Report - ${result.name}`,
      summary: {
        carbonEmissions: result.carbonEmissions,
        energyConsumed: result.energyConsumed,
        waterUse: result.waterUse,
        circularityPercent: result.circularityPercent
      },
      recommendations: result.recommendations,
      input: result.input
    };
    
    // Generate PDF
    const pdfPath = await generatePDF(reportData);
    reportData.pdfPath = pdfPath;
    
    // Save report to MongoDB
    const savedReport = new ReportData(reportData);
    await savedReport.save();
    
    res.json({
      reportId: savedReport._id,
      title: savedReport.title,
      generatedAt: savedReport.generatedAt,
      pdfPath: savedReport.pdfPath,
      downloadUrl: `/api/report/download/${savedReport._id}`
    });
    
  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({ message: 'Report generation failed', error: error.message });
  }
};

exports.downloadReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    
    const report = await ReportData.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    const pdfPath = path.join(__dirname, '..', report.pdfPath);
    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ message: 'PDF file not found' });
    }
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${report.title}.pdf"`);
    
    const fileStream = fs.createReadStream(pdfPath);
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ message: 'Download failed', error: error.message });
  }
};

exports.getAllReports = async (req, res) => {
  try {
    const reports = await ReportData.find().sort({ createdAt: -1 }).populate('resultId');
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

async function generatePDF(reportData) {
  return new Promise((resolve, reject) => {
    try {
      // Create reports directory if it doesn't exist
      const reportsDir = path.join(__dirname, '..', 'reports');
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }
      
      const fileName = `report_${Date.now()}.pdf`;
      const filePath = path.join(reportsDir, fileName);
      
      const doc = new PDFDocument();
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);
      
      // Header
      doc.fontSize(20).text(reportData.title, 50, 50);
      doc.fontSize(12).text(`Generated: ${new Date().toLocaleDateString()}`, 50, 80);
      
      // Summary Section
      doc.fontSize(16).text('Executive Summary', 50, 120);
      doc.fontSize(12)
         .text(`Carbon Emissions: ${reportData.summary.carbonEmissions} kg CO₂e`, 50, 150)
         .text(`Energy Consumed: ${reportData.summary.energyConsumed} MJ`, 50, 170)
         .text(`Water Use: ${reportData.summary.waterUse} L`, 50, 190)
         .text(`Circularity Index: ${reportData.summary.circularityPercent}%`, 50, 210);
      
      // Input Details
      doc.fontSize(16).text('Process Configuration', 50, 250);
      doc.fontSize(12)
         .text(`Material Type: ${reportData.input.materialType}`, 50, 280)
         .text(`Electricity: ${reportData.input.electricityKwh} kWh`, 50, 300)
         .text(`Fuel Type: ${reportData.input.fuelType}`, 50, 320)
         .text(`Fuel Energy: ${reportData.input.fuelMj} MJ`, 50, 340)
         .text(`Transport Distance: ${reportData.input.transportDistance} km`, 50, 360)
         .text(`Transport Mode: ${reportData.input.transportMode}`, 50, 380);
      
      // Recommendations
      doc.fontSize(16).text('Recommendations', 50, 420);
      let yPos = 450;
      reportData.recommendations.forEach((rec, index) => {
        doc.fontSize(12).text(`${index + 1}. ${rec}`, 50, yPos);
        yPos += 20;
      });
      
      doc.end();
      
      stream.on('finish', () => {
        resolve(`reports/${fileName}`);
      });
      
      stream.on('error', reject);
      
    } catch (error) {
      reject(error);
    }
  });
}