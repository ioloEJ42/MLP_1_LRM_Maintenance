// predict.js
const { linearRegression } = require("./linearRegression");
const { Matrix } = require("ml-matrix");

function calculateMetrics(yTrue, yPred) {
  const n = yTrue.length;
  const residuals = yTrue.map((y, i) => y - yPred[i]);
  const ssRes = residuals.reduce((sum, r) => sum + r ** 2, 0);
  const meanY = yTrue.reduce((sum, y) => sum + y, 0) / n;
  const ssTot = yTrue.reduce((sum, y) => sum + (y - meanY) ** 2, 0);
  const rSquared = 1 - ssRes / ssTot;
  const mse = ssRes / n;
  const rmse = Math.sqrt(mse);

  return { rSquared, mse, rmse };
}

function predictMaintenanceDate(data) {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("Invalid input data");
  }

  const { coef, bias, start_date } = linearRegression(data);

  const threshold = 100; // Adjust this value based on your specific use case
  const predictedTimestamp = (threshold - bias) / coef;
  const predictedDate = new Date(predictedTimestamp);

  const yTrue = data.map((d) => d.y);
  const yPred = data.map((d) => coef * new Date(d.date).getTime() + bias);

  const { rSquared, mse, rmse } = calculateMetrics(yTrue, yPred);

  const k = 5; // Number of folds for cross-validation
  const n = data.length;
  const foldSize = Math.floor(n / k);
  let cvR2 = 0;
  let cvMSE = 0;
  let cvRMSE = 0;

  for (let i = 0; i < k; i++) {
    const testStart = i * foldSize;
    const testEnd = testStart + foldSize;
    const trainData = data.filter(
      (_, idx) => idx < testStart || idx >= testEnd
    );
    const testData = data.slice(testStart, testEnd);

    const trainY = trainData.map((d) => d.y);
    const testY = testData.map((d) => d.y);

    const { coef: cvCoef, bias: cvBias } = linearRegression(trainData);
    const testYPred = testData.map(
      (d) => cvCoef * new Date(d.date).getTime() + cvBias
    );

    const {
      rSquared: foldR2,
      mse: foldMSE,
      rmse: foldRMSE,
    } = calculateMetrics(testY, testYPred);
    cvR2 += foldR2;
    cvMSE += foldMSE;
    cvRMSE += foldRMSE;
  }

  cvR2 /= k;
  cvMSE /= k;
  cvRMSE /= k;

  return {
    coef,
    bias,
    start_date: start_date.toISOString(),
    predictedDate: predictedDate.toISOString(),
    metrics: {
      rSquared,
      meanSquaredError: mse,
      rootMeanSquaredError: rmse,
      crossValidation: {
        rSquared: cvR2,
        meanSquaredError: cvMSE,
        rootMeanSquaredError: cvRMSE,
      },
    },
  };
}

module.exports = { predictMaintenanceDate };
