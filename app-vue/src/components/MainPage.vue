<template>
  <div class="main-page flex column no-wrap">
      <div class="head-buttons row flex-center">

        <div class="state_block">
          <div v-if="state.fetching"
               v-html="state.fetchingMessage"
          />
          <div v-else-if="state.lastTimestamp"
               :class="state.isExpiredDate ? 'mark_orange' : 'mark_green'"
               :title="state.lastTimestampMessage">
            <span>{{ state.isExpiredDate ? 'Names are outdated!' : 'Names are fresh!' }}</span>
          </div>
        </div>

        <q-space/>

        <q-toggle
            v-model="ta1.onlyLast7day"
            class="text-grey-5 q-mr-xl"
            label="Show last 7days"
        />

        <q-btn color="primary"
               :disable="state.fetching"
               :loading="state.fetching"
               label="Start update"
               no-caps
               class="q-px-sm q-mr-md bg-grey-9 text-grey-5"
               @click="startUpdateData" />

        <q-btn color="white" no-caps dark flat :label="state.user">
          <q-menu>
            <q-list style="min-width: 100px">
              <q-item v-if="state.isAdmin" clickable v-close-popup @click="gotoUsers">
                <q-item-section>Users settings</q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="logout">
                <q-item-section>Logout</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </div>


      <div class="page-content" style="min-height: 0">
        <q-splitter dark>

          <template v-slot:before>
            <q-tabs
                v-model="tab"
                dark
                vertical
                class="text-blue-5"
            >
              <q-tab name="list" icon="list" no-caps label="List of names" />
              <q-tab name="likes" icon="favorite" no-caps label="Favorites" />
            </q-tabs>
          </template>

          <template v-slot:after>
            <q-tab-panels
                v-model="tab"
                dark
                animated
                swipeable
                vertical
                transition-prev="jump-up"
                transition-next="jump-up"
                class="flex column full-height"
                style="background-color: transparent"
            >
              <q-tab-panel name="list" class="flex column no-wrap q-py-none">
                <q-table
                    ref="mainTableOne"
                    class="main-table"
                    dark dense
                    row-key="name"
                    :rows="ta1.rowsFiltered"
                    :columns="ta1.columns"
                    :pagination="ta1.pagination"
                    virtual-scroll
                    :virtual-scroll-slice-size="50"
                    :virtual-scroll-slice-ratio-before="10"
                    :virtual-scroll-item-size="34"
                    :virtual-scroll-sticky-size-start="34"
                    :rows-per-page-options="[0]"
                    :loading="ta1.loading"
                    hide-pagination
                    @virtual-scroll="onScroll"
                >
                  <template v-slot:body-cell-link="props">
                    <q-td :props="props">
                      <a class="text-blue-9" :href="'https://getgems.io/nft/' + props.row.address" target="_blank">
                        <q-icon name="open_in_new"/>
                      </a>
                    </q-td>
                  </template>
                  <template v-slot:body-cell-likes="props">
                    <q-td :props="props">
                      <q-btn
                          flat
                          class="like_btn"
                          :class="{'--selected': getCurLike(props.row.name)}"
                          icon="star"
                          color="yellow"
                          @click="onLike(props.row)"
                      />
                    </q-td>
                  </template>
                  <template v-slot:body-cell-price="props">
                    <q-td :props="props">
                      <q-btn
                          flat
                          class="price_btn"
                          :class="{is_filled: ta1.mapPrices[props.row.name]?.value}"
                          :label="ta1.mapPrices[props.row.name]?.value"
                          :loading="ta1.mapPrices[props.row.name]?.loading"
                          @click="onPrice(props.row)"
                      />
                    </q-td>
                  </template>

                  <template v-slot:bottom>
                    <div class="row justify-center flex-center q-mt-xs full-width">
                      <div style="visibility: hidden">{{ ta1.topRowIndex + 1 }} / {{ ta1.rowsFiltered.length }}</div>
                      <q-space/>
                      <q-pagination
                          :model-value="ta1.curPage"
                          color="grey-8"
                          :min="1"
                          :max="ta1.pages"
                          :max-pages="10"
                          boundary-numbers
                          size="md"
                          @click="onClickPage"
                      />
                      <q-space/>
                      <div>{{ ta1.topRowIndex + 1 }} / {{ ta1.rowsFiltered.length }}</div>
                    </div>
                  </template>
                </q-table>

              </q-tab-panel>


              <q-tab-panel name="likes" class="flex column no-wrap q-py-none">
                <q-table
                    ref="mainTableTwo"
                    class="main-table"
                    dark dense
                    row-key="name"
                    :rows="ta2.likePositiveRows"
                    :columns="ta2.columns"
                    :pagination="ta2.pagination"
                    :rows-per-page-options="[0]"
                    :loading="ta1.loading"
                    @virtual-scroll="onScroll"
                >
                  <template v-slot:body-cell-link="props">
                    <q-td :props="props">
                      <a class="text-blue-9" :href="'https://getgems.io/nft/' + props.row.address" target="_blank">
                        <q-icon name="open_in_new"/>
                      </a>
                    </q-td>
                  </template>
                  <template v-slot:body-cell-likes="props">
                    <q-td :props="props">
                      <q-btn
                          flat
                          class="like_btn"
                          :class="{'--selected': getCurLike(props.row.name)}"
                          icon="star"
                          color="yellow"
                          @click="onLike(props.row)"
                      />
                    </q-td>
                  </template>
                  <template v-slot:body-cell-price="props">
                    <q-td :props="props">
                      <q-btn
                          flat
                          class="price_btn"
                          :class="{is_filled: ta1.mapPrices[props.row.name]?.value}"
                          :label="ta1.mapPrices[props.row.name]?.value"
                          :loading="ta1.mapPrices[props.row.name]?.loading"
                          @click="onPrice(props.row)"
                      />
                    </q-td>
                  </template>

                  <template v-slot:bottom>
                    <div class="row justify-center flex-center q-mt-xs full-width">
                      <q-space/>
                      <div>{{ ta2.likePositiveRows.length }}</div>
                    </div>
                  </template>
                </q-table>
              </q-tab-panel>

            </q-tab-panels>
          </template>

        </q-splitter>

      </div>

  </div>
