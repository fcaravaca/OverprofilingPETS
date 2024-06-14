
import {fetchSecret} from './crypto.js'

export const SERVER_ADDRESS = "SERVER_ADDRESS"

export function sendInterestToServerDB(interest){
    getUserID().then(user_id => {
        fetchSecret(SERVER_ADDRESS + "interestValoration", {
                user_id: user_id,
                interest: interest
        }).then(res => res.json()).then(res => {
            if(res.received){
                var request = indexedDB.open("ads_db");
                request.onsuccess = function(event) {
                    var db = event.target.result;
                    var objectStore = db.transaction(["interests"], "readwrite").objectStore("interests")
                    objectStore.put({...interest, received: true})
                };
                console.log("Interest rating received")
            }
        }).catch(err => console.log(err))
    })
}

export function sendDemographicToServerDB(demo){
    if(demo.valoration === undefined){
        demo.valoration = null
    }
    getUserID().then(user_id => {
        fetchSecret(SERVER_ADDRESS + "demographic", {
            user_id: user_id,
            demographic: demo
        }).then(res => res.json()).then(res => {
            console.log("Demographic rating received")
        }).catch(err => console.log(err))
    })
}

export function sendUserDemographicToServerDB(demo){
    return new Promise((resolve, reject) =>{
        getUserID().then(user_id => {
            fetchSecret(SERVER_ADDRESS + "userDemographic", {
                    user_id: user_id,
                    demo: demo
                }).then(res => res.json()).then(res => {
                    resolve(true)
            }).catch(err => resolve(false))
        })
    })
}

export function sendAdValoration(ad_info){
    getUserID().then(user_id => {
        addClassificationToLocalDB({...ad_info, received:false}).then(() => {
            fetchSecret(SERVER_ADDRESS + "adClassified", {
                    user_id: user_id,
                    ad_info: {
                        ad_id: ad_info.ad_id,
                        guessed_platform: ad_info.guessed_platform,
                        valoration: ad_info.valoration
                    }
            }).then(res => res.json()).then(res => {
                console.log("Ad classification rating received")
                addClassificationToLocalDB({...ad_info, ...res})
            }).catch(err => console.log(err))
        })
    })
}


function getUserID(){
    return new Promise((resolve) => {

        var request = indexedDB.open("ads_db");
        request.onsuccess = function(event) {
            const db = request.result;
            var tx = db.transaction(["key_info"]);
            var objectStore = tx.objectStore("key_info");
            var req = objectStore.get("user_id")
            
            req.onsuccess = function(e){
                if(req.result === undefined){
                    setTimeout(() =>{
                        getUserID().then(r => {
                            resolve(r)
                        })
                    }, 100)
                }else{
                    resolve(req.result.user_id)
                }
            }
        };
        
    })

}


function addClassificationToLocalDB(ad){
    return new Promise((resolve, reject) => {

        var request = indexedDB.open("ads_db");
        request.onsuccess = function(event) {
            const db = request.result;

            var tx = db.transaction("ads", "readwrite");
            var objectStore = tx.objectStore("ads");
            var req = objectStore.put(ad);
            req.onsuccess = function(e) {
                resolve()                
            }
            req.onerror = function(e) {
                console.log("failed to update ad into db ", e)
                reject()
            }
        };
        
    })
}

export function getInterestRating(interset_name, existsMode=false){
    return new Promise((resolve) => {

        var request = indexedDB.open("ads_db");
        request.onsuccess = function(event) {
            const db = request.result;
            var tx = db.transaction(["interests"]);
            var objectStore = tx.objectStore("interests");
            const index = objectStore.index('interest_name');
            var req = index.openCursor(IDBKeyRange.only(interset_name))
            
            req.onsuccess = function(e){
                var cursor = e.target.result;
                if(cursor && cursor.value){
                    resolve(existsMode ? true : cursor.value.valoration)
                }else{
                    resolve(existsMode ? false : undefined)
                }
            }
        };
        
    })
}



export function getPercentageOfAds(platform){
    return new Promise((resolve) => {

        var request = indexedDB.open("ads_db");
        request.onsuccess = function(event) {
            const db = request.result;
            var tx = db.transaction(["postAdRate"]);
            var objectStore = tx.objectStore("postAdRate");
            const index = objectStore.index('platform');
            var req = index.openCursor(IDBKeyRange.only(platform))

            let totalPosts = 0
            let totalAds = 0
            
            req.onsuccess = function(e){
                var cursor = e.target.result;
                if(cursor && cursor.value){
                    totalPosts += cursor.value.totalPosts
                    totalAds += cursor.value.numberOfAds
                    cursor.continue()
                }else{
                    if(totalPosts !== 0){
                        resolve({perc: Math.round(totalAds/totalPosts * 100 * 100) / 100, totalAds, totalPosts})
                    }else{
                        resolve(undefined)
                    }
                }
               
            }
        };
        
    })

}

