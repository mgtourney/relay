import { WebSocket } from "ws";

export default class UIWebSocketManager {

    constructor(private socket: WebSocket) {
        this.socket.on("message", message => this.sendToUI(100, JSON.parse(message.toString())));
    }


    sendToUI(type: number, data: Array<any> | object) {
        if (this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ Type: type, ...data }));
        }
    }


    close() {
        this.socket.close();
    }

}
