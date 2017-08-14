// Imports
const extract = require('./extract')
const convert = require('./convert')
// Exports
module.exports = Object.assign({}, extract, convert) // merge two objects

// Get questions
module.exports.getQuestions = function(filePath) {
  return  convert.getHtml(filePath).then((html) => {
    const questions = extract.extractQuestions(html)
    return questions
  })
}
