
import { Buffer } from 'buffer';


function getSecretKey(){
    return new Promise((resolve) => {
        getSecretKeyRaw().then(secretKey => {
            const keyData = new Uint8Array(secretKey.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
            crypto.subtle.importKey('raw', keyData, { name: 'AES-CBC', length: 256 }, false, ['encrypt', 'decrypt']).then(r => resolve(r))
        })
    })
}

function getSecretKeyRaw(){
    return new Promise((resolve) => {
        var request = indexedDB.open("ads_db");
        request.onsuccess = function(event) {
            const db = request.result;
            var tx = db.transaction(["key_info"]);
            var objectStore = tx.objectStore("key_info");
            var req = objectStore.get("secret_key")
            
            req.onsuccess = function(e){
                if(req.result === undefined){
                    setTimeout(() =>{
                        getSecretKeyRaw().then(r => {
                            resolve(r)
                        })
                    }, 100)
                }else{
                    resolve(req.result.secret_key)
                }
            }
        };
    })
}


export function fetchSecret(url, body){
    return new Promise((resolve, reject) => {
        body.timestamp = (new Date()).getTime()
        getSecretKey().then(secretKey => {
            const iv = crypto.getRandomValues(new Uint8Array(16));
            crypto.subtle.encrypt({ name: 'AES-CBC', iv }, secretKey, Buffer.from(JSON.stringify(body))).then(encryptedBody => {
                let new_body = {
                    encrypted: true,
                    user_id: body.user_id,
                    iv,
                    encrypted_body: new Buffer(encryptedBody).toString("hex")
                }

                fetch(url, {
                        method: "POST", 
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(new_body)
                    }).then(r => resolve(r))
            })
        })
    })
}

