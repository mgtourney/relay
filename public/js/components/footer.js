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
                <img class="country-image">
                <img class="player-image">
            </div>
            <div class="player-name">
                <span class="name">{{ leftname }}</span>
                <span>RANK <span class="rank">{{ leftrank }}</span></span>
            </div>
        </div>
        <div class="casters"></div>
        <div class="player right-player" id="right-player">
            <div class="profile-image">
                <img class="country-image">
                <img class="player-image">
            </div>
            <div class="player-name">
                <span class="name">{{ rightname }}</span>
                <span>RANK <span class="rank">{{ rightrank }}</span></span>
            </div>
        </div>
    `,
}
