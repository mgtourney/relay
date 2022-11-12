export default {
    data() {
        return {
            leftscore: window.overlay.players?.[0]?.score ?? 0,
            rightscore: window.overlay.players?.[1]?.score ?? 0,
        }
    },
    template: /*html*/`
        <div class="accuracy">
            <div class="left-score-wrapper loser">
                <span class="score">{{ leftscore }}</span>
                <span class="acc">
                    <ta-acc type="left" />
                </span>
            </div>
        </div>
        <div class="accuracy">
            <div class="right-score-wrapper">
                <span class="acc">98.20</span>
                <span class="score">{{ rightscore }}</span>
            </div>
        </div>
    `,
}
