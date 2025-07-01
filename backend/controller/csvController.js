const axios = require("axios");
const https = require("https");
const fs = require("fs");
const path = require("path");
const { parseCsvFile } = require("../utils/csvParser");

// Force IPv4 agent
const agent = new https.Agent({ family: 4 });

exports.uploadCsvAndFetchScores = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "CSV file is required" });
  }

  const filePath = path.resolve(req.file.path);

  try {
    // Parse CSV file for addresses
    const addresses = await parseCsvFile(filePath);

    // Delete temp uploaded file
    fs.unlinkSync(filePath);

    if (!addresses.length) {
      return res.status(400).json({ error: "No addresses found in CSV" });
    }

    // Reuse your bulk fetch logic for scores
    const results = [];
    for (const address of addresses) {
      try {
        const scoreRes = await axios.get(
          `https://api.ethos.network/api/v2/score/address?address=${address}`,
          {
            httpsAgent: agent,
            headers: {
              "X-Ethos-Client": "ethos-trust-checker-app@1.0.0",
            },
          }
        );

        results.push({
          address,
          score: scoreRes.data?.score ?? null,
          level: scoreRes.data?.level ?? null,
        });
      } catch (err) {
        console.warn(`❌ Failed to fetch score for ${address}:`, err.message);
        results.push({
          address,
          score: null,
          level: null,
          error: "Failed to fetch score",
        });
      }
    }

    res.json({ results });
  } catch (err) {
    console.error("Error processing CSV:", err);
    res.status(500).json({ error: "Failed to process CSV" });
  }
};
