#!/bin/bash
# Build script for React frontend on Render

# Install dependencies
npm install

# Build the app for production
npm run build

# Create a simple server to serve the static files
echo "const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, 'build')));

app.get('*', function (req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(\`Server is running on port \${port}\`);
});" > server.js

# Install express for serving static files
npm install express 