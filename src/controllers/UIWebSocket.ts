import { RawData, WebSocket } from 'ws';

export default class UIWebSocket {

    scoresabers: object;

    constructor(private socket: WebSocket) {
        this.socket.on("message", message => this.onMessage(message));
        this.scoresabers = {};
    }

    onMessage(message: RawData) {
        const data = JSON.parse(message.toString());

        switch (data.command) {
            case "update-lead":
                this.sendToUI("lead-update", {
                    leftLead: data.leftLead,
                    rightLead: data.rightLead,
                });
                break;
            case "view-update":
                console.log("ahdjk")
                this.sendToUI("view-update", {
                    viewMode: data.viewMode,
                });
                break;
        }
    }


    sendToUI(type: string, data: Array<unknown> | object) {
        if (this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ type, ...data }));
        }
    }


    close() {
        this.socket.close();
    }

}
