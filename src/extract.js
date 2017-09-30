"use strict"
const path = require("path")
// File system
const fs = require("fs")

function getQuestions(html, regex) {
  let h2Regex = /<h2>/g
  let h2Indices = []
  let index = 0
  let match

  while ((match = h2Regex.exec(html))) {
    h2Indices.push(match.index)
  }
  let questions = []
  for (let i = 0; i < h2Indices.length; ++i) {
    if (i === h2Indices.length - 1) {
      questions.push(html.substring(h2Indices[i]))
    } else {
      questions.push(html.substring(h2Indices[i], h2Indices[i + 1]))
    }
  }
  return questions
}

exports.extractQuestions = function(html) {
  // Check if the question type is established in the beginning of the file
  let defaultType
  let questionType = html.match(/\[(radio|checkbox|order)\]/i)
  if (questionType && questionType.index < html.match(/<h2>/i).index) {
    defaultType = questionType[1]
  }

  let questionRegex = new RegExp(
    "" +
    /(?:<h2>)(?:\d+\.)?\s*(.+?)<\/h2>/.source + // Question title - match[0]
    /([\s\S]+?)/.source + // Question text - match[1]
    /(?:\[(?:<[\s\S]*?>)*(text|number|radio|order|checkbox)(?:<[\s\S]*?>)*(?::\s*([\s\S]+?))?(?:<[\s\S]*?>)*\])?/
      .source + // Question type and correct answer info - match[2] & match[3]
    /[\s\S]*?/.source + //trash
    /(?:<(?:ol|ul)[\s\S]*?>([\s\S]+?)<\/(?:ul|ol)>)?/.source + // Answers list if exists - match[4]
      /[\s\S]*?/.source,
    "i"
  )

  let titleRegex = /(?:<h2>)\s*(.+?)<\/h2>/i
  let typeA = /(?:\[(?:<[\s\S]*?>)*(text|number|radio|order|checkbox)(?:<[\s\S]*?>)*(?::\s*([\s\S]+?))?(?:<[\s\S]*?>)*\])?/i
  let typeRegex = /(?:\[(?:<[\s\S]*?>)*(text|number|radio|order|checkbox)(?:<[\s\S]*?>)*?(?::\s*([\s\S]+?))?\])/i
  let typeRegex2 = /\[(text|number|radio|order|checkbox)(?::\s*([\s\S]+?))?\]/i

  let answerRegex = /<li[\s\S]*?>([\s\S]+?)<\/li>/g // List-group element
  let numberRegex = /^\d*(,\s*\d*)*$/

  let questions = []
  let match, answerMatch
  let i = 0

  // Get question's html
  let questionsArray = getQuestions(html, questionRegex)
  let questionText, questionAnswersHtml

  return questionsArray.map(function(questionHtml, index) {
    // Question
    const question = {}
    let questionTitle = questionHtml.match(titleRegex)
    let questionType = questionHtml.match(typeRegex)
    let isNumeric, qi, ai

    if (questionType) {
      qi = questionType.index
      ai = questionType.index + questionType[0].length
      question.type = questionType[1].toLowerCase()
      isNumeric = numberRegex.test(questionType[2])
    } else {
      question.type = defaultType.toLowerCase()
      qi = ai = Math.max(
        questionHtml.lastIndexOf("<ol"),
        questionHtml.lastIndexOf("<ul")
      )
    }

    question.title = questionTitle[1]
    question.text = questionHtml.substring(
      questionTitle.index + questionTitle[0].length,
      qi
    )

    questionAnswersHtml = questionHtml.substring(ai)

    switch (question.type) {
      case "text":
        question.answer = questionType[2]
        break
      case "number":
        question.answer = parseFloat(
          questionType[2].replace(/\s/g, "").replace(",", ".")
        )
        break
      case "radio":
      case "checkbox":
        if (questionType) {
          if (isNumeric) {
            question.answer = questionType[2].split(",").map(Number)
          } else {
            question.answer = questionType[2]
              .toLowerCase()
              .split(",")
              .map(x => x.trim().charCodeAt() - 97 + 1)
          }
        }
      case "order":
        if (!question.answer) {
          question.answer = []
        }
        question.options = []
        let i = 0
        while ((answerMatch = answerRegex.exec(questionAnswersHtml))) {
          if (question.type === "order") question.answer.push(i)
          else if (!questionType) {
            if (answerMatch[0].match(/font-weight:700/)) {
              answerMatch[1] = answerMatch[1].replace(
                "font-weight:700",
                "font-weight:400"
              )
              question.answer.push(i)
            }
          }
          question.options.push(answerMatch[1])
          ++i
        }

        if (question.type === "radio") question.answer = question.answer[0]
        break
    }
    // Check correctness
    if (!question.text) {
      console.log("Question's text is not valid!")
      console.log(questionHtml)
    }
    if (!question.title) {
      console.log("Question's title is not valid!")
      console.log(questionHtml)
    }
    if (!question.type) {
      console.log("Question's type is not valid!")
      console.log(questionHtml)
    }
    if (
      question.type != "text" &&
      question.type != "number" &&
      !question.options
    ) {
      console.log("Question's options are not valid!")
      console.log(questionHtml)
    }
    if (!question.answer) {
      console.log("Question's answer is not valid!")
      console.log(questionHtml)
    }

    return question
  })
}
