const __desu__prefix = '0x00444553';
const __desu__prefix_s = __desu__prefix.split('x')[1];
const __desu__types = {
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

let __desu__bitdb = async function (query) {
    const b64 = btoa(JSON.stringify(query));
    const url = 'https://bitdb2.fountainhead.cash/q/' + b64;
    return fetch(url).then((response) => response.json()).then((res) => { return res; }).catch(err => console.error('Oopsie: '+err));
}

// Count registrations per block
let __desu__first_and_count = async function (props) {
    var count = {}
    var first = {}
    for (var i = 0; i < props.length; i++) {
        if(!first[props[i].name]) first[props[i].name] = Date.now()
        if(props[i].blk.t < first[props[i].name]) {
            first[props[i].name] = props[i].blk.t
            if(count[props[i].blk.t]) count[props[i].blk.t] = (count[props[i].blk.t] + 1)
            if(!count[props[i].blk.t]) count[props[i].blk.t] = 1;
            if((i + 1) == props.length) {
                resolve(props)
            }
        }
    }
}

let __desu__first_of_name = async function (props, fcc) {
    for (var i = 0; i < props.length; i++) {
        if(props[i].blk.t == fcc.first && fcc.count[props[i].blk.t] == 1) {
            props[i].tld == 'bch'
        }
        if((i + 1) == props.length) {
            resolve(props)
        }
    }
}

let __desu__get_tlds = async function (props) {
    console.log(props)
    return new Promise(function(resolve, reject) {
        if(!props[0]) resolve([])
        var tlds = {}
        var tmp = []
        for (var i = 0; i < props.length; i++) {
            if(!tlds[props[i].name]) tlds[props[i].name] = [] 
            tmp[i] = sha256(props[i].tx + props[i].blk.h).replace(/[^a-z]+/g, "")
            if(!tlds[props[i].name].includes(tmp[i].substring(0, 3))) {
                tlds[props[i].name].push(tmp[i].substring(0, 3))
                props[i].tld = tmp[i].substring(0, 3);
            }
            if((i + 1) == props.length) {
                resolve(props)
            }
        }
    })
}

let __desu__get_output = async function (outs) {
    return new Promise(function(resolve, reject) {
        for (var i = 0; i < outs.length; i++) {
            if(outs[i] && outs[i].h1 == __desu__prefix_s) {
                resolve(outs[i])
            }
        }
    })
}

let __desu__get_records = async function (txid, owner) {
    return new Promise(function(resolve, reject) {
        __desu__bitdb({"v": 3, "q": {
                "find": {"in.e.a": owner, "out.h1": __desu__prefix_s, "out.h2":{ "$in": [__desu__types['SET_IPFS_HTML'].action_s, __desu__types['SET_IPFS_MD'].action_s]}, "out.s3": txid}, "sort": {"blk.i": 1}, "limit": 100
            }
        }).then(async function(res) {
            if(res.u[0]) {
                __desu__get_output(res.u[0].out).then((records) => {
                    resolve(records)
                })
            } else if (res.c[0]) {
                __desu__get_output(res.c[0].out).then((records) => {
                    resolve(records)
                })
            } else {
                reject('NO_RECORDS')
            }
        })
    })
}

let __desu__get_by_names = async function (names) {
    return new Promise(function(resolve, reject) {
        __desu__bitdb({"v": 3, "q": {
                "find": {"out.h1": __desu__prefix_s, "out.h2": __desu__types['REGISTER'].action_s, "out.s3": {"$in": names}}, "sort": {"blk.i": 1}, "limit": (names.length * 1000)
            }
        }).then(async function(res) {
            var docs = []
            var out = []
            if(res.c[0]) {
                for (var i = 0; i < res.c.length; i++) {
                    out[i] = await __desu__get_output(res.c[i].out)
                    docs.push({name: out[i].s3, owner: res.c[i].in[0].e.a, tx: res.c[i].tx.h, blk: {h: res.c[i].blk.h, t: res.c[i].blk.t}})
                    if((i + 1) == res.c.length) {
                        resolve(docs)
                    }
                }
            } else {
                resolve(docs);
            }
        }).catch((err) => reject(err))
    })
}

let __desu__get_by_address = async function (address) {
    return new Promise(function(resolve, reject) {
        __desu__bitdb({"v": 3, "q": {
                "find": {"out.h1": __desu__prefix_s, "out.h2": __desu__types['REGISTER'].action_s, "in.e.a": address}, "sort": {"blk.i": 1}, "limit": 100
            }
        }).then(async function(res) {
            var doc = {"owner": address, "props": []}
            var out = []
            if(res.c[0]) {
                for (var i = 0; i < res.c.length; i++) {
                    out[i] = await __desu__get_output(res.c[i].out)
                    doc.props.push({name: out[i].s3, tx: res.c[i].tx.h, blk: {h: res.c[i].blk.h, t: res.c[i].blk.t}})
                    if((i + 1) == res.c.length) {
                        resolve(doc)
                    }
                }
            } else {
                resolve(doc);
            }
        }).catch((err) => reject(err))
    })
}
