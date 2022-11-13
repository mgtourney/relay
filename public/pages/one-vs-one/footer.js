export default {
    props: {
        leftrank: { String },
        rightrank: { String },
        leftname: { String },
        rightname: { String },
        leftpicture: { String },
        rightpicture: { String },
        leftflag: { String },
        rightflag: { String },
    },
    data() {
        return {}
    },
    computed: {},
    template: /*html*/`
        <div class="player left-player loser">
            <div class="profile-image">
                <img class="country-image" :src="leftflag">
                <img class="player-image" :src="leftflag">
            </div>
            <div class="player-name">
                <span class="name">{{ leftname }}</span>
                <span class="rank">RANK &nbsp;{{ leftrank }}</span>
            </div>
        </div>
        <div class="casters"></div>
        <div class="player right-player" id="right-player">
            <div class="profile-image">
                <img class="country-image" :src="rightflag">
                <img class="player-image" :src="rightpicture">
            </div>
            <div class="player-name">
                <span class="name">{{ rightname }}</span>
                <span class="rank">RANK &nbsp;{{ rightrank }}</span>
            </div>
        </div>
    `,
}
