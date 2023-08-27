const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const mathjs = require('mathjs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Load history from file if available
const historyFile = 'history.json';
let history = [];
if (fs.existsSync(historyFile)) {
  history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
}

// Middleware to track operations and update history
app.use((req, res, next) => {
  if (req.method === 'GET' && req.url !== '/history' && req.url !== '/history/clear') {
    const { method, url, query } = req;
    const operation = { method, url, query, timestamp: new Date() };
    history.push(operation);
    if (history.length > 20) {
      history.shift(); // Maintain only the last 20 operations
    }
    fs.writeFileSync(historyFile, JSON.stringify(history, null, 2), 'utf8');
  }
  next();
});

// Custom route to calculate expressions based on query parameters
app.get('/calculate', (req, res) => {
  const expression = req.query.expression;
  if (!expression) {
    return res.status(400).json({ error: 'Missing expression' });
  }

  const parsedExpression = expression.replace(/into/g, '*').replace(/plus/g, '+').replace(/minus/g, '-');

  try {
    const answer = mathjs.evaluate(parsedExpression);
    res.json({ question: parsedExpression, answer });
  } catch (error) {
    res.status(400).json({ error: 'Invalid expression' });
  }
});

// Calculate power of a number
app.get('/calculate/power', (req, res) => {
  const base = parseFloat(req.query.base);
  const exponent = parseFloat(req.query.exponent);
  if (isNaN(base) || isNaN(exponent)) {
    return res.status(400).json({ error: 'Invalid parameters' });
  }

  const result = Math.pow(base, exponent);
  res.json({ question: `${base}^${exponent}`, answer: result });
});

// Calculate square root of a number
app.get('/calculate/sqrt', (req, res) => {
  const number = parseFloat(req.query.number);
  if (isNaN(number) || number < 0) {
    return res.status(400).json({ error: 'Invalid parameter' });
  }

  const result = Math.sqrt(number);
  res.json({ question: `sqrt(${number})`, answer: result });
});

// Clear history of operations
app.post('/history/clear', (req, res) => {
  history = [];
  fs.writeFileSync(historyFile, JSON.stringify(history, null, 2), 'utf8');
  res.json({ message: 'History cleared' });
});

// Retrieve history of operations
app.get('/history', (req, res) => {
  res.json(history);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
