
export default class Relay {

    constructor({ ip }) {
        this.ip = ip;
        this.relayConnected = false;
        this.taConnected = false;

        this.relaySocket = new WebSocket(this.ip);
        this.relaySocket.onmessage = this.onMessage.bind(this);
        this.relaySocket.onopen = this.onConnected.bind(this);

        this.scores = {};
        this.matches = {};
        this.players = [];
    }

    update() {
        window.overlay.scores = this.scores;
        window.overlay.matches = this.matches;
        window.overlay.players = this.players;
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
            case 3: return this.onMatchUpdate(data);
            case 4: return this.onScoreUpdate(data);
            case 6: return this.onUsersUpdate(data);
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

    onMatchUpdate(matches) {
        console.log("Matches Update", matches);
        this.matches = matches.matches;
    }

    onScoreUpdate(score) {
        console.log("Score Update", score);
        this.scores[score.user_id] = score;
    }

    onUsersUpdate(players) {
        console.log("Players Update", players);
        this.players = players.players;
    }

}