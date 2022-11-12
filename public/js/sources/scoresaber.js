

export default class Scoresaber {
    constructor() {
        this.players = [];
    }

    async update() {
        if (window.overlay.players == null) return;
        if (window.overlay.players.length === 0) return;

        window.overlay.scoresabers = window.overlay.scoresabers ?? {};
        for (const player of window.overlay.players) {
            if (window.overlay.scoresabers[player.user_id] == null) {
                window.overlay.scoresabers[player.user_id] = await this.getPlayer(player.user_id);
                const globalPlayer = window.overlay.players.find(p => p.user_id === player.user_id);
                if (globalPlayer != null) {
                    globalPlayer.scoresaber = window.overlay.scoresabers[player.user_id];
                }
                console.log("Updated scoresaber", player.user_id);
            }
        }
    }

    async getPlayer(playerId) {
        try {
            const response = await fetch(`https://scoresaber.com/api/player/${playerId}/full`);
            const result = await response.json();
            result.countryFlag = `https://flagcdn.com/h240/${result.country.toLowerCase()}.png`;
            return result;
        } catch (e) {
            console.error(e);
            new Promise(resolve => setTimeout(resolve, 1000));
            return fetchScoresaber(playerId);
        }
    }
}