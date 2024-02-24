import { createApp } from 'vue';
import App from './App.vue';
import store from './store';
import router from './router';

import { Quasar } from 'quasar'
import '@quasar/extras/material-icons/material-icons.css'
import 'quasar/src/css/index.sass'

import Notify from 'quasar/src/plugins/Notify';
import Dialog from 'quasar/src/plugins/Dialog';

import './styles/_main.scss';


const app = createApp(App);
app.use(router);
app.use(store);
app.use(Quasar, {
    plugins: {Notify, Dialog},
})
app.mount('#app');

store.$app = app;
