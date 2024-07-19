// linearRegression.js
function linearRegression(data) {
  const x = data.map((d) => new Date(d.date).getTime());
  const y = data.map((d) => d.y);
  const xMean = x.reduce((acc, val) => acc + val, 0) / x.length;
  const yMean = y.reduce((acc, val) => acc + val, 0) / y.length;
  const numerator = x.reduce(
    (acc, val, i) => acc + (val - xMean) * (y[i] - yMean),
    0
  );
  const denominator = x.reduce((acc, val) => acc + (val - xMean) ** 2, 0);
  const coef = numerator / denominator;
  const bias = yMean - coef * xMean;
  return { coef, bias, start_date: new Date(data[0].date) };
}

module.exports = { linearRegression };
