'use strict'
const path = require('path')
// File system
const fs = require('fs')
// Question extractor
const qe = require('../src/index')

const file = '1voor_ben_est.docx'
const filePath = path.join(__dirname,'docx', file)

qe.getQuestions(filePath).then((questions) => {
  console.log(questions[1])
})
