const ResultData = require('../models/ResultData');

exports.compareScenarios = async (req, res) => {
  const { scenario1Id, scenario2Id } = req.body;

  if (!scenario1Id || !scenario2Id) {
    return res.status(400).json({ message: 'Both scenario IDs are required' });
  }

  try {
    const scenario1 = await ResultData.findById(scenario1Id);
    const scenario2 = await ResultData.findById(scenario2Id);

    if (!scenario1 || !scenario2) {
      return res.status(404).json({ message: 'One or both scenarios not found' });
    }

    const comparisonData = {
      scenario1,
      scenario2,
      metrics: [
        { metric: 'Carbon Emissions', scenario1: scenario1.carbonEmissions, scenario2: scenario2.carbonEmissions, unit: 'kg CO₂e' },
        { metric: 'Energy Consumption', scenario1: scenario1.energyConsumed, scenario2: scenario2.energyConsumed, unit: 'MJ' },
        { metric: 'Water Usage', scenario1: scenario1.waterUse, scenario2: scenario2.waterUse, unit: 'L' },
        { metric: 'Circularity', scenario1: scenario1.circularityPercent, scenario2: scenario2.circularityPercent, unit: '%' },
      ],
    };

    res.json(comparisonData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
