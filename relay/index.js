import { Client } from "tournament-assistant-client";
import { WebSocket, WebSocketServer } from "ws";
class RelayManager {
    relayServer;
    uiSocket;
    taClient;
    users;
    matches;
    players;
    constructor({ taUrl, relayPort }) {
        this.relayServer = new WebSocketServer({ port: relayPort });
        this.uiSocket = new WebSocket(`ws://localhost:${relayPort}`);
        this.taClient = new Client("Overlay", {
            url: taUrl,
            options: { autoReconnect: true, autoReconnectInterval: 1000 }
        });
        this.users = {};
        this.matches = {};
        this.players = [];
        this.relayServer.on("connection", socket => this.onRelayConnection(socket));
        this.taClient.on("packet", packet => this.onPacket(packet));
        this.taClient.on("userAdded", user => this.onUserAdded(user));
        this.taClient.on("userUpdated", user => this.onUserUpdated(user));
        this.taClient.on("userLeft", user => this.onUserLeft(user));
        this.taClient.on("realtimeScore", scoreData => this.onRealtimeScore(scoreData));
        this.taClient.on("matchCreated", match => this.onMatchCreated(match));
        this.taClient.on("matchUpdated", match => this.onMatchUpdated(match));
        this.taClient.on("matchDeleted", match => this.onMatchDeleted(match));
        this.taClient.on("error", e => { throw e; });
        this.heartbeat();
    }
    onRealtimeScore(scoreData) {
        console.log("onRealtimeScore");
        const userScoring = {
            user_id: this.users[scoreData.data.user_guid].user_id,
            score: scoreData.data.score,
            accuracy: scoreData.data.accuracy,
            combo: scoreData.data.combo,
            notesMissed: scoreData.data.scoreTracker.notesMissed,
            badCuts: scoreData.data.scoreTracker.badCuts,
            bombHits: scoreData.data.scoreTracker.bombHits,
            wallHits: scoreData.data.scoreTracker.wallHits,
            maxCombo: scoreData.data.scoreTracker.maxCombo,
            lhAvg: scoreData.data.scoreTracker.leftHand.avgCut,
            lhBadCut: scoreData.data.scoreTracker.leftHand.badCut,
            lhHits: scoreData.data.scoreTracker.leftHand.hit,
            lhMiss: scoreData.data.scoreTracker.leftHand.miss,
            rhAvg: scoreData.data.scoreTracker.rightHand.avgCut,
            rhBadCut: scoreData.data.scoreTracker.rightHand.badCut,
            rhHits: scoreData.data.scoreTracker.rightHand.hit,
            rhMiss: scoreData.data.scoreTracker.rightHand.miss,
            totalMisses: scoreData.data.scoreTracker.notesMissed + scoreData.data.scoreTracker.badCuts,
        };
        setTimeout(() => {
            this.sendToUI(4, userScoring);
        }, this.users[scoreData.data.user_guid].stream_delay_ms + 1);
    }
    onUserLeft(userEvent) {
        console.log("onUserLeft");
        if (userEvent.data.client_type > 1) {
            return;
        }
        delete this.users[userEvent.data.guid];
    }
    onUserAdded(user) {
        if (user.data.client_type == 0) {
            this.users[user.data.guid] = {
                name: user.data.name,
                type: user.data.client_type,
                user_id: user.data.user_id,
                guid: user.data.guid,
                stream_delay_ms: user.data.stream_delay_ms,
                stream_sync_start_ms: user.data.stream_sync_start_ms
            };
            console.log("onUserAdded", user.data.guid, this.users);
        }
    }
    onUserUpdated(userEvent) {
        console.log("onUserUpdated");
        if (userEvent.data.client_type > 1) {
            return;
        }
        const user = this.users[userEvent.data.guid];
        if (!user)
            return console.log(`Error: User not found`);
        user.stream_delay_ms = userEvent.data.stream_delay_ms;
        user.stream_sync_start_ms = userEvent.data.stream_sync_start_ms;
    }
    onMatchCreated(match) {
        console.log("onMatchCreated");
        const users = match.data.associated_users;
        users.push(this.taClient.Self.guid);
        this.taClient.updateMatch(match.data);
        this.players = users
            .filter(guid => guid !== this.taClient.Self.guid && guid !== match.data.leader)
            .map(guid => this.users[guid]);
        console.log("Players", this.players);
        if (this.players.length !== 2 && false) {
            return;
        }
        this.updateMatch(match);
        this.sendToUI(7, {
            overlay: '1V1',
            matches: this.matches,
        });
        this.taClient.ServerSettings.score_update_frequency = 175;
    }
    onMatchUpdated(match) {
        console.log("onMatchUpdated");
        if (match.data.selected_level == null)
            return;
        this.updateMatch(match);
        this.sendToUI(3, {
            'overlay': 'BattleRoyale',
            'LevelId': match.data.selected_level.level_id,
            'Diff': match.data.selected_difficulty
        });
    }
    onMatchDeleted(match) {
        console.log("onMatchDeleted");
        delete this.matches[match.data.guid];
        this.sendToUI(2, { matches: this.matches });
    }
    updateMatch(match) {
        console.log("Update match");
        const coordinator = this.users[match.data.leader];
        this.matches[match.data.guid] = {
            matchId: match.data.guid,
            coordinator: {
                name: coordinator?.name ?? "Unknown",
                id: coordinator ? match.data.leader : "00000000-0000-0000-0000-000000000000"
            },
            players: this.players.map(u => (console.log(u), {
                name: u.name,
                user_id: u.user_id,
                guid: u.guid
            }))
        };
    }
    onPacket(packet) {
        if (!packet.has_response || !packet.response.has_connect) {
            return;
        }
        if (packet.response.type !== 1) {
            throw new Error("Connection was not successful");
        }
        const players = this.taClient.Players.map(player => ({
            name: player.name,
            type: player.client_type,
            user_id: player.user_id,
            guid: player.guid,
            stream_delay_ms: player.stream_delay_ms,
            stream_sync_start_ms: player.stream_sync_start_ms
        }));
        if (this.players.length > 0) {
            console.log("Got packet and overwritten players", players);
        }
        else {
            console.log("Connection Successful!");
        }
        this.players = players;
    }
    onRelayConnection(socket) {
        this.sendToUI(0, { message: "You've connected to the Tournament relay server." });
        console.log("You've connected to the Tournament relay server.");
        socket.on('message', (data, isBinary) => {
            this.relayServer.clients.forEach(function each(client) {
                if (client !== socket && client.readyState === WebSocket.OPEN) {
                    client.send(data, { binary: isBinary });
                }
            });
        });
        socket.on('message', data => this.onUIMessage(data));
    }
    onUIMessage(data) {
        const { command } = JSON.parse(data.toString());
        switch (command) {
            case "matches":
                this.sendToUI(5, { matches: this.matches });
                break;
            case "players":
                this.sendToUI(6, { players: this.players });
                break;
        }
    }
    sendToUI(type, data) {
        if (this.uiSocket.readyState === WebSocket.OPEN) {
            this.uiSocket.send(JSON.stringify({ Type: type, ...data }));
        }
    }
    heartbeat() {
        setInterval(() => this.sendToUI(1, {
            message: 'heartbeat'
        }), 29000);
    }
}
new RelayManager({
    taUrl: "ws://tournamentassistant.net:2053",
    relayPort: 2223,
});