</template>


<script setup>
import _ from 'lodash';
import {ref, nextTick, watch, computed, reactive, onMounted, onUnmounted} from 'vue'
import {
    log, nowsec, sec2str,
    timestamp2strHum, timestamp2strHum2,
    zeroPadLeft} from "../utils/utils";
import {store} from '../store';
import router from '../router';
import {getData, getState, getLikes, setLikes, startFetching} from '../services/api';
import {fetchLastAuctionBid} from '../services/api';
import { useQuasar } from 'quasar'


const $q = useQuasar();

const mainTableOne = ref(null);
const mainTableTwo = ref(null);
const tab = ref('list');

const D7 = 7*24*3600;
const D7plus = 7*24*3600 + 3600;
const now = ref(nowsec());
const now10 = ref(nowsec());

// см. в метод mounted
let nowStatic = nowsec();
let nowStaticD7plus = nowsec(-D7plus);
let timerNow = null;
let timerNow10 = null;

const elapsedTime = computed(() => {
    return (v) => D7+v >= now.value ? sec2str(D7+v - now.value) : '-';
})


const state = reactive({
    user: computed(() => store?.auth?.user),
    isAdmin: computed(() => store?.auth?.isAdmin),
    fetching: false,
    stateLoading: false,
    fetchingMessage: '',
    lastTimestamp: null,
    lastTimestampStr: computed(() =>
        state.lastTimestamp ? timestamp2strHum2(state.lastTimestamp) : '-'),
    lastTimestampStrElapsed: computed(() =>
        state.lastTimestamp ? sec2str(now10.value - state.lastTimestamp): '-'),
    lastTimestampMessage: computed(() =>
        `${state.isExpiredDate ? 'Names are outdates!' : 'Names are quite fresh!'} \n\n` +
        `Date of last updating: ${state.lastTimestampStr} \n` +
        `Elapsed time: ${state.lastTimestampStrElapsed}`),
    isExpiredDate: computed(() => state.lastTimestamp ? nowsec() - state.lastTimestamp >= 24*3600 : false),
});

