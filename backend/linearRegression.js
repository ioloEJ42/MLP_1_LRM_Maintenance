// linearRegression.js
const { Matrix, solve } = require("ml-matrix");

function linearRegression(data) {
  const X = data.map((d) => [new Date(d.date).getTime(), 1]);
  const Y = data.map((d) => [d.y]);

  const XMatrix = new Matrix(X);
  const YMatrix = new Matrix(Y);

  const XT = XMatrix.transpose();
  const XT_X = XT.mmul(XMatrix);
  const XT_X_inv = solve(XT_X, Matrix.eye(XT_X.rows));
  const XT_Y = XT.mmul(YMatrix);

  const B = XT_X_inv.mmul(XT_Y);

  const coef = B.get(0, 0);
  const bias = B.get(1, 0);

  return {
    coef,
    bias,
    start_date: new Date(data[0].date),
  };
}

module.exports = { linearRegression };
