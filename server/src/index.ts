import express from 'express';
import dotenv from "dotenv";
import path from 'path';
dotenv.config();

const app = express();
const config = {
    OVERLAY_PORT: 3000
};

app.use(express.static('public'));
app.listen(config.OVERLAY_PORT, () => {
    console.log(`Example app listening on http://localhost:${config.OVERLAY_PORT}`);
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, "../../public/login.html"));
});


app.get('/mod', async (req, res) => {
    res.sendFile(path.join(__dirname, '../../private/mod.html'));
});