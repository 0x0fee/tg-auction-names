import axiosOrigin from "axios";
import _ from 'lodash';
import {store} from '../store';


const axios = axiosOrigin.create({
    headers: {
        "Content-Type": "application/json",
    },
    baseURL: import.meta.env.VITE_BACKEND_URL
});

const authAxios = axiosOrigin.create({
    headers: {
        "Content-Type": "application/json",
    },
    baseURL: import.meta.env.VITE_BACKEND_URL
});



function interceptorRequest(config) {
    store.auth.passCredentials(config);
    return config;
}

function interceptorResponse(resp) {
    store.auth.setRolesByResp(resp);
    return Promise.resolve(resp);
}

function interceptorResponseError (error) {
    if (error.response && error.response.status === 401) {
        error.AUTH_ERROR = true;
        store.auth.logout();
        return Promise.reject(error)
    }
    else if (error.response && error.response.status === 403) {
        error.FORBIDDEN_ERROR = true;
        return Promise.reject(error);
    }
    else if (error.response && error.response.status === 304) {
        return Promise.resolve(error.response);
    }
    else {
        console.log("INTERCEPTORS ERROR", error);
        return Promise.reject(error.response);
    }
}


axios.interceptors.request.use(interceptorRequest);
axios.interceptors.response.use(interceptorResponse, interceptorResponseError);




function login(username, password) {
    return authAxios.get('/api/login', {
        auth: { username, password }
    }).catch(error => {
        if (error.response && error.response.status === 401) {
            error.AUTH_ERROR = true;
        }
        throw error;
    });
}

function getData() {
    return axios.get('/api/get_items');
}

function getState() {
    return axios.get('/api/get_state');
}

function getLikes() {
    return axios.get('/api/get_likes');
}

function setLikes(items) {
    return axios.post('/api/set_likes', items || []);
}

function startFetching() {
    return axios.get('/api/start_fetching');
}


function getUsers() {
    return axios.get('/api/get_users');
}
function createUser(userData) {
    return axios.put('/api/create_user', userData);
}
function changeUser(userData) {
    return axios.post('/api/change_user', userData);
}
function deleteUser(login) {
    return axios.delete('/api/delete_user', {params: {login}});
}


function fetchLastAuctionBid(address) {
    return axios.get('/api/fetch_last_auction_bid', {params: {address}});
}


export {
    getData, getState,
    getLikes, setLikes,
    login,
    startFetching,
    getUsers, createUser, changeUser, deleteUser,
    fetchLastAuctionBid
};
