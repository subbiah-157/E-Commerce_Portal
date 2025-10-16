const express = require('express');
const path = require('path');
const app = express();

// Serve static files from the React build
app.use(express.static(path.join(__dirname, 'build')));

// All other requests return React's index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Use the PORT from Azure, fallback to 5000
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
