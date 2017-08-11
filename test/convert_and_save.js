'use strict'
const path = require('path')
const mammoth = require('mammoth')
const OdtConverter = require('odt2html')
// File system
const fs = require('fs')



function getHtml(filepath) {
  let extension = path.extname(filepath)

  switch (extension) {
    case '.docx':
    return mammoth.convertToHtml({ path: filepath }).then(result => result.value)
    case '.odt':
    return OdtConverter.toHTML({ path: filepath })
  }
}
const file = '1voor_ben_est'
const odtFilePath = path.join(__dirname,'odt', file +'.odt')
const docxFilePath = path.join(__dirname,'docx', file +'.docx')
const htmlFilePath = path.join(__dirname,'html', file +'.html')

function saveHtml(txtFilePath, htmlFilePath) {
  getHtml(txtFilePath).then(html => {
    fs.writeFile(htmlFilePath, html, (err) => {
      if (err) {
        throw err
      }
      console.log('Saved')
    })
  })
}

saveHtml(docxFilePath, htmlFilePath)




/*
mammoth.convertToHtml({path: filepath}).then((result) => {
let content = result.value // The generated HTML
let messages = result.messages // Any messages, such as warnings during conversion

fs.writeFile(file+'.html', content, (err) => {
if (err) {
throw err
}
console.log('Saved')
})

return content
}).then(content => {
console.log('siin on olemas content')
// }).done()
*/
