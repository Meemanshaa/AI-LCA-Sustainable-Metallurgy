const mongoose = require('mongoose');

const ResultDataSchema = new mongoose.Schema({
  input: {
    materialType: String,
    customMaterial: String,
    route: String,
    recycledPercentage: Number,
    electricityKwh: Number,
    fuelType: String,
    fuelMj: Number,
    transportDistance: Number,
    transportMode: String,
    recyclePercent: Number,
    reusePercent: Number,
    landfillPercent: Number,
  },
  carbonEmissions: Number,
  energyConsumed: Number,
  waterUse: Number,
  circularityPercent: Number,
  recommendations: [String],
  name: String,
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('ResultData', ResultDataSchema);
