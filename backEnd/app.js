const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
require('dotenv').config();

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

const inputRoutes = require('./routes/inputRoutes');
const resultRoutes = require('./routes/resultRoutes');
const reportRoutes = require('./routes/reportRoutes');
const compareRoutes = require('./routes/compareRoutes');
const analysisRoutes = require('./routes/analysisRoutes');
const aiRoutes = require('./routes/aiRoutes');
const csvRoutes = require('./routes/csvRoutes');
const batchRoutes = require('./routes/batchRoutes');

// Test route
app.get('/api/status', (req, res) => {
  res.json({
    message: 'Server is running',
    port: process.env.PORT || 5000,
    timestamp: new Date().toISOString()
  });
});

app.use('/api/input', inputRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/compare', compareRoutes);
app.use('/api/analyze', analysisRoutes);
app.use('/api/ai', aiRoutes);
// Debug CSV routes
console.log('Loading CSV routes...');
app.use('/api/csv', csvRoutes);
console.log('CSV routes loaded successfully');
app.use('/api/analyze', batchRoutes);

app.use(errorHandler);

module.exports = app;
