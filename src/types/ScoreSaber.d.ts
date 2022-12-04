export interface ScoreSaberBadge {
    description: string;
    image: string;
}

export interface ScoreSaberScoreStats {
    totalScore: number;
    totalRankedScore: number;
    averageRankedAccuracy: number;
    totalPlayCount: number;
    rankedPlayCount: number;
    replaysWatched: number;
}

export interface ScoreSaberPlayerInfo {
    id: string;
    name: string;
    profilePicture: string;
    country: string;
    pp: number;
    rank: number;
    countryRank: number;
    role?: string;
    badges?: ScoreSaberBadge[];
    histories: string;
    scoreStats?: ScoreSaberScoreStats;
    permissions: number;
    banned: boolean;
    inactive: boolean;
}