const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const path = require("path");
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
const cors = require("cors");

const PORT = 8080;
const { Games } = require("./Games");
const { GameData } = require("./GameData");
const { getQs } = require("./adapters/questions");

const games = new Games();

app.use(express.static(path.join(__dirname, "../test_client/")));
app.use(cors());
app.use(express.json());

io.on("connection", (socket) => {
  console.log(`user: ${socket.id} - connected`);
  io.emit("connect-test", "CONNECTED TO SERVER");

  // ==============================
  // CREATE GAME
  // =============================
  socket.on("create-game", ({ gameData, username }) => {
    const attemptGameCreate = async () => {
      // generate a random Pin for the game
      const gamePin = Math.floor(Math.random() * 1000000);
      // check it is not a duplicate
      const game = games.getGameByPin(gamePin);
      if (!game) {
        // add the game to games list and connect client to room
        const questions = await getQs(gameData.rounds);
        // console.log("questions: ", questions);
        const data = new GameData(questions, gameData.rounds);
        const game = games.addGame(gamePin, socket.id, false, data, [
          { username, id: socket.id, isHost: true, score: 0 },
        ]);
        // console.log("GAME: ", JSON.stringify(game));
        socket.join(gamePin);
        console.log("Game Created with pin:", gamePin);
        // share the pin with the client
        socket.emit("share-pin", { pin: gamePin });
        // update the lobby
        io.in(gamePin).emit("player-joined", { players: game.players });
      }
      if (game) {
        console.log("Trying again...");
        attemptGameCreate();
      }
    };
    try {
      attemptGameCreate();
    } catch (error) {
      socket.emit("error", { error });
    }
  });

  socket.on("join-game", ({ pin, username }) => {
    const game = games.getGameByPin(pin);
    const formattedPin = Number(pin);
    // console.log("PIN AND NAME: ", pin, username);
    // console.log("GAME: ", game);
    if (!game) {
      console.log(`Sorry ${username} No Game Found`);
      socket.emit("error", { error: { msg: "No Game Found" } });
    }
    if (game.isLive) {
      console.log(`Sorry ${username} Game already started`);
      socket.emit("game-already-started");
    }
    if (game && !game.isLive) {
      socket.join(Number(formattedPin));
      const players = game.addPlayer({ username, id: socket.id, score: 0 });
      console.log(`Player: ${username} joined room ${formattedPin}`);
      setTimeout(() => {
        io.in(formattedPin).emit("player-joined", { players });
      }, 300);
    }
  });

  socket.on("host-start", () => {
    const game = games.getGameByHost(socket.id);
    if (game) {
      game.gameData.setRoundQuestion();
      game.setGameLive();
      io.in(game.pin).emit("host-starting", { gamePin: game.pin });
    }
    if (!game) socket.emit("error", { error: { msg: "No Game Found" } });
  });

  socket.on("get-question", ({ pin }) => {
    const game = games.getGameByPin(pin);
    if (game) {
      const question = game.gameData.currentRound.question;
      const round =
        game.gameData.currentRound.round === game.gameData.numberOfRounds
          ? "Final Round"
          : game.gameData.currentRound.round;
      io.in(game.pin).emit("sent-question", {
        question,
        round,
      });
    }
    if (!game) socket.emit("error", { error: { msg: "No Game Found" } });
  });

  socket.on("player-answer", ({ answer, pin }) => {
    const game = games.getGameByPin(pin);
    if (game) {
      const correctAnswer = game.gameData.currentRound.question.correctAnswer;
      const playerAnswer = {
        answer,
        id: socket.id,
        correct: correctAnswer === answer,
      };
      game.gameData.addAnswer(playerAnswer);
      if (game.players.length === game.gameData.currentRound.answers.length) {
        io.in(game.pin).emit("round-over");
      }
    }
    if (!game) socket.emit("error", { error: { msg: "No Game Found" } });
  });

  socket.on("get-results", ({ pin }) => {
    const game = games.getGameByPin(pin);
    if (game) {
      // check for game over
      if (
        Number(game.gameData.currentRound.round) ===
        Number(game.gameData.numberOfRounds)
      ) {
        game.setGameInactive();
        const playersByScore = game
          .getPlayers()
          .sort((a, b) => a.score - b.score);
        io.in(game.pin).emit("send-final-results", {
          results: playersByScore,
          host: game.hostId,
        });
      } else {
        // add to scores
        const correctIds = game.gameData.getCorrectIds();
        correctIds.forEach((id) => game.incrementPlayerScore(id));
        // send results
        const correctAnswer = game.gameData.currentRound.question.correctAnswer;
        const correctPlayers = [];
        const incorrectPlayers = [];
        const players = game.getPlayers();
        players.forEach((player) => {
          if (correctIds.includes(player.id)) {
            correctPlayers.push(player);
          } else {
            incorrectPlayers.push(player);
          }
        });
        const results = {
          correctAnswer,
          correctPlayers,
          incorrectPlayers,
        };
        io.in(game.pin).emit("send-results", {
          results,
          host: game.hostId,
        });
      }
    }
    if (!game) socket.emit("error", { error: { msg: "No Game Found" } });
  });

  socket.on("host-next-round", ({ pin }) => {
    const game = games.getGameByPin(pin);
    if (game) {
      game.gameData.incrementRound();
      game.gameData.setRoundQuestion();
      game.gameData.clearAnswers();
      io.in(game.pin).emit("starting-next-round");
    }
    if (!game) socket.emit("error", { error: { msg: "No Game Found" } });
  });

  socket.on("disconnect", () => {
    console.log(`user: ${socket.id} - disconnected`);
    games.games.forEach((game) => {
      game.removePlayer(socket.id);
    });
    const game = games.getGameByHost(socket.id);
    if (game) {
      io.in(game.pin).emit("host-disconnected");
      games.removeGame(socket.id);
    }
  });
});

server.listen(PORT, () => {
  console.log(`listening on *:${PORT}`);
});