// ==> ITEMS
const ta1 = reactive({
    columns: [
        {
            name: 'link', label: '#', align: 'center',
            headerStyle: 'width: 36px',
        },
        {
            name: 'likes', label: 'Like', align: 'center',
            headerStyle: 'width: 70px',
        },
        {
            name: 'price', label: 'TON', align: 'left',
            headerStyle: 'width: 80px',
        },
        {
            name: 'name', field: 'name',
            label: 'Name',
            classes: 'td_name',
            format: (v) => v.startsWith('@') ? v.substring(1) : v,
            align: 'left', sortable: true
        },
        {
            name: 'elapsed', field: 'created',
            label: 'Auction ends',
            headerStyle: 'width: 120px',
            format: elapsedTime,
            align: 'left', sortable: true
        },
        {
            name: 'createdTime', field: 'created',
            label: 'Mint date',
            headerStyle: 'width: 120px',
            style: 'font-size: 14px',
            format: (v) => timestamp2strHum2(v),
            align: 'left', sortable: true
        }
    ],
    pagination: {
        sortBy: 'elapsed',
        descending: false,
        page: 1,
        rowsPerPage: 0
    },
    topRowIndex: 0,
    rowsPerPage: 100,
    pages: computed(() => Math.ceil(ta1.rowsFiltered.length / ta1.rowsPerPage)),
    curPage: computed(() => Math.floor(ta1.topRowIndex / ta1.rowsPerPage) + 1),
    rows: [],     // { name, created, address },
    rowsFiltered: computed(() =>
        ta1.onlyLast7day ? ta1.rows.filter(d => d.created >= nowStaticD7plus) : ta1.rows),
    mapRows: computed(() => _.keyBy(ta1.rows, 'name')),
    onlyLast7day: true,
    loading: false,

    mapPrices: {}
});

// ==> LIKES
const ta2 = reactive({
    columns: [
        {
            name: 'link', label: '#', align: 'center',
            headerStyle: 'width: 36px',
        },
        {
            name: 'likes', label: 'Like', align: 'center',
            headerStyle: 'width: 70px',
        },
        {
            name: 'price', label: 'TON', align: 'left',
            headerStyle: 'width: 80px',
        },
        {
            name: 'name', field: 'name',
            label: 'Name',
            classes: 'td_name',
            format: (v) => v.startsWith('@') ? v.substring(1) : v,
            align: 'left', sortable: true
        },
        {
            name: 'elapsed', field: 'created',
            label: 'Auction ends',
            headerStyle: 'width: 120px',
            format: elapsedTime,
            align: 'left', sortable: true
        },
        {
            name: 'createdTime', field: 'created',
            label: 'Mint date',
            headerStyle: 'width: 120px',
            style: 'font-size: 14px',
            format: (v) => timestamp2strHum2(v),
            align: 'left', sortable: true
        },
        {
            name: 'addedTime', field: 'added',
            label: 'Added date',
            headerStyle: 'width: 120px',
            style: 'font-size: 14px',
            format: (v) => timestamp2strHum2(v),
            align: 'left', sortable: true
        }
    ],
    pagination: {
        sortBy: 'elapsed',
        descending: false,
        page: 1,
        rowsPerPage: 0
    },
    likeMap: {},
    likeRows: [],     // { name, created, likes, address, added },
    likePositiveRows: computed(() => {
        return ta2.likeRows.filter(item => {
            const changed = ta2.mapChangedLikes[item.name];
            return changed ? changed.like : item.like;
        })
    }),
    mapChangedLikes: {},
    storing: false,
})

