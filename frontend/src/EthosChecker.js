import React, { useState, useMemo } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Chip,
  LinearProgress,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  styled,
  ThemeProvider,
  createTheme,
  CssBaseline,
} from "@mui/material";
import {
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import Papa from "papaparse";

// Create dark theme
const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#90caf9",
    },
    secondary: {
      main: "#f48fb1",
    },
    background: {
      default: "#121212",
      paper: "#1e1e1e",
    },
    text: {
      primary: "#ffffff",
      secondary: "#aaaaaa",
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: "#2a2a2a",
          color: "#ffffff",
          fontWeight: "bold",
        },
      },
    },
  },
});

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

const CsvUploadComponent = () => {
  const [csvResults, setCsvResults] = useState([]);
  const [manualAddress, setManualAddress] = useState("");
  const [manualResult, setManualResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [scoreFilter, setScoreFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Use environment variable for backend URL
  const backendUrl =
    process.env.REACT_APP_BACKEND_URL || "http://localhost:4000";

  const handleCsvUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setLoading(true);
    setProgress(0);
    setCsvResults([]);

    Papa.parse(file, {
      header: true,
      complete: async (parsedResult) => {
        const addresses = parsedResult.data
          .map((row) => row.address)
          .filter(Boolean);

        const results = [];
        const total = addresses.length;

        for (let i = 0; i < addresses.length; i++) {
          const addr = addresses[i];
          try {
            const res = await fetch(`${backendUrl}/api/get-user-info`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ address: addr }),
            });
            const data = await res.json();
            results.push({
              address: addr,
              score: data.score ?? null,
              level: data.level ?? null,
            });
          } catch (err) {
            results.push({
              address: addr,
              score: null,
              level: null,
              error: "Fetch failed",
            });
          }

          setProgress(((i + 1) / total) * 100);
        }

        setCsvResults(results);
        setLoading(false);
      },
    });
  };

  const handleManualSearch = async () => {
    if (!manualAddress.trim()) return;
    setLoading(true);
    setManualResult(null);

    try {
      const res = await fetch(`${backendUrl}/api/get-user-info`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: manualAddress.trim() }),
      });

      const data = await res.json();
      setManualResult(data);
    } catch (err) {
      setManualResult({ error: "Failed to fetch" });
    }

    setLoading(false);
  };

  const getScoreColor = (score) => {
    if (score === null) return "default";
    if (score >= 80) return "success";
    if (score >= 60) return "warning";
    return "error";
  };

  const getLevelColor = (level) => {
    const colors = {
      beginner: "info",
      intermediate: "warning",
      advanced: "success",
      expert: "secondary",
    };
    return colors[level?.toLowerCase()] || "default";
  };

  const filteredResults = useMemo(() => {
    return csvResults.filter((result) => {
      const matchesSearch = result.address
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesLevel =
        !levelFilter ||
        result.level?.toLowerCase() === levelFilter.toLowerCase();

      let matchesScore = true;
      if (scoreFilter) {
        const score = result.score;
        switch (scoreFilter) {
          case "Very-high":
            matchesScore = score !== null && score >= 2000 && score <= 2399;
            break;
          case "high":
            matchesScore = score !== null && score >= 1600 && score < 2000;
            break;
          case "medium":
            matchesScore = score !== null && score >= 1200 && score < 1600;
            break;
          case "low":
            matchesScore = score !== null && score >= 800 && score < 1200;
            break;
          case "bad":
            matchesScore = score !== null && score < 800;
            break;
          default:
            matchesScore = true;
        }
      }

      let matchesStatus = true;
      if (statusFilter) {
        matchesStatus =
          statusFilter === "Ethos User" ? !result.error : !!result.error;
      }

      return matchesSearch && matchesLevel && matchesScore && matchesStatus;
    });
  }, [csvResults, searchTerm, levelFilter, scoreFilter, statusFilter]);

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ p: 3, maxWidth: 1200, mx: "auto", minHeight: "100vh" }}>
        {/* 🔍 Manual Search */}
        <Paper
          elevation={3}
          sx={{
            p: 4,
            mb: 4,
            textAlign: "center",
            background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)",
            border: "1px solid #333",
          }}
        >
          <Typography variant="h5" sx={{ mb: 2, color: "#90caf9" }}>
            🔍 Search Single Address
          </Typography>
          <TextField
            variant="outlined"
            placeholder="Enter address"
            value={manualAddress}
            onChange={(e) => setManualAddress(e.target.value)}
            sx={{
              mr: 2,
              width: "60%",
              "& .MuiOutlinedInput-root": {
                "& fieldset": {
                  borderColor: "#444",
                },
                "&:hover fieldset": {
                  borderColor: "#90caf9",
                },
              },
            }}
            size="small"
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleManualSearch}
            sx={{
              background: "linear-gradient(45deg, #90caf9 30%, #64b5f6 90%)",
              color: "#000",
            }}
          >
            Search
          </Button>

          {manualResult && (
            <Box sx={{ mt: 3 }}>
              {manualResult.error ? (
                <Alert
                  severity="error"
                  sx={{ backgroundColor: "#d32f2f", color: "#fff" }}
                >
                  {manualResult.error}
                </Alert>
              ) : (
                <Paper
                  elevation={1}
                  sx={{ p: 2, mt: 2, backgroundColor: "#2a2a2a" }}
                >
                  <Typography variant="subtitle1" sx={{ color: "#fff" }}>
                    <strong>Address:</strong> {manualResult.primaryAddress}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ color: "#aaa" }}>
                    <strong>Score:</strong>{" "}
                    <Chip
                      label={manualResult.score ?? "N/A"}
                      color={getScoreColor(manualResult.score)}
                      size="small"
                    />{" "}
                    <strong>Level:</strong>{" "}
                    <Chip
                      label={manualResult.level ?? "N/A"}
                      color={getLevelColor(manualResult.level)}
                      size="small"
                      variant="outlined"
                    />
                  </Typography>
                </Paper>
              )}
            </Box>
          )}
        </Paper>

        {/* 🧾 CSV Upload */}
        <Paper
          elevation={3}
          sx={{
            p: 4,
            mb: 3,
            textAlign: "center",
            background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
            border: "1px solid #333",
          }}
        >
          <Typography
            variant="h4"
            gutterBottom
            sx={{ fontWeight: "bold", color: "#90caf9" }}
          >
            Ethos Score Analyzer
          </Typography>
          <Typography
            variant="body1"
            sx={{ mb: 3, opacity: 0.9, color: "#aaa" }}
          >
            Upload a CSV file with addresses to analyze user scores and levels
          </Typography>

          <Button
            component="label"
            variant="contained"
            startIcon={<CloudUploadIcon />}
            sx={{
              bgcolor: "rgba(144, 202, 249, 0.2)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(144, 202, 249, 0.3)",
              color: "#90caf9",
              "&:hover": {
                bgcolor: "rgba(144, 202, 249, 0.3)",
              },
              px: 4,
              py: 1.5,
              fontSize: "1.1rem",
            }}
          >
            Choose CSV File
            <VisuallyHiddenInput
              type="file"
              accept=".csv"
              onChange={handleCsvUpload}
            />
          </Button>

          {fileName && (
            <Typography
              variant="body2"
              sx={{ mt: 2, opacity: 0.8, color: "#aaa" }}
            >
              Selected: {fileName}
            </Typography>
          )}
        </Paper>

        {loading && (
          <Paper elevation={2} sx={{ p: 3, mb: 3, backgroundColor: "#2a2a2a" }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <CircularProgress size={24} sx={{ mr: 2, color: "#90caf9" }} />
              <Typography variant="h6" sx={{ color: "#fff" }}>
                Processing addresses...
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: "#444",
                "& .MuiLinearProgress-bar": {
                  backgroundColor: "#90caf9",
                },
              }}
            />
            <Typography
              variant="body2"
              sx={{ mt: 1, textAlign: "center", color: "#aaa" }}
            >
              {Math.round(progress)}% complete
            </Typography>
          </Paper>
        )}

        {/* Table */}
        {csvResults.length > 0 && (
          <Paper elevation={2} sx={{ backgroundColor: "#1e1e1e" }}>
            <Box sx={{ p: 3, borderBottom: "1px solid #333" }}>
              <Typography
                variant="h5"
                sx={{ fontWeight: "bold", mb: 1, color: "#90caf9" }}
              >
                Analysis Results
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 3, color: "#aaa" }}
              >
                Found {csvResults.length} addresses • Showing{" "}
                {filteredResults.length} results
              </Typography>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    placeholder="Search addresses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: "#90caf9" }} />
                        </InputAdornment>
                      ),
                    }}
                    size="small"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        "& fieldset": {
                          borderColor: "#444",
                        },
                        "&:hover fieldset": {
                          borderColor: "#90caf9",
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: "#90caf9",
                        },
                      },
                    }}
                  />
                </Grid>

                {/* Level Filter */}
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel shrink sx={{ color: "#90caf9" }}>
                      Level
                    </InputLabel>
                    <Select
                      value={levelFilter}
                      onChange={(e) => setLevelFilter(e.target.value)}
                      displayEmpty
                      sx={{
                        minHeight: 40,
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#444",
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#90caf9",
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#90caf9",
                        },
                      }}
                    >
                      <MenuItem value="">
                        <em>All Levels</em>
                      </MenuItem>
                      <MenuItem value="Untrusted">Untrusted</MenuItem>
                      <MenuItem value="Questionable">Questionable</MenuItem>
                      <MenuItem value="Neutral">Neutral</MenuItem>
                      <MenuItem value="Reputable">Reputable</MenuItem>
                      <MenuItem value="Exemplary">Exemplary</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Score Filter */}
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel shrink sx={{ color: "#90caf9" }}>
                      Score
                    </InputLabel>
                    <Select
                      value={scoreFilter}
                      onChange={(e) => setScoreFilter(e.target.value)}
                      displayEmpty
                      sx={{
                        minHeight: 40,
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#444",
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#90caf9",
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#90caf9",
                        },
                      }}
                    >
                      <MenuItem value="">
                        <em>All Scores</em>
                      </MenuItem>
                      <MenuItem value="Very-high">
                        Very High (2000-2399)
                      </MenuItem>
                      <MenuItem value="high">High (1600-1999)</MenuItem>
                      <MenuItem value="medium">Medium (1200-1599)</MenuItem>
                      <MenuItem value="low">Low (800-1199)</MenuItem>
                      <MenuItem value="bad">Very Low (&lt;800)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Status Filter */}
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel shrink sx={{ color: "#90caf9" }}>
                      Status
                    </InputLabel>
                    <Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      displayEmpty
                      sx={{
                        minHeight: 40,
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#444",
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#90caf9",
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#90caf9",
                        },
                      }}
                    >
                      <MenuItem value="">
                        <em>All Status</em>
                      </MenuItem>
                      <MenuItem value="Ethos User">Success</MenuItem>
                      <MenuItem value="Non User">Non User</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>

            <TableContainer sx={{ maxHeight: 600 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        bgcolor: "#2a2a2a",
                        color: "#fff",
                      }}
                    >
                      Address
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        fontWeight: "bold",
                        bgcolor: "#2a2a2a",
                        color: "#fff",
                      }}
                    >
                      Score
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        fontWeight: "bold",
                        bgcolor: "#2a2a2a",
                        color: "#fff",
                      }}
                    >
                      Level
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        fontWeight: "bold",
                        bgcolor: "#2a2a2a",
                        color: "#fff",
                      }}
                    >
                      Status
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredResults.map((result, index) => (
                    <TableRow
                      key={index}
                      sx={{
                        "&:nth-of-type(odd)": {
                          backgroundColor: "#1a1a1a",
                        },
                        "&:nth-of-type(even)": {
                          backgroundColor: "#1e1e1e",
                        },
                        "&:hover": {
                          backgroundColor: "#333",
                        },
                      }}
                    >
                      <TableCell
                        sx={{
                          fontFamily: "monospace",
                          fontSize: "0.85rem",
                          color: "#fff",
                        }}
                      >
                        {result.address}
                      </TableCell>
                      <TableCell align="center">
                        {result.score !== null ? (
                          <Chip
                            label={result.score}
                            color={getScoreColor(result.score)}
                            size="small"
                          />
                        ) : (
                          <Typography sx={{ color: "#aaa" }}>N/A</Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {result.level ? (
                          <Chip
                            label={result.level}
                            color={getLevelColor(result.level)}
                            size="small"
                            variant="outlined"
                          />
                        ) : (
                          <Typography sx={{ color: "#aaa" }}>N/A</Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {result.error ? (
                          <Chip
                            icon={<ErrorIcon />}
                            label="Error"
                            color="error"
                            size="small"
                            variant="outlined"
                          />
                        ) : (
                          <Chip
                            icon={<CheckCircleIcon />}
                            label="Success"
                            color="success"
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}
      </Box>
    </ThemeProvider>
  );
};

export default CsvUploadComponent;
