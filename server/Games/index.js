class Games {
  constructor() {
    this.games = [];
  }
  addGame(pin, hostId, isLive, gameData, players = []) {
    const game = {
      pin,
      hostId,
      isLive,
      gameData,
      players,
      getPlayers: function () {
        return this.players;
      },
      addPlayer: function (player) {
        this.players = [...this.players, player];
        return this.players;
      },
      removePlayer: function (playerID) {
        return this.players.filter((player) => player.id !== playerID);
      },
      incrementPlayerScore: function (playerId) {
        this.players = this.players.map((player) => {
          if (player.id === playerId) {
            return {
              ...player,
              score: player.score++,
            };
          }
          return player;
        });
      },
      setGameLive: function () {
        this.isLive = true;
      },
      setGameInactive: function () {
        this.isLive = false;
      },
    };
    this.games.push(game);
    return game;
  }
  removeGame(hostId) {
    const game = this.getGameByHost(hostId);

    if (game) {
      this.games = this.games.filter((game) => game.hostId !== hostId);
    }
    return game;
  }
  getGameByHost(hostId) {
    return this.games.filter((game) => game.hostId === hostId)[0];
  }
  getGameByPin(pin) {
    return this.games.filter((game) => game.pin === Number(pin))[0];
  }
}

module.exports = { Games };
