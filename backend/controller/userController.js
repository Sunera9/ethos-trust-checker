const axios = require("axios");
const https = require("https");

// Force IPv4 agent
const agent = new https.Agent({ family: 4 });

exports.getUserInfo = async (req, res) => {
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
    });
  } catch (error) {
    console.error(
      "Failed to fetch user info:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Failed to fetch user data" });
  }
};
