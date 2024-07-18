// index.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { predictMaintenanceDate } = require('./predict');

const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());

// Root route for basic server check
app.get('/', (req, res) => {
  res.send('Backend server is running');
});

app.post('/predict', (req, res) => {
  const { data } = req.body;
  const result = predictMaintenanceDate(data);
  res.json(result);
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
