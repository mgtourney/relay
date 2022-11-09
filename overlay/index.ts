import WebSocket from 'ws';
import protobuf from 'protobufjs';
import express from 'express';
import path from 'path';
import { Client } from "tournament-assistant-client";

const webApp = express();
const port = 3000;
const publicDirectoryPath = path.join(__dirname, 'public')

// Get structure data schema from protobuf
protobuf.load("protobufs/packets.proto", function (err, root) {
    if (err) throw err;
    const Packet = root?.lookupType("proto.packet.Packet");
    const Request = root?.lookupType("proto.packet.Request");

    // Listen to tournament assistant websocket
    // const ws = new WebSocket('ws://tournamentassistant.net:2053'); // new WebSocket('ws://localhost:2053');
    // ws.on('open', () => onWebsocketOpen());
    // ws.on('message', (data: any) => onWebsocketMessage(data, Packet, Request));

    // Start the express server
    webApp.use(express.static(publicDirectoryPath));
    webApp.get('/', (req: any, res: any) => serveIndex(req, res));
    webApp.listen(port, () => onExpressListen());
});

function serveIndex(req: any, res: any) {
    res.sendFile(path.join(publicDirectoryPath, 'index.html'));
}

function onExpressListen() {
    console.log(`Example app listening at http://localhost:${port}`)
}

function onWebsocketOpen() {
    console.log('connected');
}

function onWebsocketMessage(data: any, Packet?: protobuf.Type, Request?: protobuf.Type) {
    const decodedMessage = <any>Packet?.decode(data);
    if (decodedMessage == null) {
        console.error("Failed to decode message packet");
        return;
    }

    const hasUserLeft = decodedMessage.event?.userLeftEvent != null;
    const hasUserJoined = decodedMessage.event?.userAddedEvent != null;
    const hasCreatedMatch = decodedMessage.event?.matchCreatedEvent != null;
    const hasMatchUpdated = decodedMessage.event?.matchUpdatedEvent != null;
    const hasUserUpdated = decodedMessage.event?.userUpdatedEvent != null;
    const hasMatchDeleted = decodedMessage.event?.matchDeletedEvent != null;
    const hasSongFinished = decodedMessage.event?.songFinished != null;

    if (hasUserUpdated && decodedMessage.event.userUpdatedEvent.downloadState === 2) {
        console.log("Requesting scores");
        const requestScores = Request?.create({ requestScores: {} });

    }

    console.log(decodedMessage);
    console.log("hasUserLeft", hasUserLeft);
    console.log("hasUserJoined", hasUserJoined);
}
