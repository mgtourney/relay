
class Overlay {

    constructor() {
        this.left = {
            scoreWrapper: document.querySelector(".left-score-wrapper"),
            score: document.querySelector(".left-score-wrapper .score"),
            acc: document.querySelector(".left-score-wrapper .acc"),
            rank: document.querySelector(".left-player .rank"),
            name: document.querySelector(".left-player .name"),
            country: document.querySelector(".left-player .country-image"),
            playerImage: document.querySelector(".left-player .player-image"),
            player: document.querySelector(".left-player"),
            accLine: document.querySelector(".main .left .acc-line"),
            playerScores: null,
        };
        this.right = {
            scoreWrapper: document.querySelector(".right-score-wrapper"),
            score: document.querySelector(".right-score-wrapper .score"),
            acc: document.querySelector(".right-score-wrapper .acc"),
            rank: document.querySelector(".right-player .rank"),
            name: document.querySelector(".right-player .name"),
            country: document.querySelector(".right-player .country-image"),
            playerImage: document.querySelector(".right-player .player-image"),
            player: document.querySelector(".right-player"),
            accLine: document.querySelector(".main .right .acc-line"),
            playerScores: null,
        };
        this.players = {
            left: null,
            right: null,
        }
        this.relay = new Relay({
            ip: "ws://localhost:2223",
            updater: (funny, dada) => this.update(funny, dada)
        });

        setTimeout(() => {
            if (this.relay.relaySocket.readyState === 1) {
                this.relay.post("players");
                this.relay.post("matches");
            }
        }, 2000)
    }

    update(type, data) {
        switch (type) {
            case "players": return this.updatePlayerData(data);
            case "scores": return this.updateScores(data);
        }
    }

    updateMatch(data) {
        console.log(data);

        if (this.relay.relaySocket.readyState === 1) {
            console.log("didi")
            this.relay.post("players");
            this.relay.post("matches");
        }
    }

    async updateScores(scores) {
        const { user_id, score, accuracy, combo, notesMissed,
            badCuts, bombHits, wallHits, maxCombo, lhAvg, lhBadCut, lhHits, lhMiss,
            rhAvg, rhBadCut, rhHits, rhMiss, totalMisses,
        } = scores;
        this.right.playerScores = scores;
        this.left.playerScores = scores;
        if (this.players.left == null) {
            return;
        }

        if (this.left.scoresaber == null) {
            console.log("Fetching naughties")
            this.left.scoresaber = await this.fetchScoresaber(this.players.left.user_id);
            this.right.scoresaber = await this.fetchScoresaber(this.players.right.user_id);
        }

        const isLeftPlayer = user_id === this.players.left.user_id;
        const isRightPlayer = user_id === this.players.right.user_id;
        if (!isLeftPlayer && !isRightPlayer) {
            console.error("User ID not found in players");
            return;
        }

        if (isLeftPlayer) {
            this.left.playerScores = scores;
        } else {
            this.right.playerScores = scores;
        }

        this.updateLoser();
        this.updateScoress();
        this.updatePlayer();
    }

    updatePlayerData(data) {
        console.log("lemme update player data ui", data);
        this.players.left = data.players[0];
        this.players.right = data.players[0];
    }

    updatePlayer() {
        this.left.name.innerText = this.players.left.name;
        this.right.name.innerText = this.players.right.name;
        this.left.country.src = `https://flagcdn.com/h240/${this.left.scoresaber.country.toLowerCase()}.png`;
        this.right.country.src = `https://flagcdn.com/h240/${this.right.scoresaber.country.toLowerCase()}.png`;
        this.left.playerImage.src = this.left.scoresaber.profilePicture;
        this.right.playerImage.src = this.right.scoresaber.profilePicture;
    }

    async fetchScoresaber(userId) {
        try {
            const response = await fetch(`https://scoresaber.com/api/player/${userId}/full`);
            return await response.json();
        } catch (e) {
            console.error(e);
            new Promise(resolve => setTimeout(resolve, 1000));
            return fetchScoresaber(userId);
        }
    }

    updateScoress() {
        this.left.score.innerText = this.left.playerScores.score.toString().split('').reverse().join('').replace(/([0-9]{3})/g, "$1 ").split('').reverse().join('');
        this.left.acc.innerText = (this.left.playerScores.accuracy * 100).toFixed(2);
        this.left.rank.innerText = this.left.scoresaber.rank;

        this.right.score.innerText = this.right.playerScores.score.toString().split('').reverse().join('').replace(/([0-9]{3})/g, "$1 ").split('').reverse().join('');
        this.right.acc.innerText = (this.right.playerScores.accuracy * 100).toFixed(2);
        this.right.rank.innerText = this.right.scoresaber.rank;

        const accDiffA = this.left.playerScores.accuracy - this.right.playerScores.accuracy;
        const accDiffB = this.right.playerScores.accuracy - this.left.playerScores.accuracy;
        const SENSITIVITY = 800;
        if (accDiffA > 0) {
            const accDiff = Math.min(100, (1 - (1 / Math.exp(accDiffA / 10))) * SENSITIVITY);
            this.left.accLine.style.width = `${accDiff}%`;
            this.right.accLine.style.width = `0%`;
        } else {
            const accDiff = Math.min(100, (1 - (1 / Math.exp(accDiffB / 10))) * SENSITIVITY);
            this.left.accLine.style.width = `0%`;
            this.right.accLine.style.width = `${accDiff}%`;
        }
    }

    updateLoser() {
        const leftAcc = this.left.playerScores.accuracy;
        const rightAcc = this.right.playerScores.accuracy;

        if (leftAcc > rightAcc) {
            this.left.scoreWrapper.classList.remove("loser");
            this.left.player.classList.remove("loser");
            this.right.scoreWrapper.classList.add("loser");
            this.right.player.classList.add("loser");
        } else {
            this.left.scoreWrapper.classList.add("loser");
            this.left.player.classList.add("loser");
            this.right.scoreWrapper.classList.remove("loser");
            this.right.player.classList.remove("loser");
        }
    }

}

class Relay {

    constructor({ ip, updater }) {
        this.ip = ip;
        this.updater = updater;

        this.relaySocket = new WebSocket(this.ip);
        this.relaySocket.onmessage = this.onMessage.bind(this);
        this.relaySocket.onopen = this.onConnected.bind(this);
    }

    post(command) {
        this.relaySocket.send(JSON.stringify({
            command
        }));
    }

    onMessage(message) {
        const data = JSON.parse(message.data);
        switch (data.Type) {
            case 0: return this.onTAConnected(data);
            case 1: return this.onHeartBeat(data);
            case 2: return this.onMatchDeletion(data);
            case 3: return this.onMatchUpdate(data);
            case 4: return this.onScoreUpdate(data);
            case 5: return this.updateMatches(data);
            case 6: return this.updateUsers(data);
            default:
                console.log("Unknown message", data);
                return;
        }
    }

    onConnected() {
        console.log("Connected to Relay");
    }

    onTAConnected() {
        console.log("Relay connected to TA");
    }

    onHeartBeat() {
        console.log("Heartbeat");
    }

    onMatchDeletion() {
        console.log("Match has been deleted")
    }

    onMatchUpdate({ LevelId, Diff }) {
        console.log("Match has updated");
    }

    onScoreUpdate(scores) {
        this.updater("scores", scores);
    }

    updateMatches(matches) {
        this.updater("matches", matches);
    }

    updateUsers(players) {
        this.updater("players", players);
    }

}

new Overlay();
