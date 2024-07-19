// predict.js
const { linearRegression } = require("./linearRegression");

function predictMaintenanceDate(data) {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("Invalid input data");
  }

  const { coef, bias, start_date } = linearRegression(data);

  // Predict the date when y will reach a certain threshold
  const threshold = 100; // Adjust this value based on your specific use case
  const predictedTimestamp = (threshold - bias) / coef;
  const predictedDate = new Date(predictedTimestamp);

  return {
    coef,
    bias,
    start_date: start_date.toISOString(),
    predictedDate: predictedDate.toISOString(),
  };
}

module.exports = { predictMaintenanceDate };