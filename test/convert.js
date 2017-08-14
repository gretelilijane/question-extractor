'use strict'
const path = require('path')
// File system
const fs = require('fs')
// Question extractor
const qe = require('../src/index')


const file = '1voor_ben_est'
const odtFilePath = path.join(__dirname,'odt', file +'.odt')
const docxFilePath = path.join(__dirname,'docx', file +'.docx')
const htmlFilePath = path.join(__dirname,'html', file +'.html')

qe.saveHtml(docxFilePath, htmlFilePath)
