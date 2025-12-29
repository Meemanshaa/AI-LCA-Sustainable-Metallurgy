const InputData = require('../models/InputData');

exports.createInput = async (req, res) => {
  try {
    const inputData = new InputData(req.body);
    const savedInput = await inputData.save();
    res.status(201).json(savedInput);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getAllInputs = async (req, res) => {
  try {
    const inputs = await InputData.find().sort({ createdAt: -1 });
    res.json(inputs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
