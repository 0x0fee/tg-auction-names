import { createWebHistory, createRouter } from "vue-router";
import {store} from '../store';


const routes = [
    {
        path: '/',
        name: "root",
        component: () => import('@/components/MainPage.vue')
    },
    {
        path: '/login',
        name: "login",
        component: () => import('@/components/LoginPage.vue')
    },
    {
        path: '/users',
        name: "users",
        component: () => import('@/components/UsersPage.vue')
    },
    {path: '/:pathMatch(.*)', redirect: '/'}
];


const router = createRouter({
    mode: "history",
    history: createWebHistory(import.meta.env.VITE_ROOT_PATH),
    routes,
});


router.beforeEach((to, from, next) => {
    if (to.name !== 'login' && !store.auth.isAuthenticated) {
        next({name: 'login'})
    }
    else if (to.name === 'login' && store.auth.isAuthenticated) {
        next({name: 'root'})
    }
    else {
        next()
    }
})


export default router
