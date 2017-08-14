'use strict'
const path = require('path')
const mammoth = require('mammoth')
const OdtConverter = require('odt2html')
// File system
const fs = require('fs')


exports.getHtml = function (filePath) {
  let extension = path.extname(filePath)
  switch (extension) {
    case '.docx':
    return mammoth.convertToHtml({ path: filePath }).then(result => result.value)
    case '.odt':
    return OdtConverter.toHTML({ path: filePath })
  }
}

exports.saveHtml = function (txtFilePath, htmlFilePath) {
  exports.getHtml(txtFilePath).then(html => {
    fs.writeFile(htmlFilePath, html, (err) => {
      if (err) {
        throw err
      }
      console.log('Saved')
    })
  })
}
