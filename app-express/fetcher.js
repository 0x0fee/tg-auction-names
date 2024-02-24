import _ from 'lodash';
import axios from "axios";
import {
    log, err,
    sec2str, timestamp2strHum,
    waitStop, randomRange} from './utils/utils.js';



const GEMS_URL = 'https://api.getgems.io/graphql';


/**
 * Fetching items. Example item:
 * {
 *    "createdAt": 1707838011,
 *    "nft": {
 *       "name": "@suamii",
 *       "address": "EQBHFROEFeU-H2SNRnsBhumJ7TRzfIHcvuD2pF5pXg00lU-1"
 *    }
 * }
 */
function fetchData(maxTime, count) {
    const data = {
        query: "query GetLastNFTsQuery($collectionAddress: String!, $types: [HistoryType!], $first: Int!, $maxTime: Int) {\n  historyCollectionNftItems(collectionAddress: $collectionAddress, types: $types, first: $first, maxTime: $maxTime) {\n    items {\n      createdAt\n      nft {\n        name\n        address\n      }\n    }\n  }\n}\n",
        variables: {
            collectionAddress: "EQCA14o1-VWhS2efqoh_9M1b_A9DtKTuoqfmkn83AbJzwnPi",
            types: ["Mint"],
            first: count,
            maxTime: maxTime
        },
        operationName: "GetLastNFTsQuery"
    };

    return axios.post(GEMS_URL, data);
}


function createFetchState(maxTime, minTime) {
    return {
        startTime: maxTime || 0,
        maxTime: maxTime || 0,
        minTime: minTime || 0,
        isInterrupted: false,
        promise: null,
        tryCount: 0,
        lastError: null,
        loopCount: 0
    }
}


const MAX_TRY_COUNT = 3;
let CUR_FETCH = createFetchState();


const GET_FETCH_COUNT = (maxTime, minTime) => {
    const delta = maxTime - minTime;
    return delta >= 12 * 3600 ? 50
        : delta >= 6 * 3600 ? 50
            : delta >= 3600 ? 30
                : 20;
};


async function fetchAllData(state, handleFetchedItems) {
    let fetchCount = 0;

    while(state.tryCount < MAX_TRY_COUNT && state.maxTime >= state.minTime && !state.isInterrupted) {
        state.loopCount++;

        if (!state.tryCount) {
            fetchCount = GET_FETCH_COUNT(state.maxTime, state.minTime);
            log(`[Fetch]: from ${timestamp2strHum(state.maxTime)}, to ${timestamp2strHum(state.minTime)}, delta=${sec2str(state.maxTime-state.minTime)}, count=${fetchCount}`);

            const wait_ms = state.loopCount === 1 ? 1000 : randomRange(3000, 5000);
            await waitStop(wait_ms, () => state.isInterrupted);
        }
        else {
            const wait_ms = 4 * state.tryCount * randomRange(1000, 2000);
            const wait_sec = Math.round(wait_ms / 1000);
            log(`[Try fetch]: ${state.tryCount}/${MAX_TRY_COUNT}]. Wait ${wait_sec} sec...`);

            await waitStop(wait_ms, () => state.isInterrupted);
        }

        if (state.isInterrupted) {
            break;
        }

        try {
            const resp = await fetchData(state.maxTime, fetchCount);

            state.tryCount = 0;
            state.lastError = null;
            if (state.isInterrupted) {
                break;
            }

            const respData = resp.data;
            if (respData.errors) {
                log(respData.errors);
            }
            const respItems = respData.data.historyCollectionNftItems.items || [];
            const items = _.orderBy(respItems, 'createdAt', 'desc');

            log(`Fetched count: ${items.length}`)

            if (!items.length) {
                log(`Fetch stopped on zero count`);
                break;
            }

            const stop = await handleFetchedItems(items);
            if (stop) {
                log(`Fetch stopped by callback`);
                break;
            }

            const fetchedMinTime = items[items.length - 1].createdAt;
            if (fetchedMinTime < state.minTime) {
                log(`Fetch stopped by minTime: fetched=${fetchedMinTime}, required=${state.minTime}`);
                break;
            }

            if (fetchedMinTime === state.maxTime) {
                log(`Strange error! fetched minTime IS EQUALS to maxTime`);
                break;
            }

            state.tryCount = 0;
            state.maxTime = fetchedMinTime;
        }
        catch(error) {
            state.tryCount++;
            log('Error fetch data!');
            err(error);
            state.lastError = error;
        }
    }

    if (state.isInterrupted) {
        log('Fetching was interrupted');
        throw 'interrupted';
    }
    else if (state.tryCount >= MAX_TRY_COUNT) {
        throw state.lastError;
    }

    return;
}


function isFetching() {
    return !!CUR_FETCH?.promise;
}

function startFetch(maxTime, minTime, handleFetchedItems) {
    if (isFetching()) {
        return null;
    }

    const fetchState = CUR_FETCH = createFetchState(maxTime, minTime);

    fetchState.promise = fetchAllData(fetchState, handleFetchedItems)
        .finally(() => {
            fetchState.promise = null;
        })

    return fetchState.promise;
}


function stopFetch() {
    if (!isFetching()) {
        return false;
    }
    CUR_FETCH.isInterrupted = true;
    CUR_FETCH = null;
    return true;
}


function getCurFetch() {
    return CUR_FETCH;
}


export {
    startFetch,
    stopFetch,
    isFetching,
    getCurFetch
};
