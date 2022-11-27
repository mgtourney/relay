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

        switch(data.command) {
            case "update-lead":
                this.sendToUI("lead-update", {
                    leftLead: data.leftLead,
                    rightLead: data.rightLead,
                });
                break;
            case "update-twitch":
                this.sendToUI("twitch-update", {
                    leftTwitch: data.leftTwitch,
                    rightTwitch: data.rightTwitch,
                });
                break;
        }
    }
    

    sendToUI(type: string, data: Array<any> | object) {
        if (this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ type, ...data }));
        }
    }


    close() {
        this.socket.close();
    }

}
