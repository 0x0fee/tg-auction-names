<template>
  <div class="users-page flex column no-wrap">
      <div class="head-buttons row flex-center">

        <q-btn v-if="state.isAdmin"
               color="primary"
               :disable="ta.loading"
               label="Add User"
               no-caps
               class="q-px-sm q-mr-md"
               @click="onCreateUser"
        />

        <q-space/>

        <q-btn label="Main page"
               no-caps
               icon="home"
               class="home_btn q-px-sm q-mr-md bg-grey-9 text-grey-5"
               @click="gotoMainPage" />

        <q-btn color="white" no-caps dark flat :label="state.user">
          <q-menu>
            <q-list style="min-width: 100px">
              <q-item clickable v-close-popup @click="logout">
                <q-item-section>Logout</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </div>


      <div class="page-content" style="min-height: 0">
        <q-table
            ref="mainTable"
            class="main-table"
            dark dense
            row-key="login"
            :rows="ta.rows"
            :columns="ta.columns"
            :pagination="ta.pagination"
            :rows-per-page-options="[0]"
            :loading="ta.loading"
            hide-pagination
        >
          <template v-slot:body="props">
            <q-tr :props="props">
              <q-td>
                {{ props.row.login }}
              </q-td>
              <q-td>
                <q-chip v-for="role in props.row.roles"
                        dense
                        class="role_chip bg-grey-13 text-black q-mr-xs">{{ role }}</q-chip>
              </q-td>
              <q-td class="text-right">
                <q-btn flat dense icon="edit"
                       :disable="ta.loading"
                       class="text-blue-8 q-mr-lg"
                       @click="onEditUser(props.row)"
                />
                <q-btn flat dense icon="delete"
                       :disable="ta.loading"
                       color="red"
                       @click="deleteUserDataConfirm(props.row.login)"
                />
              </q-td>
            </q-tr>
          </template>

          <template v-slot:bottom>
            <div class="row justify-center flex-center q-mt-xs full-width">
              <q-space/>
              <div>{{ ta.rows.length }}</div>
            </div>
          </template>
        </q-table>

      </div>


      <q-dialog v-model="state.showEdit" persistent>
        <q-card class="bg-grey-5" style="min-width: 300px">
          <q-card-section>
            <div class="text-h6 text-bold text-black">
              {{ state.editMode ? 'Edit user' : 'Create user' }}
            </div>
          </q-card-section>

          <q-card-section class="q-pt-none">
            <q-input v-model.trim="us.login"
                     type="text"
                     :readonly="state.editMode"
                     filled
                     label="Login"
                     bg-color="grey-4"
                     label-color="grey-8"
                     color="black"
                     class="q-mb-md" />

            <q-input v-model="us.password"
                     filled
                     bg-color="grey-4"
                     label-color="grey-8"
                     color="black"
                     :type="state.isPwd ? 'password' : 'text'"
                     :label="state.editMode ? 'New password' : 'Password'"
                     class="q-mb-md">
              <template v-slot:append>
                <q-icon
                    :name="state.isPwd ? 'visibility_off' : 'visibility'"
                    class="cursor-pointer"
                    @click="state.isPwd = !state.isPwd"
                />
              </template>
            </q-input>

            <q-select multiple
                      filled
                      clearable
                      v-model="us.roles"
                      :options="state.listRoles"
                      label="Roles"
                      bg-color="grey-4"
                      label-color="grey-8"
                      color="black"/>

          </q-card-section>

          <q-card-actions align="right">
            <q-btn flat label="OK"
                   :disable="state.loading"
                   class="bg-grey-6"
                   text-color="grey-10"
                   @click="onSaveUserUser"
            />
            <q-btn flat label="Cancel"
                   class="bg-grey-5"
                   text-color="grey-9"
                   v-close-popup
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

  </div>
</template>


<script setup>
import _ from 'lodash';
import {ref, computed, reactive} from 'vue'
import {log} from "../utils/utils";
import {handleError, handleResponse, getStatus} from "../utils/notify";
import {store} from '../store';
import router from "../router";
import {getUsers, createUser, changeUser, deleteUser} from '../services/api';
import { useQuasar } from 'quasar'
import Dialog from 'quasar/src/plugins/Dialog';


const $q = useQuasar();

const mainTable = ref(null);


const state = reactive({
    user: computed(() => store?.auth?.user),
    isAdmin: computed(() => store?.auth?.isAdmin),
    editMode: false,
    showEdit: false,
    selectedUser: {login: '', password: '', roles: []},
    selectedRoles: [],
    listRoles: ['admin'],
    isPwd: true
});

const us = reactive({
    login: '',
    password: '',
    roles: [],
});

