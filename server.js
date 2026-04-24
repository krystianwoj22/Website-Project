const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// Serve everything inside the /public folder as static files
app.use(express.static(path.join(__dirname, 'public')));

// Catch-all: for any route not matched, return index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`FlashEspañol is running → http://localhost:${PORT}`);
});
