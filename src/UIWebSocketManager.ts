import { WebSocket, RawData } from "ws";
import fetch from "node-fetch";

export default class UIWebSocketManager {

    scoresabers: any;

    constructor(private socket: WebSocket) {
        this.socket.on("message", message => this.onMessage(message));
        this.scoresabers = {};
    }

    onMessage(message: RawData) {
        const data = JSON.parse(message.toString());
        this.sendToUI(100, data);

        switch(data.command) {
            case "update-scoresabers":
                this.updateScoresabers(data.ids).then(scoresabers => this.sendToUI(100, {
                    command: "update-scoresabers",
                    scoresabers,
                }));
        }
    }
    

    sendToUI(type: number, data: Array<any> | object) {
        if (this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ Type: type, ...data }));
        }
    }

    
    async updateScoresabers(ids: string[]) {
        for (const player of ids) {
            if (this.scoresabers[player] == null) {
                const scoresaber = await this.getScoresaber(player);
                this.scoresabers[player] = scoresaber;
            }
        }
        return this.scoresabers;
    }


    async getScoresaber(playerId: string): Promise<any> {
        if (playerId === "614043079") {
            playerId = "76561198436848521";
        } else if (playerId === "1894966344") {
            playerId = "76561198849650655";
        }

        try {
            const response = await fetch(`https://scoresaber.com/api/player/${playerId}/full`);
            if (response.status === 404) {
                return {};
            }

            return await response.json();
        } catch (e) {
            console.error(e);
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return await this.getScoresaber(playerId);
        }
    }


    close() {
        this.socket.close();
    }

}
