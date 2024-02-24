import Notify from 'quasar/src/plugins/Notify';
import {log, err} from './utils.js';


function handleErrorQuiet(error, msg) {
    if (error.FORBIDDEN_ERROR) {
        Notify.create({
            message: '403. Not enough rights to perform the operation!',
            color: 'red'
        })
    }
    else if (!error?.AUTH_ERROR) {
        err(msg);
        Notify.create({
            message: msg || 'Error happened!',
            color: 'red'
        })
    }
}

function handleError(error, msg) {
    handleErrorQuiet(error, msg);
    throw error;
}

function handleResponse(resp, msg) {
    const status = getStatus(resp);

    if (status === true) {
        Notify.create({
            message: msg || 'Success!',
            color: 'green'
        })
    }
    else if (status === false || status) {
        Notify.create({
            message: status || 'Nothing!',
            color: 'orange'
        })
    }
}

function getStatus(resp) {
    return resp.data?.status;
}



export {
    handleErrorQuiet,
    handleError,
    handleResponse,
    getStatus
}
