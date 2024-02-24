<template>
  <div class="login-page flex column no-wrap justify-center flex-center">
    <q-card class="login-form" dark flat>
      <q-input v-model.trim="state.login"
               type="text"
               dark filled
               label="Login"
               class="q-mb-md bg-grey-10"
               @keypress.enter="onPressEnter"
      />

      <q-input v-model="state.password"
               dark filled
               :type="state.isPwd ? 'password' : 'text'"
               label="Password"
               class="q-mb-md bg-grey-10"
               @keypress.enter="onPressEnter"
      >
        <template v-slot:append>
          <q-icon
              :name="state.isPwd ? 'visibility_off' : 'visibility'"
              class="cursor-pointer"
              @click="state.isPwd = !state.isPwd"
          />
        </template>
      </q-input>

      <div class="flex justify-center">
        <q-btn color="black" dark
               :disable="state.loading || !state.login || !state.password"
               :loading="state.loading"
               label="Войти"
               style="background-color: #222 !important;"
               @click="onLogin" />
      </div>
    </q-card>

  </div>
</template>


<script setup>
import _ from 'lodash';
import {ref, nextTick, watch, computed, reactive, onMounted} from 'vue'
import { useQuasar } from 'quasar'
import {log, nowsec, sec2str, timestamp2strHum} from "../utils/utils";
import {login} from '../services/api'
import {store} from '../store'


const $q = useQuasar();

const state = reactive({
    login: '',
    password: '',
    isPwd: true,
    loading: false
})


function onPressEnter() {
    if (state.login && state.password) {
        onLogin();
    }
}


function onLogin() {
    if (state.loading) {
        return;
    }
    login(state.login, state.password)
      .then(resp => {
          $q.notify({
              message: `${state.login}, welcome to the real world!`,
              color: 'green'
          })
          store.auth.login(resp, state.login, state.password);
      })
      .catch(error => {
          if (error?.AUTH_ERROR) {
              $q.notify({
                  message: 'Wrong login or password!',
                  color: 'orange'
              })
          } else {
              $q.notify({
                  message: 'Something went wrong!',
                  color: 'red'
              })
              throw error;
          }
      })
      .finally(() => {
          state.loading = false;
      })
}
</script>


<style lang="scss">
.login-page {
  width: 100vw;
  height: 100vh;
  padding: 20px 20px;
  font-size: 15px;
  background-color: #222;

  .login-form {
    position: relative;
    top: -100px;
    width: 400px;
    padding: 20px;
    background-color: #000;
  }
}
</style>
