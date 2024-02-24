import fs from 'fs';
import _ from "lodash";
import {log, err} from "./utils/utils.js";
import basicAuth from "express-basic-auth";


const STORAGE_DIR = 'store/'
const USER_CACHE_PROPS = {};


function fixName(user) {
    user = (user || 'default').trim();
    const fix = user.toLowerCase().replaceAll(/[^0-9a-z_]/g, '');
    if (fix.length !== user.length) {
        throw new Error('ERROR user name: must contains only: 0-9, a-z, _')
    }
    return fix;
}

function checkUserName(user) {
    fixName(user);
}


function getKey(user, prop) {
    user = fixName(user);
    return user + '--' + prop;
}
function parseKey(key) {
    const idx = key.indexOf('--');
    if (idx < 0) {
        return null;
    }
    const user = key.substring(0, idx);
    const prop = key.substring(idx+2);
    return {
        user: fixName(user),
        prop,
    }
}
function getFileNameByKey(key) {
    parseKey(key);  // test key format
    return STORAGE_DIR + '' + key + '.txt';
}



function syncStorage() {
    log('Synchronizing storage...');
    Object.entries(USER_CACHE_PROPS)
        .filter(([key, cache]) => cache.dirty)
        .forEach(([key, cache]) => {
            const file = getFileNameByKey(key);
            if (cache.items.length || fs.existsSync(file)) {
                const data = JSON.stringify(cache.items, null, 3);
                fs.writeFileSync(file, data, "utf-8");
            }
            cache.dirty = false;
        })
}

const delayOpts = {leading: false, trailing: true};
const delaySyncStorage = _.debounce(syncStorage, 10000, delayOpts) || (() => {});


function readUserData(user, prop) {
    const key = getKey(user, prop);
    const cache = USER_CACHE_PROPS[key];

    if (cache) {
        return cache;
    }

    let items = [];
    let mapItems = {};
    const file = getFileNameByKey(key);

    if (fs.existsSync(file)) {
        let text = '';
        try {
            text = fs.readFileSync(file, "utf-8").trim();
        }
        catch(e) {
            err('Error read file:', file);
        }
        try {
            items = text ? JSON.parse(text) : [];
            mapItems = _.keyBy(items, 'name');
        }
        catch(e) {
            err('Error parsing JSON:', text, e);
        }
    }

    return USER_CACHE_PROPS[key] = {
        items,
        mapItems,
        dirty: false
    }
}


function addToStore(user, prop, list) {
    const cache = readUserData(user, prop);
    const {items, mapItems} = cache;

    list = list.filter(d => !mapItems[d.name]);

    if (list.length) {
        items.push(...list);
        list.forEach(d => {
            mapItems[d.name] = d;
        })
        cache.dirty = true;

        delaySyncStorage();
    }
    return list.length;
}


function removeFromStore(user, prop, list) {
    const cache = readUserData(user, prop);
    const {mapItems} = cache;

    list = list.filter(d => mapItems[d.name]);

    if (list.length) {
        const map = _.keyBy(list, 'name');
        cache.items = cache.items.filter(d => !map[d.name]);
        list.forEach(d => {
            delete mapItems[d.name];
        })
        cache.dirty = true;

        delaySyncStorage();
    }
    return list.length;
}



// likes:
// item = {name='', value=(0 | 1 | 2 | 3), created, address}
// if value = 0 - remove item

function readLikes(user) {
    const data = readUserData(user, 'likes');
    return data.items;
}
function writeLikes(user, values) {
    values = (values || []).filter(d => d.name && d.added && d.address && d.created && d.like != null);
    const add = values.filter(d => d.like > 0);
    const remove = values.filter(d => d.like <= 0);
    const cnt = {add: 0, remove: 0};
    if (add.length) {
        cnt.add = addToStore(user, 'likes', add);
    }
    if (remove.length) {
        cnt.remove = removeFromStore(user, 'likes', remove);
    }
    return cnt;
}



export {
    checkUserName,
    readLikes, writeLikes,
    syncStorage
}
