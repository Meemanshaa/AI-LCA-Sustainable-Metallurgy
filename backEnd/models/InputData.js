const mongoose = require('mongoose');

const InputDataSchema = new mongoose.Schema({
  materialType: { type: String, required: true },
  customMaterial: { type: String },
  route: { type: String, required: true },
  recycledPercentage: Number,
  electricityKwh: { type: Number, required: true },
  fuelType: { type: String, required: true },
  fuelMj: { type: Number, required: true },
  transportDistance: { type: Number, required: true },
  transportMode: { type: String, required: true },
  recyclePercent: Number,
  reusePercent: Number,
  landfillPercent: Number,
}, { timestamps: true });

module.exports = mongoose.model('InputData', InputDataSchema);
