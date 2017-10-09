"use strict"
const path = require("path")
// File system
const fs = require("fs")

function exist(object, name, type, index) {
  if (Array.isArray(object)) {
    if (!object.length) {
      throw { message: name + "_missing", type: type, index: index }
    }
  } else if (!object && object !== 0) {
    throw { message: name + "_missing", type: type, index: index }
  }
}

function getQuestions(html) {
  let h2Regex = /<h2>/g
  let h2Indices = []
  let index = 0
  let match

  // Get questions' titles indices
  while ((match = h2Regex.exec(html))) {
    h2Indices.push(match.index)
  }
  // Extract questions' html
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
  // Remove empty questions
  html = html.replace(/<h2><\/h2>/g, "")
  // Check if the question type is established in the beginning of the file
  let defaultType
  let questionType = html.match(/\[(radio|checkbox|order)\]/i) // TODO!!!!!!!!!!!!
  if (questionType && questionType.index < html.match(/<h2>/i).index) {
    defaultType = questionType[1]
  }
  // REGEX
  let titleRegex = /(?:<h2>)\s*(.+?)<\/h2>/i
  let typeRegex = /(?:\[(?:<[\s\S]*?>)*(text|number|radio|order|checkbox|match)(?:<[\s\S]*?>)*?(?::\s*(?:<[\s\S]*?>)*([^<>]+?)(?:<[\s\S]*?>)*?)?\])/i
  let answerRegex = /<li[\s\S]*?>([\s\S]+?)<\/li>/g // List-group element
  let numberRegex = /^\d*(,\s*\d*)*$/
  // question.type is match
  let categoriesRegex = /\[(?:<[\s\S]*?>)*categories(?:<[\s\S]*?>)*\](?:[\s\S]*?)*?<(?:ol|ul)([\s\S])*?<\/(?:ol|ul)/i
  let objectsRegex = /<(?:ol|ul)([\s\S])*?<\/(?:ol|ul)(?:[\s\S])*?\[(?:<[\s\S]*?>)*categories(?:<[\s\S]*?>)*\](?:[\s\S]*?)*?/i

  // VARIABLES
  // question.type is match
  let objectMatch, categoryMatch, categoriesHtml, objectsHtml

  // Get question's html
  let questionsArray = getQuestions(html)
  let questionText, questionAnswersHtml, answerMatch

  return questionsArray.map(function(questionHtml, index) {
    // Question
    const question = {}
    let questionTitle = questionHtml.match(titleRegex)
    let questionType = questionHtml.match(typeRegex)
    let isNumeric, qi, ai

    // TYPE
    if (questionType) {
      qi = questionType.index
      ai = questionType.index + questionType[0].length
      question.type = questionType[1].toLowerCase()
      // Check if options are numeric or alphabetic
      isNumeric = numberRegex.test(questionType[2])
    } else if (defaultType) {
      // If questionType was not in the question regex then type is defaultType
      question.type = defaultType.toLowerCase()
      qi = ai = Math.max(
        questionHtml.lastIndexOf("<ol"),
        questionHtml.lastIndexOf("<ul")
      )
    } else {
      throw { message: "type_missing", html: questionHtml, index }
    }

    // TITLE
    if (questionTitle) {
      question.title = questionTitle[1]
    } else {
      throw { message: "title_missing", index }
    }

    // TEXT
    question.text = questionHtml.substring(
      questionTitle.index + questionTitle[0].length,
      qi
    )
    questionAnswersHtml = questionHtml.substring(ai)
    exist(questionAnswersHtml, "answer_html", "html", index)
    // ANSWERS & OPTIONS
    // TODO: questionTYpe[2]
    switch (question.type) {
      case "text":
        question.answer = questionType[2]
        // Check if text type answer is correctly written
        exist(question.answer, "answer", question.type, index)
        break
      case "number":
        question.answer = parseFloat(
          questionType[2].replace(/\s/g, "").replace(",", ".")
        )
        // Check if number type answer is correctly written
        exist(question.answer, "answer", question.type, index)
        break
      case "radio":
      case "checkbox":
        if (questionType) {
          // Question type is established in the question
          try {
            if (isNumeric) {
              // TODO: Question's answer not established with the type
              question.answer = questionType[2]
                .split(",")
                .map(x => parseInt(x.trim()) - 1)
            } else {
              // Question type is alphabetic
              question.answer = questionType[2]
                .toLowerCase()
                .split(",")
                .map(x => x.trim().charCodeAt() - 97)
            }
          } catch (err) {
            exist(questionType[2], "answer_indices", question.type, index)
          }
        }
      case "order":
        if (!question.answer) {
          question.answer = []
        }
        question.options = []
        let i = 0
        while ((answerMatch = answerRegex.exec(questionAnswersHtml))) {
          if (question.type === "order") {
            question.answer.push(i)
          } else if (!questionType) {
            // Question type is not established in the question
            // Check bold answers
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
        // Check if answers and options exist
        exist(question.answer, "answer", question.type, index)

        if (question.type === "radio") {
          question.answer = question.answer[0]
        }

        exist(question.options, "options", question.type, index)
        break
      case "match":
        try {
          categoriesHtml = questionAnswersHtml.match(categoriesRegex)[0]
          objectsHtml = questionAnswersHtml.match(objectsRegex)[0]
        } catch (err) {
          exist(categoriesHtml, "categories_html", "match", index)
          exist(objectsHtml, "objects_html", "match", index)
        }

        question.options = []
        question.matchObjects = []

        // CATEGORIES into question.options
        while ((answerMatch = answerRegex.exec(categoriesHtml))) {
          question.options.push(answerMatch[1])
        }
        exist(question.options, "options", question.type, index)
        // OBJECTS into question.matchObjects
        while ((answerMatch = answerRegex.exec(objectsHtml))) {
          question.matchObjects.push(answerMatch[1])
        }
        exist(question.matchObjects, "match_objects", question.type, index)

        // ANSWERS
        let matchAnswersSplit, matchRadio
        try {
          // Check if it is radio or checkbox match question
          matchRadio = questionType[2].indexOf("(") === -1
          matchAnswersSplit = questionType[2]
            .replace(/[a-z]/gi, chr => {
              return chr.toLowerCase().charCodeAt() - 96
            })
            .split(",")
        } catch (err) {
          exist(questionType[2], "answer_indices", question.type, index)
        }

        question.type = matchRadio ? "match_radio" : "match_checkbox"
        question.answer = []
        let answer = []
        for (let i = 0; i < matchAnswersSplit.length; ++i) {
          if (/\(\d+/.test(matchAnswersSplit[i])) {
            if (answer.length) {
              throw {
                message: "answer_badly_formatted",
                type: question.type,
                index
              }
            }
            answer.push(parseInt(matchAnswersSplit[i].trim().substring(1)) - 1)
          } else if (/\d+\)/.test(matchAnswersSplit[i])) {
            if (!answer.length) {
              throw {
                message: "answer_badly_formatted",
                type: question.type,
                index
              }
            }
            answer.push(
              parseInt(matchAnswersSplit[i].trim().substring(0, 1)) - 1
            )
            question.answer.push(answer)
            answer = []
          } else if (answer.length) {
            answer.push(parseInt(matchAnswersSplit[i].trim()) - 1)
          } else if (!matchRadio && !answer.length) {
            question.answer.push([parseInt(matchAnswersSplit[i].trim()) - 1])
          } else {
            question.answer.push(parseInt(matchAnswersSplit[i].trim()) - 1)
          }
          if (i === matchAnswersSplit.length - 1 && answer.length) {
            throw {
              message: "answer_badly_formatted",
              type: question.type,
              index
            }
          }
        }
        exist(question.answer, "answer", question.type, index)

        // Remove NaN's!
        if (!matchRadio) {
          question.answer = question.answer.map(indices =>
            indices.filter(index => !isNaN(index))
          )
        }
        // Check that each object has a category
        if (question.answer.length != question.matchObjects.length) {
          throw { message: "answer_invalid", type: question.type, index }
        }
    }
    // Check that answer indices will not be larger than the number of options
    if (question.options.length && question.answer) {
      let numRegex = /(\d+)/g
      let match
      while ((match = numRegex.exec(question.answer))) {
        if (match[0] >= question.options.length) {
          throw { message: "answer_invalid", type: question.type, index }
        }
      }
      question.answer
    }

    return question
  })
}
