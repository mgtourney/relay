import express from 'express';

const app = express();
const config = {
    OVERLAY_PORT: 3000
};

app.use(express.static('public'));
app.listen(config.OVERLAY_PORT, () => {
    console.log(`Example app listening on http://localhost:${config.OVERLAY_PORT}`);
});

