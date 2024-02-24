import fs from 'fs';
import _ from "lodash";
import {
    log, err,
    wait, nowsec,
    splitExt,
    sec2str, timestamp2str, timestamp2strHum, parseStrTimestamp
} from './utils/utils.js';
import {startFetch, isFetching} from './fetcher.js';
import {readCachedFile} from './utils/file.js';


const STORAGE_DIR = 'downloads/'
const SEVEN_DAY = 7 * 24 * 3600;
const POSTFIX = '_paused';


function fileNameByTimestamp(timestamp, isPaused=false) {
    if (isPaused) {
        return STORAGE_DIR + timestamp2str(timestamp) + POSTFIX + '.json';
    }
    return STORAGE_DIR + timestamp2str(timestamp) + '.json';
}

function isPausedName(name) {
    return name.endsWith(POSTFIX);
}
function normalizeName(name) {
    return isPausedName(name) ? name.substring(0, name.length-POSTFIX.length) : name;
}



function getDownloadMetaFiles(endTime=null) {
    const metas = fs.readdirSync(STORAGE_DIR)
        .filter(fileName => splitExt(fileName)[1] === '.json')
        .map(fileName => STORAGE_DIR + fileName)
        .map(fileName => {
            const name = splitExt(fileName)[0];
            const isPaused = isPausedName(name);
            const normName = normalizeName(name);

            const meta = parseStrTimestamp(normName);
            return meta ? {...meta, isPaused} : null;
        })
        .filter(d => d);

    const ordered = _.orderBy(metas, 'timestamp', 'desc');
    if (endTime) {
        return ordered.filter(meta => meta.timestamp >= endTime);
    }
    return ordered;
}




function startFetch__(maxTime, minTime, callback) {
    callback([1, 2, 3]);
    return wait(1000);
}


async function fetchItemsToFile(maxTime, minTime) {
    const tempFileName = fileNameByTimestamp(maxTime, true);
    const fileName = fileNameByTimestamp(maxTime);
    let items = [];

    if (fs.existsSync(tempFileName)) {
        log(`[Reading Paused] file: ${tempFileName}`);
        const data = fs.readFileSync(tempFileName, "utf-8");
        items = JSON.parse(data);
        items = _.orderBy(items, 'createdAt', 'desc');
        if (items.length) {
            maxTime = items[items.length - 1].createdAt;
        }
        log(`Find items: ${items.length}`);
    }

    if (isFetching()) {
        log(`[Already started!]`);
        throw Error('Already started');
    }

    log(`[Starting] from: ${timestamp2strHum(maxTime)} to ${timestamp2strHum(minTime)}, delta: ${sec2str(maxTime-minTime)}`);

    await startFetch(maxTime, minTime, (partItems) => {
        partItems = _.orderBy(partItems, 'createdAt', 'desc');
        items = [...items, ...partItems];
        log(`[Storing] file: ${tempFileName}`);
        fs.writeFileSync(tempFileName, JSON.stringify(items, null, 3), "utf-8");
    })

    if (fs.existsSync(tempFileName)) {
        log(`[Rename] temp file: ${tempFileName}, to: ${fileName}`);
        fs.renameSync(tempFileName, fileName);
    }
}



let lastUnpauseMeta = null;

function getLastReadTimestamp() {
    return lastUnpauseMeta?.timestamp;
}



function fetchLast7dayItems() {
    return fetchLastItems(SEVEN_DAY);
}

async function fetchLastItems(lastSec) {
    if (isFetching()) {
        return;
    }

    const endTime = nowsec(-lastSec);
    const metas = getDownloadMetaFiles(endTime);

    // add first download
    if (!metas.length || nowsec() - metas[0].timestamp >= 3600) {
        const str = timestamp2str(nowsec());
        const meta = parseStrTimestamp(str);
        meta.isPaused = true;
        metas.unshift(meta);
    }

    log(`[List dates]`);
    metas.forEach(meta => log(meta.str))

    // download with download paused
    try {
        for (let i = 0; i < metas.length; i++) {
            const meta = metas[i];
            const metaNext = metas[i+1];
            if (meta.timestamp < endTime) {
                break;
            }
            if (!meta.isPaused) {
                continue;
            }

            const maxTime = meta.timestamp;
            let minTime = metaNext?.timestamp || endTime;

            if (minTime < endTime) {
                minTime = endTime - minTime >= 6*3600 ? endTime : minTime;
            }

            await fetchItemsToFile(maxTime, minTime);
            await wait(2000);
        }
    }
    catch(error) {
        err(error);
    }

    lastUnpauseMeta = getDownloadMetaFiles(endTime).find(d => !d.isPaused);

    log('[Finished]');
}



const MAP_CACHED_FILES = {};

function readLast7dayItems() {
    const items = readLastItems(SEVEN_DAY)
    return transformItems(items);
}

function readLastItems(lastSec) {
    const endTime = nowsec(-lastSec);
    const metas = getDownloadMetaFiles(endTime);
    lastUnpauseMeta = metas.find(d => !d.isPaused);

    log(`[List dates]`);
    metas.forEach(meta => log(meta.str))

    let items = [];
    metas.forEach(meta => {
        const fileName = fileNameByTimestamp(meta.timestamp, meta.isPaused);
        const dataItems = readCachedFile(MAP_CACHED_FILES, fileName, 'list');
        items = [...items, ...dataItems];
    })

    log('[Count]: ' + items.length);

    items = _.uniqBy(items, 'nft.name');
    items = _.orderBy(items, 'createdAt', 'asc');

    log('[Uniq Count]: ' + items.length);
    return items;
}


function transformItems(items) {
    return items.map(item => ({
        created: item.createdAt,
        name: item.nft.name,
        address: item.nft.address
    }))
}



export {
    fetchLast7dayItems,
    readLast7dayItems,
    getLastReadTimestamp,
}


