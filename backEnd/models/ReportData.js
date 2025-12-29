const mongoose = require('mongoose');

const ReportDataSchema = new mongoose.Schema({
  resultId: { type: mongoose.Schema.Types.ObjectId, ref: 'ResultData', required: true },
  title: { type: String, required: true },
  generatedAt: { type: Date, default: Date.now },
  summary: {
    carbonEmissions: Number,
    energyConsumed: Number,
    waterUse: Number,
    circularityPercent: Number
  },
  recommendations: [String],
  input: {
    materialType: String,
    electricityKwh: Number,
    fuelType: String,
    fuelMj: Number,
    transportDistance: Number,
    transportMode: String,
    recyclePercent: Number,
    reusePercent: Number,
    landfillPercent: Number
  },
  pdfPath: String
}, { timestamps: true });

module.exports = mongoose.model('ReportData', ReportDataSchema);