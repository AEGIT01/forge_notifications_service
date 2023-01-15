import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import helmet from 'helmet';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

initializeApp({
    credential: applicationDefault(),
});

const app = express();

app.use(helmet());

app.use(bodyParser.urlencoded({
    extended:true,
}));

app.use(bodyParser.json());

app.use(cors());

var fcmTokens = [];

app.get('/', (req, res) => {
    res.send('Hello');
});

app.post('/fcm_token', (req, res) => {
    const token = req.body.token;
    if(!fcmTokens.includes(token)){
        fcmTokens = [...fcmTokens, token];
    }
    res.send({
        "status": "success",
    });
});

app.delete('/fcm_token', (req, res) => {
    const token = req.body.token;
    if(fcmTokens.includes(token)){
        fcmTokens = [...fcmTokens.filter((e) => e != token)];
    }
    res.send({
        "status": "success",
    });
});

app.get('/fcm_tokens', (req, res) => {
    res.send({
        "tokens": fcmTokens,
    });
});

app.post('/new_deployment', (req, res) => {
    if (fcmTokens.length > 0) {
        const body = req.body;
        const data = {
            "status": `${body.status}`,
            "server_id": `${body.server?.id}`,
            "server_name": `${body.server?.name}`,
            "site_id": `${body.site?.id}`,
            "site_name": `${body.site?.name}`,
            "commit_hash": `${body.commit_hash}`,
            "commit_url": `${body.commit_url}`,
            "commit_author": `${body.commit_author}`,
            "commit_message": `${body.commit_message}`
        };

        const message = {
            data: data,
            tokens: [...fcmTokens],
        };

        getMessaging().sendMulticast(message)
            .then((response) => {
                res.send({
                    "status": "success",
                });
            })
            .catch((error) => {
                console.log('Error sending message:', error);
                res.send({
                    "status": "failed",
                    // "error": error,
                });
            });
    } else {
        res.send({
            "status": "empty",
        })
    }
});

app.listen(1337, () => {
    console.log('listening on port 1337');
});