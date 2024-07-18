import React, { useState } from "react";
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
import "chartjs-adapter-date-fns";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [csvData, setCsvData] = useState(null);
  const [showDownloadButton, setShowDownloadButton] = useState(false);
  const [chartData, setChartData] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setCsvData(null);
    setShowDownloadButton(false);
    setChartData(null);
  };

  const generateRandomData = () => {
    const rows = [];
    const numRows = 100; // Number of rows in the CSV
    const startDate = new Date();
    for (let i = 0; i < numRows; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const y = Math.random() * 100 - 50; // Random y value
      rows.push({ date: date.toISOString(), y });
    }
    return rows;
  };

  const handleGenerateCsv = () => {
    const randomData = generateRandomData();
    const csvContent = d3.csvFormat(randomData);
    setCsvData(csvContent);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "random_data.csv");
    setFile(new Blob([csvContent], { type: "text/csv" }));
  };

  const handlePredictWithRandomData = async () => {
    const randomData = generateRandomData();
    const csvContent = d3.csvFormat(randomData);
    setCsvData(csvContent);
    const rows = randomData.map((row) => ({
      date: new Date(row.date),
      y: parseFloat(row.y),
    }));

    const response = await axios.post("http://localhost:5000/predict", {
      data: rows,
    });
    const { coef, bias, start_date } = response.data;
    const startDate = new Date(start_date);

    setResult(response.data.predictedDate);
    setShowDownloadButton(true);

    const x = rows.map((row) => new Date(row.date));
    const y = rows.map((row) => row.y);

    // Calculate modelY points using the regression coefficients
    const modelY = x.map((date) => coef * date.getTime() + bias);

    const originalData = rows.map((row, index) => ({ x: row.date, y: row.y }));
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

      const response = await axios.post("http://localhost:5000/predict", {
        data: rows,
      });
      const { coef, bias, start_date } = response.data;
      const startDate = new Date(start_date);

      setResult(response.data.predictedDate);
      setCsvData(csvData);
      setShowDownloadButton(true);

      const x = rows.map((row) => new Date(row.date));
      const y = rows.map((row) => row.y);

      // Calculate modelY points using the regression coefficients
      const modelY = x.map((date) => coef * date.getTime() + bias);

      const originalData = rows.map((row, index) => ({
        x: row.date,
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
    };

    reader.readAsText(file);
  };

  const handleDownloadCsv = () => {
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "used_data.csv");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-between bg-gray-100 p-4">
      <h1 className="text-3xl font-bold mb-8">Predictive Maintenance</h1>
      {chartData && (
        <div className="w-full h-1/3 mb-4">
          <Line
            data={chartData}
            options={{
              responsive: true,
              plugins: {
                legend: { position: "top" },
                title: { display: true, text: "Predictive Maintenance Data" },
              },
              scales: { x: { type: "time", time: { unit: "day" } } },
            }}
          />
        </div>
      )}
      <div className="w-full flex flex-col items-center">
        <form
          onSubmit={handleSubmit}
          className="w-full flex justify-center items-center mb-4"
        >
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="mb-4 mr-4"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded mr-4"
          >
            Predict
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="bg-yellow-500 text-white px-4 py-2 rounded"
          >
            Reset
          </button>
        </form>
        <div className="w-full flex justify-center items-center mb-4">
          <button
            onClick={handleGenerateCsv}
            className="bg-green-500 text-white px-4 py-2 rounded mr-4"
          >
            Generate Random CSV
          </button>
          <button
            onClick={handlePredictWithRandomData}
            className="bg-purple-500 text-white px-4 py-2 rounded mr-4"
          >
            Predict with Random Data
          </button>
          {showDownloadButton && (
            <button
              onClick={handleDownloadCsv}
              className="bg-red-500 text-white px-4 py-2 rounded"
            >
              Download Used CSV Data
            </button>
          )}
        </div>
      </div>
      {result && (
        <div className="mt-4">
          <h2 className="text-xl">
            Predicted Maintenance Date: {new Date(result).toLocaleString()}
          </h2>
        </div>
      )}
    </div>
  );
}

export default App;
