const errors = {
    'NO_PROVIDER': {
        title: '<h2>Couldn\'t detect Badger Wallet</h2>',
        description: '<p>Please install Badger Wallet to use DesuDNS.</p><p><a href="https://chrome.google.com/webstore/detail/badger-wallet/jadobjbcgibiopkifknkfnohlelpocll" target="_blank">Add to Chrome</a> - <a href="https://addons.mozilla.org/en-US/firefox/addon/badger-wallet/" target="_blank">Add to Firefox</a></p>'
    },
    'CONNECTION_DENIED': {
        title: '<h2>Not logged in to Badger Wallet</h2>',
        description: '<p>Please open Badger Wallet once and refresh the page.</p>'
    }
}
const prefix = '0x00444553';
const prefix_s = prefix.split('x')[1];
const types = {
    'REGISTER': {
        action: '0x0101',
        action_s: '0101'
    },
    'SET_IPFS_MD': {
        action: '0x0110',
        action_s: '0110'
    },
    'SET_IPFS_HTML': {
        action: '0x0111',
        action_s: '0111'
    }
}

let oopsie = async function (err) {
    var el = document.getElementById('errors');
    if(err.type && errors[err.type]) {
        el.innerHTML = errors[err.type].title + errors[err.type].description;
    } else {
        el.innerHTML = '<h1>Something went wrong</h1><p>' + JSON.stringify(err) + '</p>';
    }
    el.style.display = 'block';
}

let address = async function () {
    return new Promise(function(resolve, reject) {
        bitcoincomLink.getAddress({protocol: 'BCH'}).then((data) => {
            resolve(data);
        }).catch((err) => {
            reject(err)
        })
    })
}

let send = async function (type = 'REGISTER', data) {
    try {
        var adr = (await address()).address.split(':')[1]
        var op_return = [prefix, types[type].action]
        data.forEach(el => {
            op_return.push(el)
        });
        const sendAssetArgs = {to: adr, protocol: 'BCH', value: (546 * 0.00000001), opReturn: op_return};
        console.log(sendAssetArgs)
        bitcoincomLink.sendAssets(sendAssetArgs).then(console.log).catch(oopsie);
    } catch (err) {
        oopsie(err);
        console.log(err);
    }
}

let parse_out = async function (res) {
    return new Promise(function(resolve, reject) {
        if(!res[0]) {reject()}
        var docs = []
        let doc = {}
        for (var i = 0; i < res.length; i++) {
            for (var io = 0; io < res[i].out.length; io++) {
                if(res[i].out[io] && res[i].out[io].h1 && res[i].out[io].h1 == prefix_s) {
                    doc[io] = {txid: res[i].tx.h, name: res[i].out[io].s3}
                    doc[io].status = ((res[i].blk) ? {s: 'confirmed', t: res[i].blk.t} : {s: 'pending', t: Math.floor(Date.now() / 1000)});
                    docs.push(doc[io])
                }
                if((io + 1) >= res[i].out.length) {
                    resolve(docs)
                }
            }
        }
    })
}

let setup = async function () {
    try {
        var res = await address();
        localStorage.setItem('account', JSON.stringify(res))
        window.location.reload(false)
    } catch (err) {
        oopsie(err)
    }
}
