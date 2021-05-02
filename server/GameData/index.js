class GameData {
  constructor(questions, numberOfRounds) {
    (this.questions = questions),
      (this.numberOfRounds = Number(numberOfRounds)),
      (this.currentRound = {
        round: 1,
        question: {},
        answers: [],
      });
  }
  incrementRound() {
    this.currentRound.round += 1;
  }
  setRoundQuestion() {
    this.currentRound.question = this.questions[this.currentRound.round - 1];
  }
  addAnswer(answer) {
    this.currentRound.answers.push(answer);
  }
  clearAnswers() {
    this.currentRound.answers = [];
  }
  getCorrectIds() {
    return this.currentRound.answers.reduce((arr, curr) => {
      if (curr.correct) arr.push(curr.id);
      return arr;
    }, []);
  }
}

module.exports = { GameData };
