import got from 'got';
import UIWebSocket from './UIWebSocket.js';
import {
    Models,
    Packets,
} from 'tournament-assistant-client';
import { logger } from '../main.js';
import { ScoreSaberPlayerInfo } from '../types/ScoreSaber.js';
import { TAPlayerInfo, TAScore } from '../types/TA.js';

// ? Early deprecation notice: This class will be refactored out in favor of the TA Client's State object.
// ? Perferably, we will have our own StateController class that will handle all of *our* state management.
export default class Game {

    users: Map<string, Models.User>;
    matches: Map<string, Models.Match>;
    scores: Map<string, TAScore>;
    currentMatch: string;
    scoresabers: Map<string, unknown>;

    constructor(private uiSocket: UIWebSocket) {
        this.users = new Map();
        this.matches = new Map();
        this.scores = new Map();
        this.scoresabers = new Map();
        this.currentMatch = "";
    }

    getCurrentMatchPlayers(): TAPlayerInfo[] {
        const playerGuids = this.matches.get(this.currentMatch)?.associated_users ?? [];
        return playerGuids.map(guid => this.playerUsers.find(u => u.guid === guid)).filter(Boolean) as TAPlayerInfo[];
    }

    async onGameStateUpdate() {
        const players = this.getCurrentMatchPlayers();
        this.uiSocket.sendToUI("game-state-update", {
            match: this.matches.get(this.currentMatch)?.toObject(),
            players,
        });

        const ids = players.map(p => p.user_id);

        const scoresabers = await this.updateScoresabers(ids)
        this.uiSocket.sendToUI("on-scoresaber-update", { scoresabers });
    }

    onScoreUpdate(score: TAScore) {
        const delay = this.users.get(score?.user_guid)?.stream_delay_ms ?? 0;
        setTimeout(() => {
            this.uiSocket.sendToUI("score-update", {
                scores: Object.fromEntries(this.scores),
            });
        }, delay + 1);
    }

    async updateUsers(users: Map<string, Models.User>) {
        this.users = users;
        await this.onGameStateUpdate();
    }

    async updateMatches(matches: Map<string, Models.Match>) {
        this.matches = matches;
        await this.onGameStateUpdate();
    }

    async updateUser(user: Models.User) {
        this.users.set(user.guid, user);
        await this.onGameStateUpdate();
    }

    async updateMatch(match: Models.Match) {
        this.matches.set(match.guid, match);
        this.currentMatch = match.guid;
        await this.onGameStateUpdate();
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

    async removeUser(user: Models.User) {
        this.users.delete(user.guid);
        await this.onGameStateUpdate();
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
            const response = await got.get(`https://scoresaber.com/api/player/${playerId}/full`);
            if (response.statusCode === 404) {
                return null;
            }

            // response OK
            return JSON.parse(response.body) as ScoreSaberPlayerInfo;
        } catch (e) {
            logger.warn(`Failed to get scoresaber info for ${playerId}, retrying...`);

            let attempts = 0;
            while (attempts < 3) {
                attempts++;
                try {
                    return await this.getScoresaber(playerId);
                } catch (e) {
                    logger.warn(`Failed to get scoresaber info for player ${playerId} on attempt ${attempts}/3: ${(e as Error).message}`);
                    continue;
                }
            }

            logger.error(`Failed to get scoresaber info for player ${playerId} after 3 attempts, giving up and returning null`);
            return null;
        }
    }
}