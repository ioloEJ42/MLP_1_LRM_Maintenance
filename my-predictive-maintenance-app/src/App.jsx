import React, { useState, useCallback, useRef } from "react";
import axios from "axios";
import { saveAs } from "file-saver";
import * as d3 from "d3";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";
import "chartjs-adapter-date-fns";
import { Alert, AlertDescription } from "./components/ui/Alert";
import "./App.css"; // Custom CSS file

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  zoomPlugin
);

const FileUpload = ({ onFileChange }) => (
  <input
    type="file"
    accept=".csv"
    onChange={onFileChange}
    className="mb-4 mr-4 bg-gray-800 text-white border-gray-700"
    aria-label="Upload CSV file"
  />
);

const Button = ({ onClick, className, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded text-white ${className}`}
  >
    {children}
  </button>
);

const ResultDisplay = ({ result, metrics }) => (
  <div className="mt-4">
    <h2 className="text-xl text-white">
      Predicted Maintenance Date: {new Date(result).toLocaleString()}
    </h2>
    <div className="mt-2">
      <h3 className="text-lg text-white">Model Metrics:</h3>
      <ul className="list-disc list-inside">
        <li>R-Squared: {metrics.rSquared.toFixed(4)}</li>
        <li>Mean Squared Error: {metrics.meanSquaredError.toFixed(4)}</li>
        <li>
          Root Mean Squared Error: {metrics.rootMeanSquaredError.toFixed(4)}
        </li>
        <li>
          Cross-Validation R-Squared:{" "}
          {metrics.crossValidation.rSquared.toFixed(4)}
        </li>
        <li>
          Cross-Validation Mean Squared Error:{" "}
          {metrics.crossValidation.meanSquaredError.toFixed(4)}
        </li>
        <li>
          Cross-Validation Root Mean Squared Error:{" "}
          {metrics.crossValidation.rootMeanSquaredError.toFixed(4)}
        </li>
      </ul>
    </div>
  </div>
);

const generateNoisySensorData = (
  numSamples,
  noiseLevel,
  bias,
  randomSeed,
  trend = "positive"
) => {
  const rows = [];
  const random = new Math.seedrandom(randomSeed);
  const startDate = new Date();
  const msPerDay = 24 * 60 * 60 * 1000;
  let coef;

  if (trend === "positive") {
    coef = 0.5;
  } else if (trend === "negative") {
    coef = -0.5;
  } else {
    coef = 0;
  }

  for (let i = 0; i < numSamples; i++) {
    const x = i;
    const noise = (random() * 2 - 1) * noiseLevel;
    const y = x * coef + bias + noise; // y = coef * x + bias + noise
    const date = new Date(startDate.getTime() + i * msPerDay);
    rows.push({ date: date.toISOString(), y });
  }

  return rows;
};

function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [csvData, setCsvData] = useState(null);
  const [showDownloadButton, setShowDownloadButton] = useState(false);
  const [chartData, setChartData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [numRows, setNumRows] = useState(100);
  const [trend, setTrend] = useState("positive");
  const chartRef = useRef(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setMetrics(null);
    setCsvData(null);
    setShowDownloadButton(false);
    setChartData(null);
    setError(null);
  };

  const handleGenerateCsv = () => {
    const randomData = generateNoisySensorData(numRows, 10, 13, 42, trend);
    const csvContent = d3.csvFormat(randomData);
    setCsvData(csvContent);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "random_data.csv");
    setFile(new Blob([csvContent], { type: "text/csv" }));
  };

  const processData = useCallback(async (rows) => {
    try {
      console.log("Processing data...");
      setIsLoading(true);
      const response = await axios.post("http://localhost:5000/predict", {
        data: rows,
      });
      const { coef, bias, start_date, predictedDate, metrics } = response.data;

      setResult(predictedDate);
      setMetrics(metrics);
      setShowDownloadButton(true);

      const x = rows.map((row) => new Date(row.date));
      const y = rows.map((row) => row.y);

      const modelY = x.map((date) => coef * date.getTime() + bias);

      const originalData = rows.map((row) => ({
        x: new Date(row.date),
        y: row.y,
      }));
      const regressionLine = x.map((date, index) => ({
        x: date,
        y: modelY[index],
      }));

      setChartData({
        datasets: [
          {
            label: "Original Data",
            data: originalData,
            borderColor: "blue",
            backgroundColor: "blue",
            pointRadius: 3,
            type: "scatter",
            showLine: false,
          },
          {
            label: "Prediction Model",
            data: regressionLine,
            borderColor: "red",
            backgroundColor: "red",
            type: "line",
            fill: false,
            lineTension: 0.1,
          },
        ],
      });
    } catch (err) {
      setError(
        "An error occurred while processing the data. Please try again."
      );
      console.error("Error in processData:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handlePredictWithRandomData = async () => {
    try {
      console.log("Generating random data...");
      const randomData = generateNoisySensorData(numRows, 10, 13, 42, trend);
      const csvContent = d3.csvFormat(randomData);
      setCsvData(csvContent);
      const rows = randomData.map((row) => ({
        date: new Date(row.date),
        y: parseFloat(row.y),
      }));

      console.log("Predicting with random data...");
      await processData(rows);
    } catch (err) {
      setError(
        "An error occurred while generating random data. Please try again."
      );
      console.error("Error in handlePredictWithRandomData:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const csvData = event.target.result;
      const rows = csvData
        .split("\n")
        .slice(1)
        .map((row) => {
          const [date, y] = row.split(",");
          return { date: new Date(date), y: parseFloat(y) };
        });

      setCsvData(csvData);
      await processData(rows);
    };

    reader.readAsText(file);
  };

  const handleDownloadCsv = () => {
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "used_data.csv");
  };

  const handleZoomIn = () => {
    const chart = chartRef.current;
    if (chart) {
      chart.zoom(1.1);
    }
  };

  const handleZoomOut = () => {
    const chart = chartRef.current;
    if (chart) {
      chart.zoom(0.9);
    }
  };

  const handleResetZoom = () => {
    const chart = chartRef.current;
    if (chart) {
      chart.resetZoom();
    }
  };

  const handleNumRowsChange = (e) => {
    setNumRows(parseInt(e.target.value, 10));
  };

  const handleTrendChange = (e) => {
    setTrend(e.target.value);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-between bg-gray-900 text-white p-4">
      <h1 className="text-3xl font-bold mb-8">Predictive Maintenance</h1>
      {chartData && (
        <div className="w-full h-1/3 mb-4">
          <Line
            ref={chartRef}
            data={chartData}
            options={{
              responsive: true,
              plugins: {
                legend: { position: "top", labels: { color: "white" } },
                title: {
                  display: true,
                  text: "Predictive Maintenance Data",
                  color: "white",
                },
                zoom: {
                  pan: { enabled: true, mode: "xy" },
                  zoom: {
                    wheel: { enabled: true },
                    pinch: { enabled: true },
                    mode: "xy",
                  },
                },
                annotation: result && {
                  annotations: {
                    line1: {
                      type: "line",
                      yMin: 0,
                      yMax: 100,
                      xMin: new Date(result),
                      xMax: new Date(result),
                      borderColor: "green",
                      borderWidth: 2,
                    },
                    line2: {
                      type: "line",
                      yMin: 100,
                      yMax: 100,
                      xMin: chartData.datasets[0].data[0].x,
                      xMax: new Date(result),
                      borderColor: "green",
                      borderWidth: 2,
                    },
                  },
                },
              },
              scales: {
                x: {
                  type: "time",
                  time: { unit: "day" },
                  ticks: { color: "white" },
                },
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: "Sensor Reading",
                    color: "white",
                  },
                  ticks: { color: "white" },
                },
              },
            }}
          />
          <div className="flex justify-center mt-4">
            <Button onClick={handleZoomIn} className="bg-blue-500 mr-2">
              Zoom In
            </Button>
            <Button onClick={handleZoomOut} className="bg-blue-500 mr-2">
              Zoom Out
            </Button>
            <Button onClick={handleResetZoom} className="bg-blue-500">
              Reset Zoom
            </Button>
          </div>
        </div>
      )}
      <div className="w-full flex flex-col items-center">
        <form
          onSubmit={handleSubmit}
          className="w-full flex justify-center items-center mb-4"
        >
          <FileUpload onFileChange={handleFileChange} />
          <Button onClick={handleSubmit} className="bg-blue-500 mr-4">
            Predict
          </Button>
          <Button onClick={handleReset} className="bg-yellow-500">
            Reset
          </Button>
        </form>
        <div className="w-full flex justify-center items-center mb-4">
          <Button onClick={handleGenerateCsv} className="bg-green-500 mr-4">
            Generate Random CSV
          </Button>
          <input
            type="number"
            value={numRows}
            onChange={handleNumRowsChange}
            className="ml-2 p-2 border rounded bg-gray-800 text-white border-gray-700"
            min="1"
          />
          <select
            value={trend}
            onChange={handleTrendChange}
            className="ml-2 p-2 border rounded bg-gray-800 text-white border-gray-700"
          >
            <option value="positive">Positive Trend</option>
            <option value="negative">Negative Trend</option>
            <option value="none">No Trend</option>
          </select>
          <Button
            onClick={handlePredictWithRandomData}
            className="bg-purple-500 ml-4"
          >
            Predict with Random Data
          </Button>
          {showDownloadButton && (
            <Button onClick={handleDownloadCsv} className="bg-red-500 ml-4">
              Download Used CSV Data
            </Button>
          )}
        </div>
      </div>
      {isLoading && <p>Loading...</p>}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {result && <ResultDisplay result={result} metrics={metrics} />}
    </div>
  );
}

export default App;
