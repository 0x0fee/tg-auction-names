import express from "express";
import basicAuth from 'express-basic-auth';
import cors from 'cors';
import history from 'connect-history-api-fallback';
import _ from "lodash";
import readline from 'readline';

import {RL, RL_ADMIN,
    fnAuthorizer, passUserRolesToHeader,
    getUsers, removeUser, changeUser, createUser,
    startUserChangesMonitor} from './auth.js';
import {getCurFetch, isFetching} from './fetcher.js';
import {fetchLastAuctionBid} from './api_gems.js';
import {readLast7dayItems, fetchLast7dayItems, getLastReadTimestamp} from './methods.js';
import {syncStorage, readLikes, writeLikes} from './storage.js';
import {log} from './utils/utils.js';


const port = process.env.PORT || 80;
const app = express();


app.use(cors({origin: 'http://localhost:8080'}));
app.use(history());
app.use(express.static('public'));
app.use(express.json());
app.use(basicAuth( { authorizer: fnAuthorizer } ));
app.use(passUserRolesToHeader);



// ================================================


app.get("/api/login", (req, res) => {
    res.json({state: true});
});


app.get("/api/start_fetching", RL_ADMIN, (req, res) => {
    const promise = fetchLast7dayItems();
    if (promise) {
        promise.then(() => {});
    }
    res.json({state: !!promise});
});


app.get("/api/get_items", (req, res) => {
    const items = readLast7dayItems();
    res.json(items);
});


app.get("/api/get_state", (req, res) => {
    const {startTime, maxTime, minTime, isInterrupted} = getCurFetch() || {};
    const lastTimestamp = getLastReadTimestamp();
    res.json({
        fetching: isFetching(),
        startTime,
        maxTime,
        minTime,
        isInterrupted,
        lastTimestamp
    })
});


app.get("/api/get_likes", (req, res) => {
    const user = req.auth.user;
    const likes = readLikes(user);
    res.json(likes);
});


app.post("/api/set_likes", (req, res) => {
    const user = req.auth.user;
    const likes = req.body || [];
    const cnt = writeLikes(user, likes);
    res.json(cnt);
});


app.get("/api/fetch_last_auction_bid", async (req, res) => {
    const value = await fetchLastAuctionBid(req.query.address);
    res.json({value: value?.amount});
});


app.get("/api/get_users", RL_ADMIN, (req, res) => {
    const users = getUsers();
    res.json(users);
});
app.put("/api/create_user", RL_ADMIN, (req, res) => {
    const userData = req.body || {};
    const error = createUser(userData);
    res.json({status: error});
});
app.post("/api/change_user", RL_ADMIN, (req, res) => {
    const userData = req.body || {};
    const error = changeUser(userData);
    res.json({status: error});
});
app.delete("/api/delete_user", RL_ADMIN, (req, res) => {
    const login = req.auth.user;
    const error = removeUser(login, req.query.login);
    res.json({status: error});
});


// ================================================


startUserChangesMonitor();


app.listen(port, () => {
    log("Server listening on port", port);
});



async function handleInterrupt() {
    await syncStorage();
}

if (process.platform === "win32") {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.on("SIGINT", () => {
        process.emit("SIGINT");
    });
}

process.on("SIGINT", async () => {
    await handleInterrupt();
    process.exit();
});
