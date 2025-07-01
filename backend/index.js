const express = require("express");
const axios = require("axios");
const cors = require("cors");
const https = require("https");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { parseCsvFile } = require("./csvParser");

const app = express();
const PORT = 4000;

// Force IPv4 agent to avoid ECONNREFUSED IPv6 issues
const agent = new https.Agent({ family: 4 });

app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

// 🔍 Fetch full user info for a single address
app.post("/api/get-user-info", async (req, res) => {
  const { address } = req.body;

  if (!address || typeof address !== "string") {
    return res.status(400).json({ error: "Address is required" });
  }

  try {
    const addressRes = await axios.get(
      `https://api.ethos.network/api/v1/addresses/address:${address}`,
      {
        httpsAgent: agent,
        headers: {
          "X-Ethos-Client": "ethos-trust-checker-app@1.0.0",
        },
      }
    );

    const { profileId, primaryAddress, allAddresses } = addressRes.data.data;

    if (!profileId) {
      return res.status(404).json({ error: "No Ethos profile found" });
    }

    let userData = null;
    let statsData = null;
    let scoreData = null;

    try {
      const userRes = await axios.get(
        `https://api.ethos.network/api/v2/users/profileId:${profileId}`,
        {
          httpsAgent: agent,
          headers: {
            "X-Ethos-Client": "ethos-trust-checker-app@1.0.0",
          },
        }
      );
      userData = userRes.data;
    } catch (err) {
      console.warn("⚠️ User profile not public or doesn't exist.");
    }

    try {
      const statsRes = await axios.get(
        `https://api.ethos.network/api/v1/users/profileId:${profileId}/stats`,
        {
          httpsAgent: agent,
          headers: {
            "X-Ethos-Client": "ethos-trust-checker-app@1.0.0",
          },
        }
      );
      statsData = statsRes.data.data;
    } catch (err) {
      console.warn("⚠️ Could not fetch stats:", err.message);
    }

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
      scoreData = scoreRes.data;
    } catch (err) {
      console.warn("⚠️ Could not fetch score:", err.message);
    }

    res.json({
      profileId,
      primaryAddress,
      allAddresses,
      user: userData,
      stats: statsData,
      score: scoreData?.score ?? null,
      level: scoreData?.level ?? null,
    });why
  } catch (error) {
    console.error("❌ Failed to fetch user info:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch user data" });
  }
});

// Route for CSV upload
app.post("/api/upload-csv", upload.single("file"), async (req, res) => {
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
});

app.listen(PORT, () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`);
});