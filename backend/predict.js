// predict.js
const { linearRegression } = require('./linearRegression');

function predictMaintenanceDate(data) {
  const { coef, bias, start_date } = linearRegression(data);
  return { coef, bias, start_date: start_date.toISOString() };
}

module.exports = { predictMaintenanceDate };
