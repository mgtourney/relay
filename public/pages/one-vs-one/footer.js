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
        return {
            leftDefaultProfilePicture: "https://cdn.scoresaber.com/avatars/76561198436848521.jpg",
            rightDefaultProfilePicture: "https://cdn.scoresaber.com/avatars/76561198347791418.jpg",
        }
    },
    computed: {},
    methods: {},
    template: /*html*/`
        <div class="footer">
            <div class="footer-left">
                <div class="footer-left-image">
                    <img :src="leftpicture || leftDefaultProfilePicture" />
                </div>
                <div class="footer-left-name">
                    <div class="footer-left-name-text primary">{{ leftname ?? "Goosy" }}</div>
                    <div class="footer-left-name-rank secondary"><small>#</small>{{ leftrank ?? 42 }}</div>
                </div>
            </div>
            <div class="footer-right">
                <div class="footer-right-image">
                    <img :src="rightpicture || rightDefaultProfilePicture" />
                </div>
                <div class="footer-right-name">
                    <div class="footer-right-name-text primary">{{ rightname ?? "Checksum" }}</div>
                    <div class="footer-right-name-rank secondary"><small>#</small>{{ rightrank ?? 69 }}</div>
                </div>
            </div>
        </div>
    `,
}
