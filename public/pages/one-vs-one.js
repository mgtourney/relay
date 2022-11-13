import Header from './one-vs-one/header.js';
import Main from './one-vs-one/main.js';
import Footer from './one-vs-one/footer.js';

export default {
    data() {
        return {
            players: [],
            matches: {},
            scores: {},
            scoresabers: {},
        }
    },
    mounted() {
        this.relaySocket = new WebSocket("ws://localhost:2223");
        this.relaySocket.onmessage = (message) => {
            const data = JSON.parse(message.data);
            switch (data.Type) {
                case 0: return this.onTAConnected(data);
                case 1: return this.onHeartBeat(data);
                case 3: return this.onMatchUpdate(data);
                case 4: return this.onScoreUpdate(data);
                case 6: return this.onUsersUpdate(data);
                default:
                    console.log("Unknown message", data);
                    return;
            }
        };
        this.relaySocket.onopen = () => this.onConnected();
    },
    methods: {
        onConnected() {
            console.log("Connected to Relay");
        },
        onTAConnected() {
            console.log("Relay connected to TA");
        },
        onHeartBeat(data) {
            console.log("Heartbeat");
            this.onUsersUpdate(data);
            this.onMatchUpdate(data);
        },
        onMatchUpdate(matches) {
            console.log("Matches Update", matches);
            this.matches = matches.matches;
        },
        onScoreUpdate(scores) {
            console.log("Scores Update", scores);
            this.scores[scores.user_id] = scores;
        },
        onUsersUpdate(players) {
            console.log("Players Update", players);
            this.players = [...new Map(players.players.map(item => [item["user_id"], item])).values()];
            this.updateScoresabers();
        },
        updateScoresabers() {
            for (const player of this.players) {
                if (this.scoresabers[player.user_id] == null) {
                    this.getScoresaber(player.user_id).then(scoresaber => {
                        this.scoresabers[player.user_id] = scoresaber;
                    });
                }
            }
        },
        async getScoresaber(playerId) {
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
    },
    updated() {
        console.log("Updated HERE");
    },
    computed: {
        leftFlag() {
            return this.scoresabers[this.players[0]?.user_id]?.countryFlag;
        },
        rightFlag() {
            return this.scoresabers[this.players[1]?.user_id]?.countryFlag;
        },
        leftProfilePic() {
            return this.scoresabers[this.players[0]?.user_id]?.profilePicture;
        },
        rightProfilePic() {
            return this.scoresabers[this.players[1]?.user_id]?.profilePicture;
        },
        leftRank() {
            return this.scoresabers[this.players[0]?.user_id]?.rank;
        },
        rightRank() {
            return this.scoresabers[this.players[1]?.user_id]?.rank;
        },
    },
    components: {
        Header,
        Main,
        Footer,
    },
    template: /*html*/`
        <div id="background">
            <video class="background play" muted autoplay loop preload onloadstart="this.playbackRate = 1">
                <source src="videos/Chain.mp4" type="video/mp4">
            </video>
        </div>
        <div class="header"><Header></div>
        <div class="main"><Main></div>
        <div class="footer">
            <Footer 
                :leftrank="leftRank" 
                :rightrank="rightRank" 
                :leftname="players?.[0]?.name" 
                :rightname="players?.[1]?.name"
                :leftpicture="leftProfilePic"
                :rightpicture="rightProfilePic"
                :leftflag="leftFlag"
                :rightflag="rightFlag"
                >
        </div>
        <div class="blur"></div>
    `,
}
