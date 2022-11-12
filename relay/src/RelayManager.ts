import { Client, Models, Packets, TAEvents } from "tournament-assistant-client";
import { RawData, WebSocket, WebSocketServer } from "ws";
import Player from "./types/Player";
import { logger } from '.';

export default class RelayManager {

    relayServer: WebSocketServer;
    uiSocket: WebSocket;
    taClient: Client;
    users: Map<string, Models.User>;
    matches: Map<string, Models.Match>;
    players: Array<Player>;

    constructor({ taUrl, relayPort }) {
        this.relayServer = new WebSocketServer({ port: relayPort });
        this.uiSocket = new WebSocket(`ws://localhost:${relayPort}`);
        this.taClient = new Client("Overlay", {
            url: taUrl,
            options: { autoReconnect: true, autoReconnectInterval: 1000 }
        });
        this.users = new Map();
        this.matches = new Map();
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


    onUserAdded(recv: TAEvents.PacketEvent<Models.User>) {
        logger.debug(`onUserAdded`);

        if (recv.data.client_type > 1) return;
        const player = recv.data;

        this.users[player.guid] = {
            name: player.name,
            type: player.client_type,
            user_id: player.user_id,
            guid: player.guid,
            stream_delay_ms: player.stream_delay_ms,
            stream_sync_start_ms: player.stream_sync_start_ms
        };
    }

    onUserUpdated(recv: TAEvents.PacketEvent<Models.User>) {
        logger.debug(`onUserUpdated`);

        if (recv.data.client_type > 1) return;

        const playerState = this.users[recv.data.guid];
        if (playerState == null) return logger.error(`Player ${recv.data.guid} not found in users list`);

        // Update the player state
        playerState.stream_delay_ms = recv.data.stream_delay_ms;
        playerState.stream_sync_start_ms = recv.data.stream_sync_start_ms;
    }

    onUserLeft(recv: TAEvents.PacketEvent<Models.User>) {
        logger.debug(`onUserLeft`);

        if (recv.data.client_type > 1) return;

        delete this.users[recv.data.guid];
    }

    onRealtimeScore(recv: TAEvents.PacketEvent<Packets.Push.RealtimeScore>) {
        logger.debug(`onRealtimeScore`);

        let packet = recv.data;

        const packetScore = {
            user_id: this.users[packet.user_guid].user_id,
            score: packet.score,
            accuracy: packet.accuracy,
            combo: packet.combo,
            notesMissed: packet.scoreTracker.notesMissed,
            badCuts: packet.scoreTracker.badCuts,
            bombHits: packet.scoreTracker.bombHits,
            wallHits: packet.scoreTracker.wallHits,
            maxCombo: packet.scoreTracker.maxCombo,
            lhAvg: packet.scoreTracker.leftHand.avgCut,
            lhBadCut: packet.scoreTracker.leftHand.badCut,
            lhHits: packet.scoreTracker.leftHand.hit,
            lhMiss: packet.scoreTracker.leftHand.miss,
            rhAvg: packet.scoreTracker.rightHand.avgCut,
            rhBadCut: packet.scoreTracker.rightHand.badCut,
            rhHits: packet.scoreTracker.rightHand.hit,
            rhMiss: packet.scoreTracker.rightHand.miss,
            totalMisses: packet.scoreTracker.notesMissed + packet.scoreTracker.badCuts,
        };

        setTimeout(() => {
            this.sendToUI(4, packetScore);
        }, this.users[packet.user_guid].stream_delay_ms + 1);
    }

    onMatchCreated(match: TAEvents.PacketEvent<Models.Match>) {
        logger.debug(`onMatchCreated`);

        const users = match.data.associated_users;

        users.push(this.taClient.Self.guid);
        this.taClient.updateMatch(match.data);

        this.players = users
            .filter(guid => guid !== this.taClient.Self.guid && guid !== match.data.leader)
            .map(guid => this.users[guid]);

        // todo: support for more than 2 players

        this.updateMatch(match);
        this.sendToUI(7, {
            overlay: '1V1',
            matches: this.matches,
        });

        this.taClient.ServerSettings.score_update_frequency = 175;
    }

    onMatchUpdated(match: TAEvents.PacketEvent<Models.Match>) {
        logger.debug(`onMatchUpdated`);

        if (match.data.selected_level == null)
            return;

        this.updateMatch(match);
        this.sendToUI(3, {
            'overlay': 'BattleRoyale',
            'LevelId': match.data.selected_level.level_id,
            'Diff': match.data.selected_difficulty
        });
    }

    onMatchDeleted(match: TAEvents.PacketEvent<Models.Match>) {
        logger.debug(`onMatchDeleted`);

        delete this.matches[match.data.guid];
        this.sendToUI(2, { matches: this.matches });
    }

    updateMatch(match: TAEvents.PacketEvent<Models.Match>) {
        logger.debug(`updateMatch`);

        const coordinator = this.users[match.data.leader];

        this.matches[match.data.guid] = {
            matchId: match.data.guid,
            coordinator: {
                name: coordinator?.name ?? "Unknown",
                id: coordinator ? match.data.leader : "00000000-0000-0000-0000-000000000000"
            },
            players: this.players.map(u => ({
                name: u.name,
                user_id: u.user_id,
                guid: u.guid
            }))
        };
    }

    onPacket(packet: Packets.Packet) {
        if (!packet.has_response || !packet.response.has_connect) {
            return;
        }

        if (packet.response.type !== 1) {
            throw new Error("Connection was not successful");
        }

        const players = this.taClient.Players.map(p => ({
            name: p.name,
            type: p.client_type,
            user_id: p.user_id,
            guid: p.guid,
            stream_delay_ms: p.stream_delay_ms,
            stream_sync_start_ms: p.stream_sync_start_ms
        }));

        if (this.players.length > 0) {
            logger.debug("Got packet and overwritten players", players);
        };

        this.players = players;
    }


    onRelayConnection(socket: WebSocket) {
        this.sendToUI(0, { message: "You've connected to the Tournament relay server." });
        logger.info("Connected to the Tournament relay server.");

        socket.on('message', (data, isBinary) => {
            this.relayServer.clients.forEach(function each(client) {
                if (client !== socket && client.readyState === WebSocket.OPEN) {
                    client.send(data, { binary: isBinary });
                }
            });
        });

        socket.on('message', data => this.onUIMessage(data));
    }

    onUIMessage(data: RawData) {
        const { command } = JSON.parse(data.toString());
        switch (command) {
            case "matches": this.sendToUI(5, { matches: this.matches }); break;
            case "players": this.sendToUI(6, { players: this.players }); break;
        }
    }

    sendToUI(type: number, data: Array<any> | object) {
        if (this.uiSocket.readyState === WebSocket.OPEN) {
            this.uiSocket.send(JSON.stringify({ Type: type, ...data }));
        }
    }

    heartbeat() {
        setInterval(() => this.sendToUI(1, {
            message: 'heartbeat'
        }), 29000);
    }

    async shutdown() {
        logger.warn("Shutting down...");

        try {
            this.relayServer.close();
            this.uiSocket.close();
            this.taClient.close();
        } catch (error) {
            logger.error(error);
            return false;
        }

        return true;
    }
}