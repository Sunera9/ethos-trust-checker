const express = require("express");
const axios = require("axios");
const cors = require("cors");
const https = require("https");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const { parseCsvFile } = require("./utils/csvParser");

const userRoutes = require("./routes/userRoute");
const csvRoutes = require("./routes/csvRoute");

const app = express();


const PORT = process.env.PORT || 3000;


app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL,
      /\.vercel\.app$/,
      "http://localhost:3000",
    ],
    credentials: true,
  })
);

app.use(express.json());

// Simple test route
app.get("/", (req, res) => {
  res.status(200).send("Backend is working!");
});


// Register routes
app.use("/api", userRoutes);
app.use("/api", csvRoutes);

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
