import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import { useAuthStore } from "./authStore";


const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

const store = {
    pinia,
}


export default {
    store,
    install(app, option) {
        app.use(pinia);

        store.pinia = pinia;
        store.auth = useAuthStore(pinia);

        // allow access to storage by: this.$store
        app.config.globalProperties.$store = store;
    }
}

export {store};
