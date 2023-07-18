const express = require('express');
const path = require('path')
const app = express();

app.use(express.static("index.html"))

app.use('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
})

app.listen(3001, () => {
  console.log("running server on 3001")
})