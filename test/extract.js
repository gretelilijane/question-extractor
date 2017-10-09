"use strict"
const path = require("path")
// File system
const fs = require("fs")
// Question extractor
const qe = require("../src/index")

const filePath = path.join(__dirname, "html/match.html")

// Read html in
fs.readFile(filePath, (err, html) => {
  if (err) throw err

  try {
    let questions = qe.getQuestions(html.toString())
    console.log(questions[0].answer)
  } catch (err) {
    console.log(err)
  }
})
