


function log(...args) {
    console.log(...args);
}
function err(...args) {
    console.error(...args);
}


function now() {
    return (new Date()).getTime();
}

function nowsec(offset=0) {
    return parseInt((new Date()).getTime()/ 1000) + parseInt(offset);
}


const zeroPadLeft = (str, cnt) => {
    str = ''+str;
    while(str.length < cnt) {
        str = '0' + str;
    }
    return str;
};


const to2d = (n) => !n ? '00' : n < 10 ? '0'+n : (''+n);


function parseNumTimestamp(num) {
    num = +num;
    const date = new Date(num * 1000);
    const Y = date.getUTCFullYear();
    const M = date.getUTCMonth() + 1;
    const D = date.getUTCDate();
    const h = date.getUTCHours();
    const m = date.getUTCMinutes();
    const s = date.getUTCSeconds();
    const YYYY = '' + Y;
    const YY = to2d(Y % 100);
    const MM = to2d(M);
    const DD = to2d(D);
    const hh = to2d(h);
    const mm = to2d(m);
    const ss = to2d(s);
    return {
        date,
        Y, M, D, h, m, s,
        YYYY, YY, MM, DD, hh, mm, ss,
    };
}


function timestamp2str(num, format='YYYYMMDD_hhmmss') {
    const tm = parseNumTimestamp(num);
    const keys = ['YYYY', 'YY', 'MM', 'DD', 'hh', 'mm', 'ss'];
    keys.forEach(key => {
        format = format.replaceAll(key, tm[key]);
    })
    return format;
}

function timestamp2strHum(num) {
    return timestamp2str(num, 'DD.MM.YYYY hh:mm:ss');
}



const MONTHS_RU = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек']
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
function timestamp2strHum2(num) {
    const date = new Date();
    const curY = date.getFullYear();
    const tm = parseNumTimestamp(num);
    return tm.D + ' ' + MONTHS[tm.M - 1] + ' ' + (tm.Y === curY ? '' : tm.Y) + `${tm.hh}:${tm.mm}:${tm.ss}`;
}


function parseStrTimestamp(str) {
    const regexp = /^(20\d{2})(0[1-9]|1[012])([0123][0-9])_([01][0-9]|2[0-3])([0-5][0-9])([0-5][0-9])$/;
    if (!regexp.test(str)) {
        return null;
    }
    const z = str.match(regexp);
    const [Y, M, D] = z.slice(1).map(d => +d);
    const [h, m, s] = z.slice(4).map(d => +d);

    const date = new Date(Date.UTC(Y, M-1, D, h, m, s, 0));

    return {
        str,
        date,
        timestamp: parseInt(date.getTime() / 1000),
        Y, M, D,
        h, m, s
    }
}

function sec2str(sec) {
    let dd = Math.floor(sec / (24*3600));
    let hh = to2d(Math.floor(sec/3600) % 24);
    let mm = to2d(Math.floor(sec/60) % 60);
    let ss = to2d(sec % 60);
    return (dd > 0 ? (dd + 'd ')  : '') + `${hh}:${mm}:${ss}`;
}



function wait(ms = 1000) {
    if (ms < 0) {
        return Promise.resolve();
    }
    return new Promise((resolve) => {
        setTimeout(() => {resolve();}, ms)
    })
}

function waitStop(ms = 1000, checkCallback=null, checkDelay= 1000) {
    const expired = now() + ms;
    return new Promise(async (resolve, reject) => {
        try {
            while (now() < expired) {
                await wait(expired - now() < checkDelay ? expired - now() : checkDelay);
                if (checkCallback && checkCallback()) {
                    break;
                }
            }
            resolve();
        }
        catch(e) {
            reject(e);
        }
    })
}

function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}


function baseName(path) {
    path = path.replaceAll('\\', '/');
    const idx = path.lastIndexOf('/');
    if (idx >= 0) {
        path = path.substring(idx+1)
    }
    return path;
}

function baseDir(path) {
    path = path.replaceAll('\\', '/');
    const idx = path.lastIndexOf('/');
    if (idx >= 0) {
        return path.substring(0, idx)
    }
    return '';
}

function splitExt(path) {
    path = path.trim();
    const name = baseName(path);
    const idx = name.lastIndexOf('.');
    if (idx >= 0) {
        return [name.substring(0, idx), name.substring(idx)]
    }
    return [name, ''];
}


export {
    log, err,
    now, nowsec,
    timestamp2str, timestamp2strHum, timestamp2strHum2,
    parseStrTimestamp,
    sec2str,
    randomRange,
    wait, waitStop,
    baseName, baseDir, splitExt,
    zeroPadLeft
};
