import React, { useState } from "react";
import * as XLSX from "xlsx";
import axios from "axios";

export default function App() {
  const [wallets, setWallets] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const workbook = XLSX.read(bstr, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Assume your Excel has a column named 'WalletAddress' (case-sensitive)
      const extractedWallets = jsonData
        .map((row) => row.WalletAddress)
        .filter((addr) => addr && addr.startsWith("0x"));

      setWallets(extractedWallets);
      setResults([]);
    };
    reader.readAsBinaryString(file);
  };

  const fetchScores = async () => {
    if (wallets.length === 0) {
      alert("No wallets to query");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:4000/api/get-scores",
        {
          wallets,
        }
      );
      setResults(response.data);
    } catch (error) {
      alert("Error fetching scores");
      console.error(error);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Ethos Trust Score Checker</h1>
      <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} />
      <button
        onClick={fetchScores}
        disabled={loading || wallets.length === 0}
        style={{ marginLeft: 10 }}
      >
        {loading ? "Loading..." : "Get Trust Scores"}
      </button>

      {results.length > 0 && (
        <table border={1} cellPadding={10} style={{ marginTop: 20 }}>
          <thead>
            <tr>
              <th>Wallet Address</th>
              <th>Ethos Trust Score</th>
            </tr>
          </thead>
          <tbody>
            {results.map(({ wallet, score }) => (
              <tr key={wallet}>
                <td>{wallet}</td>
                <td>{score !== null ? score : "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
