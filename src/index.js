// Imports
const extract = require("./extract")

// Exports
module.exports = Object.assign({}, extract) // merge two objects

// Get questions
module.exports.getQuestions = function(html) {
  return extract.extractQuestions(html)
}
