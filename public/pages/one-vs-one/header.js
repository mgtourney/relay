export default {
    data() {
        return {}
    },
    template: /*html*/`
        <div class="accuracy">
            <div class="left-score-wrapper loser">
                <span class="score"></span>
                <span class="acc">
                    <ta-acc type="left" />
                </span>
            </div>
        </div>
        <div class="accuracy">
            <div class="right-score-wrapper">
                <span class="acc">98.20</span>
                <span class="score"></span>
            </div>
        </div>
    `,
}
