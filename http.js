const fs = require('fs');
const express = require('express');

const app = express();
const port = process.argv[2] || 3000;

const roomUrl = fs.readFileSync('room.url');

app.get('/', (req, res) => {
  res.redirect(307, roomUrl);
})

app.listen(port, () => {
  console.log(`Redirect app listening on port ${port}, target: ${roomUrl}`);
})
