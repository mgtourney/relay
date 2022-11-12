import { Client, Models, Packets, TAEvents } from "tournament-assistant-client";
import { RawData, WebSocket, WebSocketServer } from "ws";
import Player from "./types/Player";
import { logger } from '.';

export default class RelayManager {

    relayServer: WebSocketServer;
    uiSocket: WebSocket;
    taClient: Client;
    _users: Map<string, Models.User>;
    _matches: Map<string, Models.Match>;
    _players: Array<Player>;

    constructor({ taUrl, relayPort }) {
        this.relayServer = new WebSocketServer({ port: relayPort });
        this.uiSocket = new WebSocket(`ws://localhost:${relayPort}`);
        this.taClient = new Client("Overlay", {
            url: taUrl,
            options: { autoReconnect: true, autoReconnectInterval: 1000 }
        });
        this._users = new Map();
        this._matches = new Map();
        this._players = [];

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

    get players() {
        return this._players;
    }

    get users(): Map<string, Models.User> {
        return this._users;
    }

    set players(players: Array<Player>) {
        console.log("players", players);
        this._players = players;
        this.sendToUI(6, { players: this._players })
    }

    set users(usersMap: Map<string, Models.User>) {
        console.log("users", Array.from(usersMap.values()));
        this._users = usersMap;
        const users = Array.from(usersMap.values());
        this.players = users.filter(user => user.client_type === Models.User.ClientTypes.Player)
            .map(user => ({
                name: user.name,
                type: user.client_type,
                user_id: user.user_id,
                guid: user.guid,
                stream_delay_ms: user.stream_delay_ms,
                stream_sync_start_ms: user.stream_sync_start_ms,
            }));
    }

    get matches() {
        return this._matches;
    }

    set matches(matches: Map<string, Models.Match>) {
        this._matches = matches;
        this.sendToUI(3, { matches: this.matches });
    }

    onUserAdded(recv: TAEvents.PacketEvent<Models.User>) {
        if (!this.isPlayerOrCoordinator(recv.data)) return;
        logger.debug(`onUserAdded`);

        const player = recv.data;
        this.users.set(player.guid, player);
        this.users = new Map(this.users);
    }

    onUserUpdated(recv: TAEvents.PacketEvent<Models.User>) {
        if (!this.isPlayerOrCoordinator(recv.data)) return;
        logger.debug(`onUserUpdated`);

        this.users.set(recv.data.guid, recv.data);
        this.users = new Map(this.users);
    }

    onUserLeft(recv: TAEvents.PacketEvent<Models.User>) {
        if (!this.isPlayerOrCoordinator(recv.data)) return;
        logger.debug(`onUserLeft`);

        this.users.delete(recv.data.guid);
        this.users = new Map(this.users);
    }

    onRealtimeScore(recv: TAEvents.PacketEvent<Packets.Push.RealtimeScore>) {
        logger.debug(`onRealtimeScore`);

        const packet = recv.data;
        const packetScore = {
            user_id: this.users.get(packet.user_guid)?.user_id,
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

        const delay = this.users.get(packet.user_guid)?.stream_delay_ms ?? 0;
        setTimeout(() => {
            this.sendToUI(4, packetScore);
        }, delay + 1);
    }

    onMatchCreated(match: TAEvents.PacketEvent<Models.Match>) {
        logger.debug(`onMatchCreated`);

        const users = match.data.associated_users;

        users.push(this.taClient.Self.guid);
        this.taClient.updateMatch(match.data);

        // todo: support for more than 2 players

        this.updateMatch(match);

        this.taClient.ServerSettings.score_update_frequency = 175;
    }

    onMatchUpdated(match: TAEvents.PacketEvent<Models.Match>) {
        logger.debug(`onMatchUpdated`);
        this.updateMatch(match);
    }

    onMatchDeleted(match: TAEvents.PacketEvent<Models.Match>) {
        logger.debug(`onMatchDeleted`);
        this.matches.delete(match.data.guid);
        this.matches = new Map(this.matches);
    }

    updateMatch(match: TAEvents.PacketEvent<Models.Match>) {
        logger.debug(`updateMatch`);
        this.matches.set(match.data.guid, match.data);
        this.matches = new Map(this.matches);
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

        socket.on('message', data => {});
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

    isPlayerOrCoordinator(user: Models.User) {
        return user.client_type == Models.User.ClientTypes.Coordinator ||
            user.client_type == Models.User.ClientTypes.Player;
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