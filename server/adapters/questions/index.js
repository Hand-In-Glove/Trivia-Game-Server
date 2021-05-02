const axios = require("axios");
const { formatHtmlEntities } = require("./helpers/formatStrings.js");

//fetch questions from API
async function getQs(amount) {
  const res = await axios.get(`https://opentdb.com/api.php?amount=${amount}`);
  const data = res.data.results;

  const questions = data.map((item) => {
    const formattedCorrect = formatHtmlEntities(item.correct_answer);
    const formattedIncorrect = item.incorrect_answers.map(formatHtmlEntities);
    return {
      question: formatHtmlEntities(item.question),
      choices: [...formattedIncorrect, formattedCorrect],
      correctAnswer: formattedCorrect,
    };
  });

  return questions;
}

module.exports = {
  getQs,
};
