const fs = require("fs");
const csv = require("csv-parser");
const path = require("path");

function parseCsvFile(filePath) {
  return new Promise((resolve, reject) => {
    const addresses = [];

    fs.createReadStream(path.resolve(filePath))
      .pipe(csv())
      .on("data", (row) => {
        if (row.address) addresses.push(row.address.trim());
      })
      .on("end", () => {
        resolve(addresses);
      })
      .on("error", (err) => {
        reject(err);
      });
  });
}

module.exports = { parseCsvFile };
