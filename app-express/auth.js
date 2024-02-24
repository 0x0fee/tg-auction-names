import {readCachedFile} from './utils/file.js';
import fs from "fs";
import _ from "lodash";


const SECRET_FILE = 'secrets.json';
const USER_CACHE = {};
let USERS = [];
let MAP_USERS = {};

const ROLE = {
    admin: 'admin'
}

const DEF_ADMIN = {
    login: 'admin',
    password: '123456',
    roles: [ROLE.admin]
}


function RL(exp) {
    const str = exp.replace(/[a-zA-Z_][a-zA-Z0-9_]*/g, (match) => {
        return `map['${match}']`;
    });
    return function(req, res, next) {
        const user = MAP_USERS[req.auth.user];
        const map = _.keyBy(user?.roles || []);
        const check = eval(str);
        if (check) {
            next();
        } else {
            res.status(403).end();
        }
    }
}

const RL_ADMIN = RL(ROLE.admin);

let USER_MONITORING = null;


function getUserByLogin(login) {
    return MAP_USERS[login];
}

function fnAuthorizer(login, password) {
    const user = getUserByLogin(login);
    return !!user && user.password === password;
}

function passUserRolesToHeader(req, res, next) {
    let header = res.getHeader('Access-Control-Expose-Headers') || '';
    header = header + (header ? ', ' : '') + 'User-Roles';

    const login = req.auth.user;
    const user = MAP_USERS[login];
    const roles = user.roles.join(',');

    res.setHeader('Access-Control-Expose-Headers', header);
    res.setHeader('User-Roles', roles);
    next();
}


function startUserChangesMonitor() {
    if (USER_MONITORING) {
        return;
    }
    USER_MONITORING = true;
    readCachedUsers();
    setInterval(() => {
        readCachedUsers();
    }, 10000);
}

function getUsers() {
    readCachedUsers();
    return USERS.map(d => _.omit(d, 'password'));
}

function fixEmptyAdmin() {
    if (!MAP_USERS[DEF_ADMIN.login]) {
        USERS.push(DEF_ADMIN);
        MAP_USERS[DEF_ADMIN.login] = DEF_ADMIN;
        fs.writeFileSync(SECRET_FILE, JSON.stringify(USERS, null, 3), "utf-8");
    }
}

function readCachedUsers() {
    USERS = readCachedFile(USER_CACHE, SECRET_FILE, 'list') || [];
    MAP_USERS = _.keyBy(USERS, 'login');
    fixEmptyAdmin();
}

function checkPassword(pass) {
    pass = (pass || '').trim();
    if (pass.length < 3) {
        return 'Wrong password: length must be 3 or more';
    }
    return true;
}
function checkLogin(login) {
    login = (login || '').trim();
    if (login.length < 3) {
        return 'Wrong login: length must be 3 or more';
    }
    if (!/^[a-zA-Z][a-zA-Z0-9_]+[a-zA-Z0-9]$/.test(login)) {
        return 'Wrong letters: must be [a-z], [A-Z], [0-9], _';
    }
    return true;
}
function correctRoles(roles, login=null) {
    roles = roles || [];
    roles = _.isArray(roles) ? roles : [roles];
    if (login) {
        if (login === DEF_ADMIN.login && !roles.includes(ROLE.admin)) {
            roles.push(ROLE.admin);
        }
    }
    return roles.map(d => d.trim()).filter(d => d && ROLE[d]);
}


function createUser(userData) {
    let {login, password, roles} = userData || {};
    login = (login || '').trim();
    password = (password || '').trim();

    if (MAP_USERS[login]) {
        return 'User already exists!';
    }

    if (checkLogin(login) !== true) {
        return checkLogin(login);
    }
    if (checkPassword(password) !== true) {
        return checkPassword(password);
    }
    roles = correctRoles(roles, login);

    const newUser = {login, password, roles};
    USERS.push(newUser);
    MAP_USERS[login] = newUser;

    fs.writeFileSync(SECRET_FILE, JSON.stringify(USERS, null, 3), "utf-8");
    return true;
}

function changeUser(userData) {
    let {login, password, roles} = userData || {};
    login = (login || '').trim();
    password = (password || '').trim();

    const user = MAP_USERS[login];
    if (!user) {
        return `User not found: ${login}`;
    }
    let changes = false;

    if (password) {
        changes = true;
        if (checkPassword(password) !== true) {
            return checkPassword(password);
        }
        user.password = password;
    }
    if (roles) {
        changes = true;
        user.roles = correctRoles(roles, login);
    }
    if (changes) {
        fs.writeFileSync(SECRET_FILE, JSON.stringify(USERS, null, 3), "utf-8");
        return true;
    }
    return 'Nothing changes!';
}

function removeUser(curLogin, login) {
    login = (login || '').trim();

    if (login === curLogin) {
        return "You can't remove yourself";
    }
    if (login === DEF_ADMIN.login) {
        return "You can't remove user with login 'admin'";
    }
    if (MAP_USERS[login]) {
        USERS = USERS.filter(d => d.login !== login);
        delete MAP_USERS[login];

        fs.writeFileSync(SECRET_FILE, JSON.stringify(USERS, null, 3), "utf-8");
        return true;
    }
    return `User "${login}" not found!`;
}



export {
    fnAuthorizer, passUserRolesToHeader,
    getUsers, removeUser, changeUser, createUser,
    startUserChangesMonitor,
    RL, RL_ADMIN
}


