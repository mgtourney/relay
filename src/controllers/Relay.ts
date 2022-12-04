import Game from './Game.js';
import UIWebSocket from './UIWebSocket.js';
import {
    Client,
    Models,
    Packets,
    TAEvents
} from 'tournament-assistant-client';
import { logger } from '../main.js';
import { WebSocket, WebSocketServer } from 'ws';

export default class Relay {

    uiSocketManager: UIWebSocket;
    relayServer: WebSocketServer;
    taClient: Client;
    gameController: Game;

    constructor({ taUrl, relayPort }: { taUrl: string, relayPort: number }) {
        this.relayServer = new WebSocketServer({ host: process.env.RELAY_HOST, port: relayPort });
        this.uiSocketManager = new UIWebSocket(new WebSocket(`ws://localhost:${relayPort}`));

        this.gameController = new Game(this.uiSocketManager);
        this.taClient = new Client("Relay", {
            url: taUrl,
            options: { autoReconnect: true, autoReconnectInterval: 1000 }
        });

        //! TODO: Refactor the entire game controller out, replacing it with taClient.State
        //! Misc information like their scoresaber profile, etc. should be stored elsewhere.
        //! - checksum 

        this.relayServer.on("connection", socket => this.onRelayConnection(socket));
        this.taClient.on("taConnected", () => this.onTAConnected());
        this.taClient.on("packet", packet => this.onPacket(packet));
        this.taClient.on("userAdded", user => this.onUserAdded(user));
        this.taClient.on("userUpdated", user => this.onUserUpdated(user));
        this.taClient.on("userLeft", user => this.onUserLeft(user));
        this.taClient.on("realtimeScore", scoreData => this.onRealtimeScore(scoreData));
        this.taClient.on("matchCreated", match => this.onMatchCreated(match));
        this.taClient.on("matchUpdated", match => this.onMatchUpdated(match));
        this.taClient.on("matchDeleted", match => this.onMatchDeleted(match));
        this.taClient.on("error", e => { throw e; });
    }

    onTAConnected(): void {
        logger.info(`Connected to Tournament Assistant`);
        this.uiSocketManager.sendToUI("on-connection", { message: "Connected to Tournament Assistant" });
    }

    async onUserAdded(recv: TAEvents.PacketEvent<Models.User>) {
        if (!this.isPlayerOrCoordinator(recv.data)) return;

        logger.debug(`onUserAdded`);

        await this.gameController.updateUser(recv.data);
    }

    async onUserUpdated(recv: TAEvents.PacketEvent<Models.User>) {
        if (!this.isPlayerOrCoordinator(recv.data)) return;
        logger.debug(`onUserUpdated`);

        await this.gameController.updateUser(recv.data);
    }

    async onUserLeft(recv: TAEvents.PacketEvent<Models.User>) {
        if (!this.isPlayerOrCoordinator(recv.data)) return;
        logger.debug(`onUserLeft`);

        await this.gameController.removeUser(recv.data);
    }

    onRealtimeScore(recv: TAEvents.PacketEvent<Packets.Push.RealtimeScore>) {
        logger.debug(`onRealtimeScore`);

        this.gameController.updateScore(recv.data);
    }

    async onMatchCreated(match: TAEvents.PacketEvent<Models.Match>) {
        logger.debug(`onMatchCreated`);

        match.data.associated_users.push(this.taClient.Self.guid);
        this.taClient.updateMatch(match.data);

        await this.gameController.updateMatch(match.data);
        this.taClient.ServerSettings.score_update_frequency = 150;
    }

    async onMatchUpdated(match: TAEvents.PacketEvent<Models.Match>) {
        logger.debug(`onMatchUpdated`);
        await this.gameController.updateMatch(match.data);
    }

    onMatchDeleted(_match: TAEvents.PacketEvent<Models.Match>) {
        logger.debug(`onMatchDeleted`);
        // ? Do we need to do anything here?
    }

    async updateMatch(match: TAEvents.PacketEvent<Models.Match>) {
        logger.debug(`updateMatch`);
        await this.gameController.updateMatch(match.data);
    }

    async onPacket(packet: Packets.Packet) {
        if (!packet.has_response || !packet.response.has_connect) {
            return;
        }

        if (packet.response.type !== 1) {
            throw new Error("Connection was not successful");
        }

        const users = new Map<string, Models.User>();
        for (const user of this.taClient.users) {
            users.set(user.guid, user);
        }

        await this.gameController.updateUsers(users);
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

    isPlayerOrCoordinator(user: Models.User) {
        return user.client_type == Models.User.ClientTypes.Coordinator ||
            user.client_type == Models.User.ClientTypes.Player;
    }

    shutdown() {
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