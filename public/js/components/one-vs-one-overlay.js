import Header from './header.js';
import Main from './main.js';
import Footer from './footer.js';

export default {
    data() {
        return {
            players: [],
            matches: {},
            scores: {},
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
        onHeartBeat() {
            console.log("Heartbeat");
        },
        onMatchUpdate(matches) {
            console.log("Matches Update", matches);
            this.matches = matches.matches;
        },
        onScoreUpdate(scores) {
            console.log("Scores Update", scores);
            this.scores = scores.scores;
        },
        onUsersUpdate(players) {
            console.log("Players Update", players);
            this.players = [...new Map(players.players.map(item => [item["user_id"], item])).values()];
            this.updateScoresabers();
        },
        updateScoresabers() {
            for (const player of this.players) {
                if (player.scoresaber == null) {
                    this.getScoresaber(player.user_id).then(scoresaber => {
                        player.scoresaber = scoresaber;
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
    computed: {},
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
                :leftrank="players?.[0]?.scoresaber?.rank" 
                :rightrank="players?.[1]?.scoresaber?.rank" 
                :leftname="players?.[0]?.name" 
                :rightname="players?.[1]?.name"
                :leftpicture="players?.[0]?.scoresaber?.profilePicture"
                :rightpicture="players?.[1]?.scoresaber?.profilePicture"
                :leftflag="players?.[0]?.scoresaber?.countryFlag"
                :rightflag="players?.[1]?.scoresaber?.countryFlag"
                >
        </div>
        <div class="blur"></div>
    `,
}
