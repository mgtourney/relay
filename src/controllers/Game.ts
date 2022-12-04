import got from 'got';
import UIWebSocketManager from './UIWebSocket.js';
import {
    Client,
    Models,
    Packets,
    TAEvents
} from 'tournament-assistant-client';
import { logger } from '../index.js';
import { ScoreSaberPlayerInfo } from '../types/ScoreSaber.js';
import { TAPlayerInfo, TAScore } from '../types/TA.js';

export default class Game {

    users: Map<string, Models.User>;
    matches: Map<string, Models.Match>;
    scores: Map<string, TAScore>;
    currentMatch: string;
    scoresabers: Map<string, any>;

    constructor(private uiSocket: UIWebSocketManager) {
        this.users = new Map();
        this.matches = new Map();
        this.scores = new Map();
        this.scoresabers = new Map();
        this.currentMatch = "";

        (async () => {
            this.getScoresaber("76561198347791418").then(scoresaber => {
                console.log(scoresaber?.name);
            });
        })();
    }

    getCurrentMatchPlayers(): TAPlayerInfo[] {
        const playerGuids = this.matches.get(this.currentMatch)?.associated_users ?? [];
        return playerGuids.map(guid => this.playerUsers.find(u => u.guid === guid)).filter(Boolean) as TAPlayerInfo[];
    }

    onGameStateUpdate() {
        const players = this.getCurrentMatchPlayers();
        this.uiSocket.sendToUI("game-state-update", {
            match: this.matches.get(this.currentMatch)?.toObject(),
            players,
        });

        const ids = players.map(p => p.user_id);
        this.updateScoresabers(ids).then(scoresabers => {

            this.uiSocket.sendToUI("on-scoresaber-update", { scoresabers });
        });
    }

    onScoreUpdate(score: TAScore) {
        const delay = this.users.get(score?.user_guid)?.stream_delay_ms ?? 0;
        setTimeout(() => {
            this.uiSocket.sendToUI("score-update", {
                scores: Object.fromEntries(this.scores),
            });
        }, delay + 1);
    }

    updateUsers(users: Map<string, Models.User>) {
        this.users = users;
        this.onGameStateUpdate();
    }

    updateMatches(matches: Map<string, Models.Match>) {
        this.matches = matches;
        this.onGameStateUpdate();
    }

    updateUser(user: Models.User) {
        this.users.set(user.guid, user);
        this.onGameStateUpdate();
    }

    updateMatch(match: Models.Match) {
        this.matches.set(match.guid, match);
        this.currentMatch = match.guid;
        this.onGameStateUpdate();
    }

    updateScore(score: Packets.Push.RealtimeScore) {
        this.scores.set(this.users.get(score.user_guid)?.user_id ?? "", {
            user_id: this.users.get(score.user_guid)?.user_id,
            user_guid: score.user_guid,
            score: score.score,
            accuracy: score.accuracy,
            combo: score.combo,
            notesMissed: score.scoreTracker.notesMissed,
            badCuts: score.scoreTracker.badCuts,
            bombHits: score.scoreTracker.bombHits,
            wallHits: score.scoreTracker.wallHits,
            maxCombo: score.scoreTracker.maxCombo,
            lhAvg: score.scoreTracker.leftHand.avgCut,
            lhBadCut: score.scoreTracker.leftHand.badCut,
            lhHits: score.scoreTracker.leftHand.hit,
            lhMiss: score.scoreTracker.leftHand.miss,
            rhAvg: score.scoreTracker.rightHand.avgCut,
            rhBadCut: score.scoreTracker.rightHand.badCut,
            rhHits: score.scoreTracker.rightHand.hit,
            rhMiss: score.scoreTracker.rightHand.miss,
            totalMisses: score.scoreTracker.notesMissed + score.scoreTracker.badCuts,
        });
        this.onScoreUpdate(this.scores.get(this.users.get(score.user_guid)?.user_id ?? "") as TAScore);
    }

    removeUser(user: Models.User) {
        this.users.delete(user.guid);
        this.onGameStateUpdate();
    }

    get playerUsers(): TAPlayerInfo[] {
        return Array.from(this.users.values())
            .filter(user => user.client_type === Models.User.ClientTypes.Player)
            .sort((a, b) => a.user_id > b.user_id ? 1 : -1)
            .map(user => ({
                name: user.name,
                type: user.client_type,
                user_id: user.user_id,
                guid: user.guid,
                stream_delay_ms: user.stream_delay_ms,
                stream_sync_start_ms: user.stream_sync_start_ms,
            }));
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


    async getScoresaber(playerId: string): Promise<ScoreSaberPlayerInfo | null> {
        try {
            let response = await got.get(`https://scoresaber.com/api/player/${playerId}/full`);
            switch (response.statusCode) {
                case 200:
                    return JSON.parse(response.body) as ScoreSaberPlayerInfo;
                case 404:
                    return null;
                default:
                    return null;
            }
        } catch (e) {
            logger.warn(`Failed to get scoresaber info for ${playerId}, retrying...`);

            let attempts = 0;
            while (attempts < 3) {
                attempts++;
                try {
                    return await this.getScoresaber(playerId);
                } catch (e) {
                    logger.warn(`Failed to get scoresaber info for player ${playerId} on attempt ${attempts}/3: ${e}`);
                    continue;
                }
            }

            logger.error(`Failed to get scoresaber info for player ${playerId} after 3 attempts, giving up and returning null`);
            return null;
        }
    }
}