import express from 'express';
import dotenv from "dotenv";
import path from 'path';
import fetch from 'node-fetch';
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
    const loggedIn = await isLoggedIn(req);
    if (!loggedIn) {
        console.log('Not logged in');
        res.redirect('/login');
        return;
    }

    res.sendFile(path.join(__dirname, '../../private/mod.html'));
});


app.get('/auth', async (req, res) => {
    if (req.query.token_type == null || req.query.access_token == null) {
        res.sendFile(path.join(__dirname, '../../private/auth.html'));
        return;
    }

    res.redirect(`/mod?token_type=${req.query.token_type}&access_token=${req.query.access_token}`);
});


function isLoggedIn(req) {
    return new Promise((resolve, reject) => {
        const { token_type, access_token } = req.query;
        if (token_type == null || access_token == null) {
            resolve(false);
            return;
        }

        console.log(`Checking if logged in with ${token_type} ${access_token}`);

        fetch('https://discord.com/api/users/@me', {
            headers: {
                authorization: `${token_type} ${access_token}`,
            },
        })
        .then(result => result.json())
        .then(response => {
            console.log(response);
            const { username, discriminator } = response;
            if (response.message !== '401: Unauthorized' && username != null && discriminator != null) {
                console.log(`Authorized ${username}#${discriminator}`);
                resolve(true);
            }

            resolve(false);
        })
        .catch(() => {
            resolve(false);
        });
    });
}