function logout() {
    store.auth.logout();
}

function gotoUsers() {
    router.push({name: 'users'});
}

function onScroll({ index }) {
    ta1.topRowIndex = index;
}


function onClickPage(e) {
    const page = e.target.__vueParentComponent?.ctx?.$props?.label;
    if (page && +page) {
        const index = (page - 1) * ta1.rowsPerPage;
        log(index)
        mainTableOne.value.scrollTo(index, 'start-force')
    }
}


function onLike(row) {
    const {name} = row;
    const newLike = getCurLike(name) ? 0 : 1;

    let item = ta2.mapChangedLikes[name];
    if (item) {
        item.like = newLike;
    } else {
        ta2.mapChangedLikes[name] =
            {...row, like: newLike, added: nowsec()};
    }
    storeLikesDelay();
}

function onPrice(row) {
    const {name} = row;
    if (ta1.mapPrices[name]?.loading) {
        return;
    }
    if (!ta1.mapPrices[name]) {
        ta1.mapPrices[name] = {loading: true, value: 0};
    } else {
        ta1.mapPrices[name].loading = true;
    }

    fetchLastAuctionBid(row.address)
        .then(resp => {
            const item = resp.data || {};
            ta1.mapPrices[name].value = amount2ton(item.value);
        })
        .finally(() => {
            ta1.mapPrices[name].loading = false;
        })

}

function amount2ton(amount) {
    if (amount == null) {
        return '';
    }
    amount = '' + amount;
    amount = zeroPadLeft(amount, 9);
    const idx = amount.length - 9;
    const dd = amount.substring(0, idx) || '0';
    const ff = amount.substring(idx, idx+1) || '0';
    return +dd > 0 ? dd : parseFloat('0.'+ff);
}
function getCurLike(name) {
    return ta2.mapChangedLikes[name]
        ? ta2.mapChangedLikes[name].like
        : ta2.likeMap[name]?.like || 0
}


function removeWasteChangedLikes() {
    Object.values(ta2.mapChangedLikes)
        .forEach(({name, like}) => {
            const origLike = ta2.likeMap[name]?.like || 0;
            if (origLike === like) {
                delete ta2.mapChangedLikes[name];
            }
        })
}

function storeLikes() {
    if (ta2.storing) {
        storeLikesDelay();
        return;
    }
    removeWasteChangedLikes();
    const changedLikes = _.merge([], Object.values(ta2.mapChangedLikes));
    if (!changedLikes.length) {
        return;
    }

    ta2.storing = true;

    setLikes(changedLikes)
        .then(() => {
            // применяем изменения
            changedLikes.forEach(item => {
                const {name, like} = item;
                if (ta2.likeMap[name]) {
                    ta2.likeMap[name].like = like;
                } else {
                    ta2.likeRows.unshift(item);
                    ta2.likeMap[name] = item;
                }
            })
            removeWasteChangedLikes();
        })
        .catch(error => {
            console.log('Error saving likes:', changedLikes);
            if (!error?.AUTH_ERROR) {
                $q.notify({
                    message: 'Не удалось сохранить лайки!',
                    color: 'red'
                })
            }
            throw error;
        })
        .finally(() => {
            ta2.storing = false;
        })
}

const storeLikesDelay = _.debounce(storeLikes, 2000);


function reloadData() {
    if (ta1.loading) {
        return;
    }
    ta1.loading = true;

    Promise.all([getData(), getLikes()])
        .then(resps => resps.map(resp => resp.data))
        .then(([respData, respLikes]) => {
            respData.forEach(d => {
                d.like = 0;
            })
            ta1.rows = respData;

            ta2.likeRows = respLikes;
            ta2.likeMap = _.keyBy(respLikes, 'name');
        })
        .catch(error => {
            if (!error?.AUTH_ERROR) {
                $q.notify({
                    message: 'Не удалось загрузить данные!',
                    color: 'red'
                })
            }
            throw error;
        })
        .finally(() => {
            ta1.loading = false;
        })
}

