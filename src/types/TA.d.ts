import { Models } from 'tournament-assistant-client';

export interface TAPlayerInfo {
    name: string,
    type: Models.User.ClientTypes,
    user_id: string,
    guid: string,
    stream_delay_ms: number,
    stream_sync_start_ms: number,
}

export interface TAScore {
    user_id: string | undefined
    user_guid: string
    score: number
    accuracy: number
    combo: number
    notesMissed: number
    badCuts: number
    bombHits: number
    wallHits: number
    maxCombo: number
    lhAvg: number[]
    lhBadCut: number
    lhHits: number
    lhMiss: number
    rhAvg: number[]
    rhBadCut: number
    rhHits: number
    rhMiss: number
    totalMisses: number
}
