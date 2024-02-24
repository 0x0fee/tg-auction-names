import axios from "axios";


const GEMS_URL = 'https://api.getgems.io/graphql';


/**
 * Fetching history items for collection. Example  response:
 *
 * data.historyCollectionNftItems.items: [{
 *    "createdAt": 1707838011,
 *    "nft": {
 *       "name": "@suamii",
 *       "address": "EQBHFROEFeU-H2SNRnsBhumJ7TRzfIHcvuD2pF5pXg00lU-1"
 *    }
 * }]
 */
function fetchHistoryItems(maxTime, count, collection="EQCA14o1-VWhS2efqoh_9M1b_A9DtKTuoqfmkn83AbJzwnPi") {
    const data = {
        query: "query RunQuery($collectionAddress: String!, $types: [HistoryType!], $first: Int!, $maxTime: Int) {\n  historyCollectionNftItems(collectionAddress: $collectionAddress, types: $types, first: $first, maxTime: $maxTime) {\n    items {\n      createdAt\n      nft {\n        name\n        address\n      }\n    }\n  }\n}\n",
        variables: {
            collectionAddress: collection,
            types: ["Mint"],
            first: count,
            maxTime: maxTime
        },
        operationName: "RunQuery"
    };

    return axios.post(GEMS_URL, data);
}


/**
 * Fetching last auction bid price (maximum) of item by address. Example  response:
 *
 * data.nftAuctionBidHistory.items: [{
 *      "amount": "11000000000",
 *      "createdAt": 1708601840
 * }]
 */
function fetchLastAuctionBid(address) {
    const data = {
        query: `
            query RunQuery($first: Int!, $auctionAddress: String!) {
              nftAuctionBidHistory(auctionAddress: $auctionAddress, first: $first) {
                items {
                  amount
                  createdAt
                }
              }
            }
        `,
        variables: {
            auctionAddress: address,
            first: 1
        },
        operationName: "RunQuery"
    };

    return axios.post(GEMS_URL, data).then(resp => {
        const respData = resp.data;
        return respData?.data?.nftAuctionBidHistory?.items[0]
    });
}


export {
    fetchHistoryItems,
    fetchLastAuctionBid
}
