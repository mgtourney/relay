
export default class OneVsOneOverlay {

    constructor(...dataSources) {
        this.sources = dataSources;

        setInterval(() => {
            this.sources.forEach(source => source.update());
            this.update();
        }, 200);
    }

    update() {
        // this.updateLoser();
        // this.updateScores();
        // this.updatePlayer();
    }

    updatePlayer() {
        this.left.name.innerText = window.overlay.players[0]?.name;
        this.right.name.innerText = window.overlay.players[1]?.name;
        this.left.country.src = `https://flagcdn.com/h240/${this.left.scoresaber.country.toLowerCase()}.png`;
        this.right.country.src = `https://flagcdn.com/h240/${this.right.scoresaber.country.toLowerCase()}.png`;
        this.left.playerImage.src = this.left.scoresaber.profilePicture;
        this.right.playerImage.src = this.right.scoresaber.profilePicture;
    }

    updateScores() {
        this.left.score.innerText = this.left.playerScores.score.toString().split('').reverse().join('').replace(/([0-9]{3})/g, "$1 ").split('').reverse().join('');
        this.left.acc.innerText = (this.left.playerScores.accuracy * 100).toFixed(2);
        this.left.rank.innerText = this.left.scoresaber.rank;

        this.right.score.innerText = this.right.playerScores.score.toString().split('').reverse().join('').replace(/([0-9]{3})/g, "$1 ").split('').reverse().join('');
        this.right.acc.innerText = (this.right.playerScores.accuracy * 100).toFixed(2);
        this.right.rank.innerText = this.right.scoresaber.rank;

        const accDiffA = this.left.playerScores.accuracy - this.right.playerScores.accuracy;
        const accDiffB = this.right.playerScores.accuracy - this.left.playerScores.accuracy;
        const SENSITIVITY = 800;
        if (accDiffA > 0) {
            const accDiff = Math.min(100, (1 - (1 / Math.exp(accDiffA / 10))) * SENSITIVITY);
            this.left.accLine.style.width = `${accDiff}%`;
            this.right.accLine.style.width = `0%`;
        } else {
            const accDiff = Math.min(100, (1 - (1 / Math.exp(accDiffB / 10))) * SENSITIVITY);
            this.left.accLine.style.width = `0%`;
            this.right.accLine.style.width = `${accDiff}%`;
        }
    }

    updateLoser() {
        const leftAcc = this.left.playerScores.accuracy;
        const rightAcc = this.right.playerScores.accuracy;

        if (leftAcc > rightAcc) {
            this.left.scoreWrapper.classList.remove("loser");
            this.left.player.classList.remove("loser");
            this.right.scoreWrapper.classList.add("loser");
            this.right.player.classList.add("loser");
        } else {
            this.left.scoreWrapper.classList.add("loser");
            this.left.player.classList.add("loser");
            this.right.scoreWrapper.classList.remove("loser");
            this.right.player.classList.remove("loser");
        }
    }
}