export function getAllReasonsOfAds(){
    return new Promise((resolve) => {

        var request = indexedDB.open("ads_db");
        request.onsuccess = function(event) {
            const db = request.result;
            var tx = db.transaction(["ads"]);
            var objectStore = tx.objectStore("ads");
            const req = objectStore.getAll();
            
            var res = []
            req.onsuccess = function(e){
                var cursor = e.target.result;
                for(var ad of cursor){
                    if(ad.reasons){
                        res = res.concat(ad.reasons)
                    }
                }
                res = res.map((interest) =>{
                    if(["Communicated in", "Similarities to", "time of day", "website you're on", "location i", "above the age", "located here", "Set their age", "Google's esti"].reduce((pV, cV) => {return pV + interest.includes(cV) }, false)){
                        return undefined
                    }
                    if(interest.includes("Your interests include ")){
                        return interest.split("Your interests include ")[1].split(".")[0]
                    }else{
                        return interest
                    }
                })
                resolve(res.filter(interest => interest !== undefined)) // Removes the undefined values
            }
        };
    })
}


export function getUserInfo(){
    return new Promise((resolve) => {

        let promises = [getUserID(), countAds(), countInterests()]

        Promise.all(promises).then(results => {
            resolve({
                userID: results[0],
                ads: results[1].ads,
                classified_ads: results[1].classified_ads,
                interests: results[2].interests,
                classified_interests: results[2].classified_interests
            })

        });
    })
}

export function checkTaskRequirements(){
    return new Promise((resolve) => {
        getUserID().then(user_id => {
            fetchSecret(SERVER_ADDRESS + "checkTaskRequirements", {
                user_id: user_id,
            }).then(res => res.json()).then(res => {
                resolve(res)
            }).catch(err => {
                console.log(err)
                resolve({completed: false})
            })
        })
    })
}

export function countInterests(platform=null){
    return new Promise((resolve) => {

        var request = indexedDB.open("ads_db");
        request.onsuccess = function(event) {
            const db = request.result;
            var tx = db.transaction(["interests"]);
            var objectStore = tx.objectStore("interests");
            const req = objectStore.getAll();
            
            var count = 0
            var count_classified = 0

            req.onsuccess = function(e){
                var cursor = e.target.result;
                for(var interest of cursor){
                    if(platform === null || platform === interest.platform){
                        if(interest.platform === "garbage"){
                            continue
                        }
                        count++
                        if(interest.valoration > 0){
                            count_classified++
                        }
                    }
                }
                resolve({interests: count, classified_interests: count_classified})

            }
        };
    })
}

const platformsToAsk = ["Twitter", "Facebook", "LinkedIn", "Browser"]

export function getSocialMediaUsage(){
    return new Promise((resolve) => {
        var request = indexedDB.open("ads_db");
        request.onsuccess = function(event) {
            const db = request.result;
            var tx = db.transaction("key_info");
            var objectStore = tx.objectStore("key_info");
            var req = objectStore.getAll();
            req.onsuccess = function(e){
                var key_names = e.target.result.map(info => info.key_name)
                resolve(platformsToAsk.filter(platform => !key_names.includes(platform)))
            }
        };
    })
}

export function sendSocialMediaUsage(platform, usage){
    return new Promise((resolve) => {
        getUserID().then(user_id => {
            fetchSecret(SERVER_ADDRESS + "usageInformation", {
                    user_id: user_id,
                    usage: usage,
                    platform: platform
                }).then(res => res.json()).then(res => {
                    if(res.received){
                        var request = indexedDB.open("ads_db");
                        request.onsuccess = function(event) {
                            const db = request.result;
                            var tx = db.transaction("key_info", "readwrite");
                            var objectStore = tx.objectStore("key_info");
                            var req = objectStore.put({"key_name": platform, "usage":usage});
                            req.onsuccess = function(e){
                                console.log(e)
                            }
                        }
                    }})
                }).catch(err => console.log(err))
        })
}

export function sendWarning(){
    return new Promise((resolve) => {
        getUserID().then(user_id => {
            fetchSecret(SERVER_ADDRESS + "warning", {
                    user_id: user_id
                }).catch(err => console.log(err))
        })})
}

function countAds(){
    return new Promise((resolve) => {

        var request = indexedDB.open("ads_db");
        request.onsuccess = function(event) {
            const db = request.result;
            var tx = db.transaction(["ads"]);
            var objectStore = tx.objectStore("ads");
            const req = objectStore.getAll();
            
            var count = 0
            var count_classified = 0

            req.onsuccess = function(e){
                var cursor = e.target.result;
                for(var ad of cursor){
                    count++
                    if(ad.valoration !== undefined && ad.guessed_platform !== undefined){
                        count_classified++
                    }
                }
                resolve({ads: count, classified_ads: count_classified})

            }
        };
    })
}


export function isAllowedToClassify(){
    return new Promise((resolve) => {
        countAdsInPlatforms().then(r => {
            if(r.length === 0){
                resolve(false)
            }else{
                let totalCount = Object.values(r).reduce((a,b) => a + b, 0)
                let numberOfPlatformsWithTenAds = Object.values(r).filter(a => a >= 10) 
                resolve(totalCount >= 50 && numberOfPlatformsWithTenAds.length >= 2)
            }
        })
    })
}



function countAdsInPlatforms(){
    return new Promise((resolve) => {

        var request = indexedDB.open("ads_db");
        request.onsuccess = function(event) {
            const db = request.result;
            var tx = db.transaction(["ads"]);
            var objectStore = tx.objectStore("ads");
            const req = objectStore.getAll();
            
            var count = {}

            req.onsuccess = function(e){
                var cursor = e.target.result;
                for(var ad of cursor){
                    let prev = count[ad.platform]
                    let nextValue = prev === undefined ? 1 : prev + 1
                    count[ad.platform] = nextValue
                }
                resolve(count)

            }
        };
    })
}
