
const DATA = {
    players: {
        left: {
            name: "GoosyChan",
            scoresaberId: "76561198436848521",
            country: "de",
            rank: 413,
            accuracy: 97.78,
            score: 1334678,
        },
        right: {
            name: "Kakifrucht",
            scoresaberId: "76561198014365525",
            country: "de",
            rank: 157,
            accuracy: 98.90,
            score: 1432123,
        },
    },
};
const SENSITIVITY = 800;

update(DATA);

function update(data) {
    const leftScoreWrapper = document.querySelector(".left-score-wrapper");
    const rightScoreWrapper = document.querySelector(".right-score-wrapper");
    const leftScore = document.querySelector(".left-score-wrapper .score");
    const rightScore = document.querySelector(".right-score-wrapper .score");
    const leftAcc = document.querySelector(".left-score-wrapper .acc");
    const rightAcc = document.querySelector(".right-score-wrapper .acc");
    const leftRank = document.querySelector(".left-player .rank");
    const rightRank = document.querySelector(".right-player .rank");
    const leftName = document.querySelector(".left-player .name");
    const rightName = document.querySelector(".right-player .name");
    const leftCountry = document.querySelector(".left-player .country-image");
    const rightCountry = document.querySelector(".right-player .country-image");
    const leftPlayerImage = document.querySelector(".left-player .player-image");
    const rightPlayerImage = document.querySelector(".right-player .player-image");
    const leftPlayer = document.querySelector(".left-player");
    const rightPlayer = document.querySelector(".right-player");
    const leftAccLine = document.querySelector(".main .left .acc-line");
    const rightAccLine = document.querySelector(".main .right .acc-line");

    if (data.players.left.accuracy > data.players.right.accuracy) {
        leftScoreWrapper.classList.remove("loser");
        rightScoreWrapper.classList.add("loser");
        leftPlayer.classList.remove("loser");
        rightPlayer.classList.add("loser");
    } else {
        leftScoreWrapper.classList.add("loser");
        rightScoreWrapper.classList.remove("loser");
        leftPlayer.classList.add("loser");
        rightPlayer.classList.remove("loser");
    }

    leftScore.innerText = data.players.left.score.toString().split('').reverse().join('').replace(/([0-9]{3})/g, "$1 ").split('').reverse().join('');
    rightScore.innerText = data.players.right.score.toString().split('').reverse().join('').replace(/([0-9]{3})/g, "$1 ").split('').reverse().join('');
    leftAcc.innerText = data.players.left.accuracy.toFixed(2);
    rightAcc.innerText = data.players.right.accuracy.toFixed(2);
    leftRank.innerText = data.players.left.rank;
    rightRank.innerText = data.players.right.rank;
    leftName.innerText = data.players.left.name;
    rightName.innerText = data.players.right.name;
    leftCountry.src = `https://flagcdn.com/h240/${data.players.left.country}.png`;
    rightCountry.src = `https://flagcdn.com/h240/${data.players.right.country}.png`;
    leftPlayerImage.src = `https://cdn.scoresaber.com/avatars/${data.players.left.scoresaberId}.jpg`;
    rightPlayerImage.src = `https://cdn.scoresaber.com/avatars/${data.players.right.scoresaberId}.jpg`;
    
    const accDiffA = data.players.left.accuracy - data.players.right.accuracy;
    const accDiffB = data.players.right.accuracy - data.players.left.accuracy;
    if (accDiffA > 0) {
        const accDiff = (1 - (1 / Math.exp(accDiffA / 10))) * SENSITIVITY;
        leftAccLine.style.width = `${Math.min(100, accDiff)}%`;
        rightAccLine.style.width = `0%`;
    } else {
        const accDiff = (1 - (1 / Math.exp(accDiffB / 10))) * SENSITIVITY;
        leftAccLine.style.width = `0%`;
        rightAccLine.style.width = `${Math.min(100, accDiff)}%`;
    }
}
