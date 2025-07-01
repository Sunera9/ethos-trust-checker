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
const PORT = 4000;



app.use(cors());
app.use(express.json());

// Register routes
app.use("/api", userRoutes);
app.use("/api", csvRoutes);

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
