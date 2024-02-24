import _ from "lodash";
import { defineStore } from 'pinia';
import store from "./index";
import router from "../router";


const useAuthStore = defineStore({
    id: "storeAuth",

    state() {
        return {
            user: null,
            password: null,
            userRoles: []
        }
    },

    persist: {
        storage: sessionStorage,
    },

    getters: {
        isAuthenticated(state) {
            return !!(state.user && state.password);
        },
        isAdmin() {
            return this.userRoles.includes('admin');
        }
    },

    actions: {
        passCredentials(config) {
            const {user, password} = this;
            if (!user || !password) {
                return;
            }
            const auth = btoa(`${user}:${password}`);
            config.headers.Authorization = `Basic ${auth}`;
        },

        setRolesByResp(resp) {
            const str = resp.headers.get('user-roles') || '';
            this.userRoles = str.split(',').map(d => d.trim()).filter(d => d);
        },

        login(resp, user, pass) {
            this.setRolesByResp(resp);
            this.user = user;
            this.password = pass;
            router.push('/');
        },

        logout() {
            this.user = null;
            this.password = null;
            router.push('/login');
        },
    }
});



export { useAuthStore };