let timerReloadState = null;

function reloadState() {
    if (state.stateLoading) {
        return;
    }
    state.stateLoading = true;

    getState()
        .then(resp => {
            const {fetching, startTime, maxTime, minTime, lastTimestamp} = resp.data;
            state.fetching = fetching;
            state.lastTimestamp = lastTimestamp;
            if (fetching) {
                const progress = Math.round(100 * (startTime - maxTime) / (startTime - minTime));
                state.fetchingMessage = `<div class="text-blue-4">Обновление данных: ${progress || 0}%</div>`;
            } else {
                state.fetchingMessage = '';
            }
        })
        .catch(error => {
            state.fetchingMessage = '<div class="mark_red">Ошибка получения статуса!</div>';
        })
        .finally(() => {
            state.stateLoading = false;
        })
}


function startUpdateData() {
    if (state.fetching) {
        return;
    }
    state.fetching = true;

    startFetching()
        .then(resp => {
            $q.notify({
                message: 'Обновление данных успешно запущено!',
                color: 'green'
            })
        })
        .catch(error => {
            state.fetching = false;
            if (error.FORBIDDEN_ERROR) {
                $q.notify({
                    message: 'У вас не хватает прав для данной операции!',
                    color: 'orange'
                })
            }
            else if (!error?.AUTH_ERROR){
                $q.notify({
                    message: 'Ошибка запуска обновления данных!',
                    color: 'red'
                })
                throw error;
            }
        })
}


reloadData();
reloadState();


onMounted(() => {
    nowStatic = nowsec();
    nowStaticD7plus = nowsec(-D7plus);

    timerNow = setInterval(() => {
        now.value = nowsec();
    }, 1000);
    timerNow10 = setInterval(() => {
        now10.value = nowsec();
    }, 10000);
    timerReloadState = setInterval(() => {
        reloadState();
    }, 4000);
})
onUnmounted(() => {
    clearInterval(timerNow);
    clearInterval(timerNow10);
    clearInterval(timerReloadState);
})


</script>


<style lang="scss">
.main-page {
  width: 100vw;
  height: 100vh;
  padding: 10px 20px;
  font-size: 15px;
  background-color: #222;

  .head-buttons {
    margin-bottom: 20px;
    margin-left: 10px;
  }
  .state_block {
    cursor: help;
    color: #ddd;
  }
  .page-content {
    height: 100%;
  }

  .q-splitter {
    max-height: 100%;
    max-width: 1200px;
    margin-left: 0;

    .q-splitter__panel {
      display: flex;
      flex-direction: column;
      height: auto;
    }
  }

  .q-tab__content {
    padding-right: 10px;
  }
  .q-tab.q-tab--active {
    background-color: #333;
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
    .q-virtual-scroll {
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
    line-height: 34px;
  }
  .q-table thead th {
    font-size: 14px;
    font-family: sans-serif;
    color: #666;
    padding: 0;
    line-height: 34px;
  }

  .like_btn {
    font-size: 12px;
    padding: 4px 12px;

    .q-btn__content {
      opacity: 0.1;
    }
    &.--selected .q-btn__content {
      opacity: 0.8;
    }
  }

  .price_btn {
    font-size: 12px;
    padding: 4px 2px;
    width: 40px;
    color: #ffff00aa;

    &.is_filled:after {
      display: none !important;
    }

    &:after {
      content: "PRICE";
      font-size: 10px;
      font-weight: bold;
      position: absolute;
      display: block;
      top: 5px;
      left: 0;
      right: 0;
      color: #ffff0015;
    }
    &:hover:after {
      color: #ffff0077;
    }
  }

  .mark_red {
    color: red;
  }
  .mark_orange {
    color: orange;
  }
  .mark_green {
    color: #00bb00;
  }
  .mark_blue {
    color: #0048ff;
  }
}
</style>
