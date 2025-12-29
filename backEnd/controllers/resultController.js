const ResultData = require('../models/ResultData');

exports.createResult = async (req, res) => {
  try {
    const resultData = new ResultData(req.body);
    const savedResult = await resultData.save();
    res.status(201).json(savedResult);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getAllResults = async (req, res) => {
  try {
    const results = await ResultData.find().sort({ createdAt: -1 });
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getResultById = async (req, res) => {
  try {
    const result = await ResultData.findById(req.params.id);
    if (!result) return res.status(404).json({ message: 'Result not found' });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getLatestResult = async (req, res) => {
  try {
    const result = await ResultData.findOne().sort({ createdAt: -1 });
    if (!result) return res.status(404).json({ message: 'No results found' });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};





// import Result from "../models/Result.js";
// import { calculateLCA } from "../utils/calculator.js";
// import { v4 as uuidv4 } from "uuid";

// /**
//  * POST /api/analyze
//  * Protected - saves result for the logged-in user
//  */
// export const analyzeData = async (req, res) => {
//   try {
//     const input = req.body;
//     // simple LCA calculation
//     const calc = calculateLCA(input);

//     const doc = await Result.create({
//       user: req.user._id,
//       name: input.name || `Analysis ${new Date().toLocaleString()}`,
//       input,
//       carbonEmissions: calc.carbonEmissions,
//       energyConsumed: calc.energyConsumed,
//       waterUse: calc.waterUse,
//       circularityPercent: calc.circularityPercent,
//       recommendations: calc.recommendations,
//     });

//     res.json(doc);
//   } catch (error) {
//     console.error("analyzeData error:", error.message);
//     res.status(500).json({ message: "Analysis failed" });
//   }
// };

// /**
//  * POST /api/ai-assist
//  * Protected - return dummy AI suggestions (fills missing fields)
//  */
// export const aiAssist = async (req, res) => {
//   try {
//     const input = req.body || {};
//     // Provide simple heuristics
//     const suggestions = {
//       electricityKwh: input.electricityKwh || 1200,
//       fuelType: input.fuelType || "Natural Gas",
//       fuelMj: input.fuelMj || 800,
//       transportMode: input.transportMode || "Truck",
//     };
//     res.json(suggestions);
//   } catch (error) {
//     console.error("aiAssist error:", error.message);
//     res.status(500).json({ message: "AI assist failed" });
//   }
// };

// /**
//  * GET /api/results
//  * Protected - return user's saved results
//  */
// export const getResults = async (req, res) => {
//   try {
//     const results = await Result.find({ user: req.user._id }).sort({ createdAt: -1 });
//     res.json(results);
//   } catch (error) {
//     console.error("getResults error:", error.message);
//     res.status(500).json({ message: "Failed to fetch results" });
//   }
// };

// /**
//  * POST /api/compare
//  * Protected - compare current input vs a 'virgin' baseline or multiple saved results
//  * Accepts body: { mode: "baseline" | "ids", ids: [] } 
//  * If mode === "baseline" -> returns a cheap virgin comparison computed in controller
//  * If mode === "ids" -> fetches result docs for given ids and returns them for frontend to plot
//  */
// export const compareResults = async (req, res) => {
//   try {
//     const { mode = "baseline", ids = [], input } = req.body;

//     if (mode === "ids") {
//       if (!Array.isArray(ids) || ids.length === 0) {
//         return res.status(400).json({ message: "Provide result ids to compare" });
//       }
//       const docs = await Result.find({ user: req.user._id, _id: { $in: ids } });
//       return res.json({ mode: "ids", data: docs });
//     }

//     // baseline compare using input (or most recent result)
//     const sourceInput = input || (await Result.findOne({ user: req.user._id }).sort({ createdAt: -1 })).input;
//     const current = calculateLCA(sourceInput || {});
//     // create a synthetic 'virgin' scenario (higher emissions)
//     const virginInput = { ...sourceInput, recycledPercentage: 0, recyclePercent: 0, reusePercent: 0 };
//     const virgin = calculateLCA(virginInput);

//     res.json({
//       mode: "baseline",
//       current,
//       virgin,
//     });
//   } catch (error) {
//     console.error("compareResults error:", error.message);
//     res.status(500).json({ message: "Compare failed" });
//   }
// };

// /**
//  * POST /api/report
//  * Protected - generate a simple report summary (dummy). Returns a JSON report object.
//  * Accepts body: { resultId } or { input } to generate report from new input
//  */
// export const generateReport = async (req, res) => {
//   try {
//     const { resultId, input } = req.body;
//     let doc;
//     if (resultId) {
//       doc = await Result.findOne({ user: req.user._id, _id: resultId });
//     } else if (input) {
//       const calc = calculateLCA(input);
//       doc = {
//         name: input.name || `Report ${new Date().toLocaleString()}`,
//         input,
//         carbonEmissions: calc.carbonEmissions,
//         energyConsumed: calc.energyConsumed,
//         waterUse: calc.waterUse,
//         circularityPercent: calc.circularityPercent,
//         recommendations: calc.recommendations,
//         createdAt: new Date().toISOString(),
//       };
//     } else {
//       return res.status(400).json({ message: "Provide resultId or input to generate report" });
//     }

//     // Create a simple report summary (you can replace with PDF generation)
//     const report = {
//       id: uuidv4(),
//       title: `LCA Report - ${doc.name}`,
//       generatedAt: new Date().toISOString(),
//       summary: {
//         carbonEmissions: doc.carbonEmissions,
//         energyConsumed: doc.energyConsumed,
//         waterUse: doc.waterUse,
//         circularityPercent: doc.circularityPercent,
//       },
//       recommendations: doc.recommendations || [],
//     };

//     // In future: save report or return URL to downloadable PDF
//     res.json(report);
//   } catch (error) {
//     console.error("generateReport error:", error.message);
//     res.status(500).json({ message: "Report generation failed" });
//   }
// };
