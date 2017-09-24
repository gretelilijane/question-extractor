"use strict"
const path = require("path")
// File system
const fs = require("fs")
// Question extractor
const qe = require("../src/index")

const filePath = path.join(__dirname, "html/example.html")

// Read html in
fs.readFile(filePath, (err, html) => {
  if (err) throw err
  let questions = qe.getQuestions(html.toString())
  console.log(questions)
})
