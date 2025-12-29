// routes/lca.js
import express from "express";
import fs from "fs";
import path from "path";
import Papa from "papaparse"; // or csv-parser

const router = express.Router();

router.get("/lca-results", (req, res) => {
  const filePath = path.join(process.cwd(), "ml/lca_analysis_results.csv");
  const csvData = fs.readFileSync(filePath, "utf8");
  const parsed = Papa.parse(csvData, { header: true }).data;
  res.json(parsed);
});

export default router;
