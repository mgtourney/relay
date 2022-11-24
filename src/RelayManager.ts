import { Client, Models, Packets, TAEvents } from "tournament-assistant-client";
import { WebSocket, WebSocketServer } from "ws";
import Player from "./types/Player";
import UIWebSocketManager from "./UIWebSocketManager";
import { logger } from '.';
import Game from "./Game";

export default class RelayManager {

    uiSocketManager: UIWebSocketManager;
    relayServer: WebSocketServer;
    taClient: Client;
    gameController: Game;

    constructor({ taUrl, relayPort }) {
        this.relayServer = new WebSocketServer({ port: relayPort });
        this.taClient = new Client("Relay", {
            url: taUrl,
            options: { autoReconnect: true, autoReconnectInterval: 1000 }
        });
        this.uiSocketManager = new UIWebSocketManager(new WebSocket(`ws://localhost:${relayPort}`));
        this.gameController = new Game(this.uiSocketManager);

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
        //this.heartbeat();
    }

    onUserAdded(recv: TAEvents.PacketEvent<Models.User>) {
        if (!this.isPlayerOrCoordinator(recv.data)) return;
        logger.debug(`onUserAdded`);

        this.gameController.updateUser(recv.data);
    }

    onUserUpdated(recv: TAEvents.PacketEvent<Models.User>) {
        if (!this.isPlayerOrCoordinator(recv.data)) return;
        logger.debug(`onUserUpdated`);

        this.gameController.updateUser(recv.data);
    }

    onUserLeft(recv: TAEvents.PacketEvent<Models.User>) {
        if (!this.isPlayerOrCoordinator(recv.data)) return;
        logger.debug(`onUserLeft`);

        this.gameController.removeUser(recv.data);
    }

    onRealtimeScore(recv: TAEvents.PacketEvent<Packets.Push.RealtimeScore>) {
        logger.debug(`onRealtimeScore`);

        this.gameController.updateScore(recv.data);
    }

    onMatchCreated(match: TAEvents.PacketEvent<Models.Match>) {
        logger.debug(`onMatchCreated`);

        match.data.associated_users.push(this.taClient.Self.guid);
        this.taClient.updateMatch(match.data);

        this.gameController.updateMatch(match.data);
        this.taClient.ServerSettings.score_update_frequency = 150;
    }

    onMatchUpdated(match: TAEvents.PacketEvent<Models.Match>) {
        logger.debug(`onMatchUpdated`);
        this.gameController.updateMatch(match.data);
    }

    onMatchDeleted(match: TAEvents.PacketEvent<Models.Match>) {
        logger.debug(`onMatchDeleted`);
    }

    updateMatch(match: TAEvents.PacketEvent<Models.Match>) {
        logger.debug(`updateMatch`);
        this.gameController.updateMatch(match.data);
    }

    onPacket(packet: Packets.Packet) {
        if (!packet.has_response || !packet.response.has_connect) {
            return;
        }

        if (packet.response.type !== 1) {
            throw new Error("Connection was not successful");
        }

        const users = new Map();
        for (const user of this.taClient.users) {
            users.set(user.guid, user);
        }

        this.gameController.updateUsers(users);
    }


    onRelayConnection(socket: WebSocket) {
        this.uiSocketManager.sendToUI("on-connection", { message: "Connected to relay server" });
        logger.debug(`${socket.url} connected`);

        socket.on('message', (data, isBinary) => {
            this.relayServer.clients.forEach(function each(client) {
                if (client !== socket && client.readyState === WebSocket.OPEN) {
                    client.send(data, { binary: isBinary });
                }
            });
        });
    }
    

    /*heartbeat() {
        setInterval(() => this.uiSocketManager.sendToUI(1, {
            players: this.players,
            matches: Array.from(this.matches.values()).map(m => m.toObject()),
        }), 5000);
    }*/

    isPlayerOrCoordinator(user: Models.User) {
        return user.client_type == Models.User.ClientTypes.Coordinator ||
            user.client_type == Models.User.ClientTypes.Player;
    }

    async shutdown() {
        logger.warn("Shutting down...");

        try {
            this.relayServer.close();
            this.uiSocketManager.close();
            this.taClient.close();
        } catch (error) {
            logger.error(error);
            return false;
        }

        return true;
    }
}