const ta = reactive({
    columns: [
        {
            name: 'login', field: 'login',
            label: 'Name',
            classes: 'td_name',
            align: 'left', sortable: true
        },
        {
            name: 'roles', field: 'roles',
            label: 'Roles',
            align: 'left'
        },
        {
            name: 'actions', label: '',
            headerStyle: 'width: 120px',
            style: 'text-align: end',
        },
    ],
    pagination: {
        sortBy: 'login',
        descending: false,
        page: 1,
        rowsPerPage: 0
    },
    rows: [],
    mapRows: computed(() => _.keyBy(ta.rows, 'login')),
    loading: false,
});


function logout() {
    store.auth.logout();
}

function gotoMainPage() {
    router.push({name: 'root'});
}

function clearUserForm() {
    state.editMode = false;
    us.login = '';
    us.password = '';
    us.roles = [];
    state.isPwd = true;
    state.showEdit = false;
}
function onEditUser(row) {
    clearUserForm();
    state.editMode = true;
    us.login = row.login;
    us.roles = [...row.roles];
    state.showEdit = true;
}
function onCreateUser() {
    clearUserForm();
    state.showEdit = true;
}


function onSaveUserUser() {
    if (ta.loading) {
        return;
    }
    ta.loading = true;

    if (state.editMode) {
        changeUser({...us})
            .then(resp => {
                handleResponse(resp, 'User data was success changed');
                ta.loading = false;
                if (getStatus(resp) === true) {
                    reloadDataUsers();
                    state.showEdit = false;
                }
            })
            .catch(error => {
                ta.loading = false;
                handleError(error, 'Error on save data!');
            })
    }
    else {
        createUser({...us})
            .then(resp => {
                handleResponse(resp, 'User was success created');
                ta.loading = false;
                if (getStatus(resp) === true) {
                    reloadDataUsers();
                    state.showEdit = false;
                }
            })
            .catch(error => {
                ta.loading = false;
                handleError(error, 'Error on save data!');
            })
    }
}


function reloadDataUsers() {
    if (ta.loading) {
        return;
    }
    ta.loading = true;

    getUsers()
        .then(resp => {
            ta.rows = resp.data;
        })
        .catch(error => {
            handleError(error, 'Error load users!')
        })
        .finally(() => {
            ta.loading = false;
        })
}

function addUserData(login) {
    if (ta.loading) {
        return;
    }
    ta.loading = true;

    deleteUser(login)
    .then(resp => {
        const cnt = resp.remove;
        $q.notify({
            message: cnt ? 'User success removed' : 'User not removed',
            color: cnt ? 'green' : 'orange'
        })
    })
    .catch(error => {
        if (!error?.AUTH_ERROR) {
            $q.notify({
                message: 'Error deleting user!',
                color: 'red'
            })
        }
        throw error;
    })
    .finally(() => {
        ta.loading = false;
    })
}



function deleteUserDataConfirm(login) {
    $q.dialog({
        title: 'Confirm',
        message: `Are you sure want to delete user "${login}"?`,
        cancel: true,
        persistent: true
    }).onOk(() => {
        deleteUserData(login);
    })
}

function deleteUserData(login) {
    if (ta.loading) {
        return;
    }
    ta.loading = true;

    deleteUser(login)
        .then(resp => {
            handleResponse(resp, 'User was success removed');
            ta.loading = false;
            if (getStatus(resp) === true) {
                reloadDataUsers();
            }
        })
        .catch(error => {
            ta.loading = false;
            handleError(error);
        })
}


reloadDataUsers();

</script>


<style lang="scss">
.users-page {
  width: 100vw;
  height: 100vh;
  padding: 10px 20px;
  font-size: 15px;
  background-color: #222;

  .head-buttons {
    width: 100%;
    max-width: 1100px;
    margin: 6px auto 18px;
  }
  .page-content {
    height: 100%;
    max-width: 1100px;
    margin: auto;
  }

  .main-table {
    max-height: 100%;
    background-color: #000;
    font-family: serif;
    color: #aaa;
    box-shadow: none;

    table {
      table-layout: fixed;
    }

    thead {
      position: sticky;
      top: 0;
      background-color: #000;
      z-index: 1;
    }
    .scroll {
      scrollbar-width: thin;
    }

    .td_name {
      color: #c0c0c0;
      letter-spacing: 0.5px;
      font-size: 17px;
    }

    .q-table__bottom {
      font-family: sans-serif;
    }
  }

  .q-table tbody td {
    font-size: 16px;
    border-color: #000;
    padding: 0;
    height: 40px;
  }
  .q-table thead th {
    font-size: 14px;
    font-family: sans-serif;
    color: #666;
    padding: 0;
    height: 40px;
  }

  .home_btn {
    .q-icon {
      font-size: 18px;
      margin-right: 6px;
    }
  }

  .role_chip {
    font-size: 14px;
    padding: 6px 8px;
  }
}
</style>
