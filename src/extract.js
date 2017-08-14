'use strict'
const path = require('path')
// File system
const fs = require('fs')

exports.extractQuestions = function (html) {
  let questionRegex = new RegExp(''
  + /<strong>\d+\.\s*(.+?)<\/strong>/.source  // Question title
  + /(?:\s*<\/[\w-]+>)*/.source // Closing tags ignored
  + /([\s\S]+?)/.source // Question text
  + /(?:<\w+>)*/.source // Opening tags ignored
  + /\[(text|number|radio|order|checkbox|tekstikast|raadionupud|järjestus|märkeruudud):\s*([\s\S]+?)\]/.source // Question type and correct answer info
  + /(?:<\/\w+>)*/.source // Closing tags ignored
  + /(?:<ol>([\s\S]+?)<\/ol>)?/.source, 'gi') // Answers list if exists

  let answerRegex = /<li>([\s\S]+?)<\/li>/g // List-group element
  let numberRegex = /^\d*(,\s*\d*)*$/
  let questions = []
  let match, answerMatch
  let i = 0

  html = html.replace(/<img .*?>/g, '<img>') // During testing only

  while (match = questionRegex.exec(html)) {
    let answer, correctIndex
    let answers = []
    let question = {}

    let type = match[3]
    let correctAnswer = match[4]
    let answersHtml = match[5]

    // Is the answer index numeric or alphabetic
    let isNumeric = numberRegex.test(correctAnswer)

    question.title = match[1]
    question.text = match[2]

    let answerIndex = 0
    switch(type.toLowerCase()) {
      case 'text':
      case 'tekstikast':
      question.type = 'text'
      answers.push(correctAnswer)
      break
      case 'number':
      question.type = 'number'
      answers.push(parseFloat(correctAnswer.replace(/\s/g,'')))
      break
      case 'radio':
      case 'raadionupud':
      question.type = 'radio'
      if (isNumeric) {
        correctIndex = parseInt(correctAnswer, 10)
      } else {
        correctIndex = correctAnswer.toLowerCase().trim().charCodeAt()-97 + 1
      }
      while (answerMatch = answerRegex.exec(answersHtml)) {
        answers.push({text: answerMatch[1], correct: ++answerIndex === correctIndex})
      }
      break
      case 'order':
      case 'järjestus':
      question.type = 'order'
      if (isNumeric) {
        correctIndex = correctAnswer.split(',').map(Number)
      } else {
        correctIndex = correctAnswer.toLowerCase().split(',').map(x => x.trim().charCodeAt()-97 + 1)
      }
      let unsortedAnswers = []
      while (answerMatch = answerRegex.exec(answersHtml)) {
        unsortedAnswers.push(answerMatch[1])
      }
      answers = correctIndex.map(index => unsortedAnswers[index-1])
      break
      case 'checkbox':
      case 'märkeruudud':
      question.type = 'checkbox'
      if (isNumeric) {
        correctIndex = correctAnswer.split(',').map(Number)
      } else {
        correctIndex = correctAnswer.toLowerCase().split(',').map(x => x.trim().charCodeAt()-97 + 1)
      }
      // Later changes answers =/\[([\s\S]+?)\]/g.exec(answerRegex.exec(answersHtml)[1])[1].split(",")
      while (answerMatch = answerRegex.exec(answersHtml)) {
        answers.push({text: answerMatch[1], correct: correctIndex.indexOf(++answerIndex) != -1})
      }
      break
    }
    question.answers = answers
    questions.push(question)
  }
  return questions
}
