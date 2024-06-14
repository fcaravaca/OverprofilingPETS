/*global chrome*/
chrome.runtime.onInstalled.addListener(() => {
    console.log('Chrome extension successfully installed!');
    chrome.tabs.create({'url': '/popup.html?route=age_verification', active: true })

    getUserPreferences();
    getUserID();
});

const SERVER_ADDRESS = "SERVER_ADDRESS"

// --- Is the App allowed to work --- //
function isUsageAllowed(){
    return new Promise(resolve => {
        chrome.storage.local.get(null, (items) => {
            if (items.terms === "agree") {
                resolve(true)
            }else{
                resolve(false)
            }
        });
    })
}

// --- Gets and save a client ID --- //
function getUserID(){
    console.log("getUserID")
    return new Promise((resolve, reject) => {
        isUsageAllowed().then((allowed) => { //First we need permissions from the user

            if(!allowed){ // Repeat this every 0.2s 
                setTimeout(()=>getUserID(), 200)
                resolve(undefined);
                return;
            }
    
            getUserIDFromDB().then(user_id =>{ // Check whether we have a user id
                if(user_id){
                    resolve(user_id)
                    return;
                }
                
                fetch(SERVER_ADDRESS + "register", {
                    method: "POST", 
                    headers: {'Accept': 'application/json'}
                }).then(res => res.json()).then(res => {
                    getUserIDFromDB().then(user_id =>{ 
                        if(user_id){ // This could happen if somehow there is a previous request which fullfiled before
                            resolve(user_id);
                        }else{
                            console.log("User id:", res)
                            saveUserIDLocalDB(res.user_id)
                            resolve(res.user_id)
                        }
                    });

                }).catch(err => console.log(err))       
            })
        });   
    })
}

// --- Parses the reasons of an add and added them to chrome storage --- //
function getTwitterAdReasons(ad){
    
    fetch("https://twitter.com/about-ads?aid=" + ad.ad_id).then(response => response.text()).then(response => {
        if(response !== undefined){

            response = decodeHtmlEntity(response)
            var reasons = response.substring(response.indexOf('"targetingMessage">'),response.length)
            reasons = reasons.substring(0, reasons.indexOf("</p>"))


            var indexes = getMatchIndices('class="detail"',reasons)

            
            var values = []

            for(var i = 0; i < indexes.length; i ++){
                var reason = reasons.substring(indexes[i] + 15)
                reason = reason.substring(0, reason.indexOf("</span>")).replace(/&quot;/g, '\\"');
                if(i > 0 && reason === values[0]){
                    continue;
                }
                values.push(reason)
            }

            console.log("twitter AD", ad)

            var ad_obj = {
                ad_id: "tw-" + ad.tweet_id,
                ad_tw_id: ad.ad_id,
                tweet_id: ad.tweet_id,
                tweet_info: ad.tweet_info,
                image: ad.image_url,
                author: values[0],
                reasons: values.slice(1),
                platform: "twitter",
                timestamp: new Date().getTime()
            }

            try{
                ad_obj.text = ad.tweet_info.full_text
            }catch(err){}

            // It's possible that some ads doesn't have any reasons, therefore we don't add them
            if(ad_obj.reasons.length === 0){
                ad_obj.reasons = ["No reasons found"]
            }

            console.log(ad_obj)
            saveAd(ad_obj)
        }
    }).catch(err => console.log(err))
}


// --- Parses the reasons of an ad and add them to chrome storage --- //
function parseAdSettingsFB(ad_reasons){
    var ad_id = ad_reasons.ad_id;
    ad_reasons.fb_ad_id = ad_reasons.ad_id
    ad_id = ad_id.substring(ad_id.indexOf('"ad_id":"')+9,ad_id.indexOf('"}'));
    

    isAdInDB("fb-" + ad_id).then(res =>  {
        if(res){
            return
        }

        ad_reasons.ad_id = "fb-" +ad_id

        chrome.storage.local.get(['fb_last_timestamp','fb_last_landing_page', 'fb_last_text', 'fb_last_media_url'], function(result) {
            ad_reasons.timestamp = result.fb_last_timestamp
            ad_reasons.landing_page = result.fb_last_landing_page
            ad_reasons.text = result.fb_last_text
            if(!ad_reasons.image){
                ad_reasons.image = result.fb_last_media_url
            }
            ad_reasons.platform = "facebook"
            saveAd(ad_reasons)
        });
        
    });
}


function getGoogleReasonsAd(ad, youtube=false){
    console.log(ad)
    var ad_url = ad.explanation
    ad.timestamp = new Date().getTime()
    if(!youtube){
        ad.platform = "google"
        ad.ad_id = getGoogleIdByLandingPage(ad.landing_page)
    }

    if(ad_url === undefined || ad_url.length < 1){
        console.log("ad without explanation url")
        saveAd(ad)
    }else{
        fetch(ad_url, {credentials: 'omit', headers:{"Accept-Language": "en-US,en;q=0.9"}}).then(res => res.text()).then(res => {
            
            var splitted = res.split("<li ");
            var ad_reasons = []
            
            for(var i = 1; i < splitted.length; i ++){
                var content = splitted[i].split('">')[1].split("</li>")[0]
                ad_reasons.push(content)
            }
            
            if(ad_reasons.length === 0){
                var fallback = res.split('<div class="UEwVMd">')[1]
                try{
                    fallback = fallback.split("Learn more about")[0]
                    ad_reasons.push(fallback.split("</div>")[0])
                }catch{
                    console.log("ATTENTION:", fallback, res)
                }
            }
            
            ad.reasons = ad_reasons
            console.log(ad)
            saveAd(ad)
        }).catch(err => console.log(err))
    }
}

/*--------------------------------------/
/            Ad Preferences             /
/--------------------------------------*/


async function getUserPreferences(){

    if( await isUsageAllowed() && await getUserIDFromDB() ){
        getHostnamesVisited()
        getGoogleUserPreferences()
        setTimeout(function(){getFBUserPreferences()}, 2 * 1000)
        setTimeout(function(){getTWUserPreferences()}, 4 * 1000)
        setTimeout(function(){getLinkedInUserPreferences()}, 6 * 1000)
        
        setTimeout(function(){
            getUserPreferences();
        }, 30 * 60 * 1000) // Every half an hour
    }else{
        setTimeout(function(){
            getUserPreferences();
        }, 1000) // Every second
    }   
}

chrome.runtime.onStartup.addListener(function (){
    setTimeout(() => {getUserID()}, 100)
    setTimeout(function(){
        getUserPreferences();
    }, 5000)
});

// --- Get FB User Preferences --- //
function getFBUserPreferences(){

    var url_request = "https://m.facebook.com/ads/preferences/categories/";

    fetch(url_request, {method: "GET"}).then(response => response.text()).then(response => {
        var ad_prefs_id = response.substring(response.indexOf('F7F8FA" id="')+12,response.indexOf(':0" '));
        var indexes = getMatchIndices('id=\\\\\\\"'+ad_prefs_id, response); //We find all the interests

        elements = [];
        for(var index=0; index<indexes.length; index++){
            try{
            chunk_interest = response.substring(indexes[index],response.length);
            // chunk_interest = chunk_interest.substring(0, chunk_interest.indexOf('auto;'));
            
            search_interest_id = chunk_interest.substring(chunk_interest.indexOf('"')+1,chunk_interest.length);
            search_interest_id = search_interest_id.substring(0,search_interest_id.indexOf('"')-1);

            name = chunk_interest.substring(chunk_interest.indexOf('FB:TEXT4')+11,chunk_interest.length);
            name = name.substring(0,name.indexOf('x3C/div')-1);

            // The description is the second 
            description = chunk_interest.substring(chunk_interest.indexOf('FB:TEXT4', chunk_interest.indexOf('FB:TEXT4') + 2)+11,chunk_interest.length);
            description = description.substring(0,description.indexOf('x3C/div')-1);

            fbid = response.substring(response.lastIndexOf(search_interest_id),response.length);
            fbid = fbid.substring(fbid.indexOf('key_path')+11, fbid.indexOf('ref_key')-3);

            if(fbid.indexOf(",") !== -1){ // The last ID would give a comma
                continue;
            }

            var preferences = new Object();
            preferences.fbid = fbid;
            preferences.name = name;
            preferences.topic = "no_result"
            preferences.id = fbid;
            preferences.description = description;
            if(fbid != "") elements.push((preferences));
            }catch(e){;}
        }
        var obj = {};

        for ( var i=0, len=elements.length; i < len; i++ )
            obj[elements[i]['id']] = elements[i];

        elements = new Array();
        for ( var key in obj )
            elements.push(obj[key]);
        
        const bulkOfInterests = []
        if(elements.length > 3){ // If the user doesn't have a FB account there will be like 2 false intersts, therefore check before
            for(var interest of elements){      
                if(!(interest.fbid.includes(":") || interest.fbid.includes("[]"))){
                    bulkOfInterests.push({
                        interest_id: "fb-" + interest.fbid,
                        interest_name: interest.name,
                        platform: "facebook",
                        description: interest.description
                    })
                }
            }
        }
        saveBulkOfInterests(bulkOfInterests)
    }).catch(e => console.log("Error fb getUserPreferences: ",e))//First try, general one
}

// --- Get TW User Preferences --- //
function getTWUserPreferences(){
    chrome.tabs.create({url: "https://twitter.com/settings/your_twitter_data/twitter_interests", active: false },  (tab) =>{
        chrome.storage.local.set({"tw_interests_tab_id": tab.id})
        setTimeout(function(){
            chrome.tabs.remove(tab.id).catch(err => console.log(err));
        },5000);
    })
}


async function getLinkedInUserPreferences(){

    const ogLocale = await fetch("https://www.linkedin.com/psettings/select-language?li_theme=light&openInMobileMode=true").then(response => response.text()).then(r => {
        return r.split("selected")[0].split("=").pop().split('"')[1]
    }).catch(() => console.log("Unable to find ogLocale"))

    const internalGetPreferences = async () =>{
        return new Promise((resolve) => {

            fetch("https://www.linkedin.com/psettings/advertising/li-enterprise-product?asJson=true").then(res => res.json()).then(res => {
                var interests = res.map.data.interests
                
                const bulkOfInterests = []
                for(var interest of interests){           
                    bulkOfInterests.push({
                        interest_id: "li-" + interest.urn,
                        interest_name: interest.catName,
                        platform: "linkedin"
                    })
                }
                saveBulkOfInterests(bulkOfInterests)
                resolve(true)
            }).catch(e => console.log("Error linkedin getUserPreferences: ",e))
        })
    }

    const changeLanguage = async (language) => {
        return new Promise((resolve) => {
            chrome.storage.local.get(['linkedin_csrf_token'], function(result) {

                if(result.linkedin_csrf_token === undefined){
                    resolve(false)
                    return
                }

                var url = "https://www.linkedin.com/psettings/select-language"            

                resolve(fetch(url, {
                    "headers": {
                        "accept": "*/*",
                        "accept-language": "es-ES,es;q=0.9,en;q=0.8",
                        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                        "sec-fetch-dest": "empty",
                        "sec-fetch-mode": "cors",
                        "sec-fetch-site": "same-origin",
                        "x-requested-with": "XMLHttpRequest"
                    },
                    "referrerPolicy": "origin",
                    "body": "locale=" + language + "&csrfToken=" + result.linkedin_csrf_token.replace(":","%3A"),
                    "method": "POST",
                    "mode": "cors",
                    "credentials": "include"
                }))
            })
        })
    }
    // Don't try to find interests
    if(ogLocale === undefined){
        return;
    }
    if(ogLocale !== undefined && ogLocale !== "en_US"){
        let change = await changeLanguage("en_US") 
        if(change === false){ // No csfr token
            chrome.tabs.create({url: "https://linkedin.com/feed", active: false },  (tab) =>{
                setTimeout(function(){
                    chrome.tabs.remove(tab.id).catch(err => console.log(err));
                },4000);
            })
            
            setTimeout(async () => {
                change = await(changeLanguage("en_US"))
                if(change !== false){
                    await internalGetPreferences()
                    await changeLanguage(ogLocale)        
                }
            }, 5000)
        }else{
            await internalGetPreferences()
            await changeLanguage(ogLocale)   
        }
    }else{
        internalGetPreferences()
    }
}

function getGoogleUserPreferences(){

    fetch("https://myadcenter.google.com/customize?ctb=topics&hl=en_GB").then(r=>r.text()).then(r => {
        seps = r.split("<li")
        const bulkOfInterests = []

        seps.forEach(sep => {
            sep = sep.split("</li")[0]
            if(sep.includes("data-id") && sep.includes('YcxLyd">')){
                interest = sep.split('YcxLyd">')[1].split("</div")[0]
                interest = decodeHtmlEntity(interest)
                if(interest){
                    interest_obj = {
                        interest_id: "gl-topic-" + interest,
                        interest_name: interest,
                        platform: "google"
                    } 
                    bulkOfInterests.push(interest_obj)  
                }
            }
        });
        if(bulkOfInterests.length > 0){
            console.log("Saving bulk of google", bulkOfInterests)
            saveBulkOfInterests(bulkOfInterests)
        }
    }).catch(err => console.log(err));

    fetch("https://myadcenter.google.com/controls?&hl=en_GB").then(r=>r.text()).then(r => {
        seps = r.split("<li")
        seps.forEach(sep => {
            sep = sep.split("</li")[0]
            if(sep.includes('BUHCWd>')){
                sep = sep.split('BUHCWd>')[1]
                title = sep.split("</div")[0]
                value = sep.split("</div")[1].split(">")[2]
                if(title && value){
                    title = decodeHtmlEntity(title)
                    value = decodeHtmlEntity(value)
                    id = "gl-" + title.replaceAll(" ", "").toLowerCase()
                   
                    if(title !== "Language"){
                        console.log(title, id, value)

                        saveDemographicData({
                            demographic_id: id, demographic_name: title,
                            value: value, platform: "google"
                        })
                    }
                }
            }
        });

        seps = r.split("DsfeNd")
        seps.forEach(sep => {
            if(sep.includes("vdBmL")){
                divs = sep.split("</div>")
                category = divs[0].split(">")[2]
                value = divs[1].split(">")[1]
                if(category && value){
                    category = decodeHtmlEntity(category)
                    value = decodeHtmlEntity(value)
                    switch(category){
                        case "Employer Size":
                            category = "Company Size"; break;
                        case "Industry":
                            category = "Job Industry"; break;
                        case "Parenting":
                            category = "Parental Status"; break;
                    }
                    id = "gl-" + category.replaceAll(" ", "").toLowerCase()
                    if(category == "Job Industry"){
                        id += "-" + category
                    }
                    if(value !== "Not enough info"){
                        console.log(category, id, value)
                        saveDemographicData({
                            demographic_id: id, demographic_name: category,
                            value: value, platform: "google"
                        })
                    }
                }
            }
        });

    }).catch(err => console.log(err));

    var url_request_GOOGLE = "https://adssettings.google.com/authenticated";
    fetch(url_request_GOOGLE).then(res => res.text()).then(res => {

        var splited = res.split("<li ")
        var res_copy = res.slice()
        splited.shift()
        var return_object = {}

        for(var i = 0; i < splited.length; i++){
            if(splited[i] === null){
                continue
            }
            var split_value = splited[i].split("</li>")[0]

            try{
                split_value = split_value.split('<div class="c7O9k">')[1].split("</div")[0]

                // check age and gender
                if(splited[i].includes("demographic/i_age")){
                    return_object.age = split_value 
                }else if(splited[i].includes("/demographic/i_gender")){ 
                    return_object.gender = split_value
                }else if(splited[i].includes("/demographic/i_language")){
                    var main_language = split_value.toLocaleLowerCase()
                    try{
                        var main_language = main_language.split(": ")[1].split(" ")[0]
                        var other_languages = res.toLocaleLowerCase().split('"' + main_language + '",')[1].split(']')[0]
                        other_languages = other_languages.replaceAll('"','').split(",")
                        return_object.language = [main_language].concat(other_languages)
                    }catch(err){
                        console.log(err)
                        return_object.language = [main_language]
                    }
                }else if(splited[i].includes("_30006_")){ // Home ownership, following this, the icons have the ID of the interest/demographic value, and it's easy to identify them
                    try{
                        return_object.homeownership = split_value.split(":")[1].trim()
                        split_value = null
                    }catch(_){}
                }else if(splited[i].includes("_30039_")){ // Parental Status
                    try{
                        return_object.parentalstatus = split_value.split(":")[1].trim()
                        split_value = null
                    }catch(_){}
                }else if(splited[i].includes("_30021_")){ // Company Size
                    try{
                        return_object.companysize = split_value.split(":")[1].trim()
                        split_value = null
                    }catch(_){}
                }else if(splited[i].includes("_30038_")){ // Education Status - see job industry
                    try{
                        var edu = res_copy.split('30038"')[1].split("]]")[0].split("[[")[1].split('","').slice(1) //The slice(1) would remove the first item of the array which is not a job industry but rather an ID
                        for(var j = 0; j < edu.length; j++){
                            edu[j] = edu[j].split('"')[0]
                        }
                        return_object.education = edu
                        split_value = null
                    }catch(_){}
                }else if(splited[i].includes("_30020_")){ // Job Industry
                    try{ //This may seem strange, but it works, the two first splits should give something like: ',"Sector laboral",null,[2],[["30023","Sector tecnológico"],["30041","Sector financiero"'
                        var industries = res_copy.split('30020"')[1].split("]]")[0].split("[[")[1].split('","').slice(1) //The slice(1) would remove the first item of the array which is not a job industry but rather an ID
                        for(var j = 0; j < industries.length; j++){
                            industries[j] = industries[j].split('"')[0]
                        }
                        return_object.industries = industries
                        split_value = null
                    }catch(err){ console.log(err)}
                }
                if(splited[i].includes("demographic/")){
                    split_value = null
                }

            }catch(err){
                split_value = null
            }
            splited[i] = split_value
        }
        splited = splited.filter(n => n)

        const bulkOfInterests = []
        for(var interest of splited){
            interest_obj = {
                interest_id: "gl-" + interest,
                interest_name: interest,
                platform: "google"
            }            
            bulkOfInterests.push(interest_obj)
        }
        console.log("Saving bulk of google")
        saveBulkOfInterests(bulkOfInterests)

        //Demographic data
        if(return_object.age){
            saveDemographicData({
                demographic_id: "gl-age", demographic_name: "Age",
                value: return_object.age, platform: "google"
            })
        }

        if(return_object.gender){
            saveDemographicData({
                demographic_id: "gl-gender", demographic_name: "Gender",
                value: return_object.gender, platform: "google"
            })
        }

        if(return_object.language){
            for(var i = 0; i < return_object.language.length; i++){
                saveDemographicData({
                    demographic_id: "gl-language-" + return_object.language[i], demographic_name: "Language",
                    value: return_object.language[i], platform: "google"
                })
            }
        }

        if(return_object.homeownership){
            saveDemographicData({
                demographic_id: "gl-homeownership", demographic_name: "Home-ownership Status",
                value: return_object.homeownership, platform: "google"
            })
        }

        if(return_object.parentalstatus){
            saveDemographicData({
                demographic_id: "gl-parentalstatus", demographic_name: "Parental Status",
                value: return_object.parentalstatus, platform: "google"
            })
        }

        if(return_object.companysize){
            saveDemographicData({
                demographic_id: "gl-companysize", demographic_name: "Company Size",
                value: return_object.companysize, platform: "google"
            })
        }

        if(return_object.education){
            for(var i = 0; i < return_object.education.length; i++){
                saveDemographicData({
                    demographic_id: "gl-education" + (i > 0 ? "-" + i : ""), demographic_name: "Education Status",
                    value: return_object.education[i], platform: "google"
                })
            }
        }

        if(return_object.industries){
            for(var i = 0; i < return_object.industries.length; i++){
                saveDemographicData({
                    demographic_id: "gl-jobindustry-" + return_object.industries[i], demographic_name: "Job Industry",
                    value: return_object.industries[i], platform: "google"
                })
            }
        }

    }).catch(err => console.log(err))
}

/*--------------------------------------/
/            FACEBOOK QUEUE             /
/--------------------------------------*/

setInterval(async function() {
    
    // It is necessary to check if we have permissions
    if(!( await isUsageAllowed() )){
        return;
    }
    
    chrome.storage.local.get(['fb_ad_queue'], async function(result) {

        var queue = result.fb_ad_queue
        var i = 0;

        if(queue === undefined ||queue.length === 0){
            return;
        }

        for(;i < queue.length; i++){
            var element = queue[i]

            const isInDB = await isAdInDB("fb-" + element.ad_id)

            if(!isInDB){
                chrome.storage.local.set({"fb_last_timestamp": element.timestamp})
                chrome.storage.local.set({"fb_last_landing_page": element.landing_page})
                chrome.storage.local.set({"fb_last_text": element.text})
                chrome.storage.local.set({"fb_last_media_url": element.media_url})
                chrome.tabs.create({url: element.url_request, active: false },  (tab) =>{
                    console.log("created fb ad tab id:", tab.id, "for ad id:",element.ad_id)
        
                    // This shouldn't be necessary if everything works fine, but this could fail in some cases, therefore the tab will close after 4 seconds 
                    setTimeout(function(){
                        chrome.tabs.remove(tab.id).catch(err => console.log(err));
                    },4000);
                });
                break
            }
        }

        var new_queue = queue.slice(i + 1)
        console.log("new queue:", new_queue)
        chrome.storage.local.set({"fb_ad_queue": new_queue})
    });
}, 30 * 1000); // milsec

setInterval(async function() {
    getUnsentAd().then(ad => {
        if(ad !== undefined){
            console.log("Sending ad again", ad)
            sendAdToServer(ad)
        }
    })    
    getUnsentInterests().then(interests => {
        if(interests !== undefined && interests.length > 0){
            console.log("Sending interests again", interests)
            sendInterestsToServer(interests)
        }
    })

    getUnsentDemo().then(demos => {
        if(demos !== undefined && demos.length > 0){
            console.log("Sending demographics again", demos)
            demos.forEach(demo => {
                sendDemographicToServer(demo).then(() => {
                    saveDemographicData({...demo, received: true}, false)
                }).catch(r => console.log(r))
            })
        }
    })

    chrome.storage.local.get(['demographic_info_received','demographic_info'], function(result) {
        if(result.demographic_info !== undefined && !result.demographic_info_received){
            setTimeout(() => {
                sendDemographicInfo()
            }, 2000)
        }
    })
}, 12500)

function sendDemographicInfo(){
    chrome.storage.local.get(['demographic_info_received','demographic_info'], function(result) {
        if(result.demographic_info !== undefined && !result.demographic_info_received){
            getUserID().then(user_id => {
                fetchSecret(SERVER_ADDRESS + "userDemographic", {
                        user_id: user_id,
                        demo: result.demographic_info
                    }).then(res => res.json()).then(res => {
                        chrome.storage.local.set({"demographic_info_received": true})
                }).catch(err => console.log(err))
            })
        }
    })
}


setInterval(async function() {
    isUsageAllowed().then(allowed => {
        if(allowed){
            sendPostAdRate()
        }
    })
}, 120000)

let calledBefore = false
setInterval(function(){ // Check if usage allowed, and then check if are there any interest in the db, if not the two times, request preferences
    isUsageAllowed().then(r =>{
        if(r && !calledBefore){
            areThereInterests().then(interests => {
                if(!interests){
                    setTimeout(() => {
                        areThereInterests().then(interests => {
                            if(!interests){
                                getUserPreferences()
                                calledBefore = true
                            }
                        })
                    }, 3000)
                }
            })
        }
    })
}, 4000)

/*--------------------------------------/
/               LISTENERS               /
/--------------------------------------*/

// --- Listener on tab changes --- //
try{
    chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
        if(changeInfo.status == 'complete' || changeInfo.url !== undefined){ // The condition may force the execution twice (or even more times) but it shouldn't be a problem 
            isUsageAllowed().then(res => {
                if(res){ // It is necessary to check whether there are perms to execute this

                    // XHR intercept
                    
                    chrome.scripting.executeScript(
                        {target: {tabId: tab.id},
                        files: ['inject.js'],
                        world: 'MAIN'
                        }
                    ).catch(err => console.log(err))

                    getAdFromLandingPage(changeInfo.url).then(r => { // A previous landing page found to be the link
                        if(r !== undefined){
                            sendVisitedAdToServer(r)
                        }
                    })
                

                    // Facebook AD tab
                    if(changeInfo.url !== undefined && changeInfo.url.includes("nt/screen") && !changeInfo.url.includes('targeting_data')){

                        chrome.scripting.executeScript( // I'm not really sure why using files and the chrome.runtime.sendMessage won't work, but it seems FB uses that in the ad page, therefore the code will be displayed here
                            {target: {tabId: tab.id}, 
                                /* Method to get the reasons why I see the ad */
                                func: () => { 
                                    return_object = {"reasons": []}

                                    return_object["ad_id"] = decodeURIComponent(decodeURI(window.location.href));
                                    
                                    if(document.querySelector("img[style*='fit: cover']"))
                                        return_object["image"] = (document.querySelector("img[style*='fit: cover']").src);
                                    else
                                        return_object["image"] = 'no image';

                                    reasons = document.querySelectorAll("div[aria-label='Detail page']");
                                    var interests = null
                                    
                                    for(var i=0; i<reasons.length; i++){
                                        if(reasons[i].textContent.includes("Shown interest")){
                                            interests = reasons[i]
                                        }else{
                                            return_object["reasons"].push(reasons[i].textContent);
                                        }
                                    }
                                    return_object["author"] = (document.querySelector("span[role='LINK']").textContent)

                                    if(interests){
                                        console.log("Found intersts")
                                        return_object["interests"] = true
                                        interests.querySelectorAll("div").forEach((div) => {
                                            setTimeout(() => {
                                                div.click()
                                            }, 50)
                                        })
                                    }

                                    return return_object
                                }
                            },
                            (result) => {

                                var results = result[0].result
                                if(results.interests){
                                    setTimeout(() => {
                                        chrome.scripting.executeScript( //It is necessary to execute this again because the tab changes
                                            {target: {tabId: tab.id},
                                            func: () => {          
                                                var interests_array = []
                                                var interests = document.querySelectorAll("div[class='_2rgt _1j-f _2rgt _3zi4 _2rgt _1j-f _2rgt']")
                                                interests.forEach(interest => {
                                                    var interest_span = interest.querySelector("span")
                                                    interests_array.push(interest_span.textContent)
                                                })
                                                return interests_array
                                            },
                                        },
                                        (result) => {
                                            
                                            console.log(result[0].result)
                                            result[0].result.forEach(interest => {
                                                results.reasons.push(interest)
                                            })
                                            parseAdSettingsFB(results)
                                            chrome.tabs.remove(tab.id).catch(err => console.log(err))
                                        })
                                    }, 1250)
                                }else{
                                    parseAdSettingsFB(results);
                                    chrome.tabs.remove(tab.id).catch(err => console.log(err))
                                }
                            } // Passes the info returned and closes the tab
                        );
                    }
                    if(changeInfo.url !== undefined && changeInfo.url.includes("twitter.com") && changeInfo.url.includes('/status/')){
                        tweet_id = changeInfo.url.split("/status/")[1]
                        console.log(changeInfo.url, tweet_id)
                        setTimeout(() => {
                            getAdById("tw-" + tweet_id).then(r => {
                                if(r !== undefined){
                                    console.log("Visited tweet", r)
                                    sendVisitedAdToServer(r)
                                }
                            })
                        }, 10000)

                    }
                }else{
                    console.log("App doesn't have permissions to execute", res)
                }
            })
        }
    });
}catch(e){}


// Get the linkedin CSFR Token - This is mandatory to make the request to get the reasons of an ad
chrome.webRequest.onBeforeSendHeaders.addListener(
    details => {
        
        // Check if we have permissions to access user data
        isUsageAllowed().then(res => {
            if(res){
                const headers = details.requestHeaders
                headers.forEach(header =>{
                    if(header.name === "csrf-token"){
                        chrome.storage.local.set({"linkedin_csrf_token": header.value})
                    }
                })
            }
        })
        
    },
    {urls: ['https://www.linkedin.com/*']},
    ['requestHeaders'],
);

        
// --- Chrome Messages Listener --- //
chrome.runtime.onMessage.addListener((request, sender, sendResponse) =>{
    listenerFunction(request, sender, sendResponse)

    return true;
})
const listenerFunction = (request, sender, sendResponse) => {

    isUsageAllowed().then(perms => {

        if(!perms){ //Stop the execution if a message is sent
            return
        }

        console.log(request.message)
        switch (request.message) {

            case 'resultsAds':
                isAdInDB(getGoogleIdByLandingPage(request.ads.landing_page)).then(res =>{
                    if(!res){
                        request.ads.current_url = sender.tab.url // Replace, because sometimes it gives another url
                        if(!request.ads.landing_page.endsWith("url=") && !request.ads.landing_page.startsWith("https:///") && !request.ads.landing_page.toLowerCase().startsWith("https://_root.clicktag") && !request.ads.landing_page.toLowerCase().startsWith("_root.clicktag")){       
                            setTimeout(() => {
                                getGoogleAdImage(request.ads.frame_url).then(r => {
                                    console.log("GoogleAdImage retrieved:", r)
                                    if(!request.ads.image && r){
                                        request.ads.image = r.image
                                    }
                                    
                                    if(r && r.image_base64_url){
                                        request.ads.image_base64_url = r.image_base64_url
                                    }
                                    
                                    
                                    if(request.ads.landing_page){
                                        if(request.ads.landing_page.indexOf(getBetterURL(request.ads.current_url).split(".")[0]) === -1){ //This will avoid ads of the same page to be added
                                            getGoogleReasonsAd(request.ads)
                                        }
                                    }else{
                                        getGoogleReasonsAd(request.ads)
                                    }
                                })
                            }, 3000)



                        }
                    }else{
                        addRepeatedAdCount(getGoogleIdByLandingPage(request.ads.landing_page), tab_url=sender.tab.url)
                    }
                })
                break;
            case 'googleAdImage':
                saveGoogleAdImage(request.data)
                break;
            case "firstDOM":
                break;
            case "getWAST":
                // Creates a new tab only if the ad_id is new
                const ad_id = request.ad_id.split('"')[0] // request.ad_id sometimes returns only the id, and sometimes '<ad_id>",client_token....' 
                isAdInDB("fb-"+ad_id).then(res =>{
                    if(!res){
                        setTimeout(function(){
                            addToFBAdQueue({url_request: request.url_request, ad_id: ad_id, timestamp: new Date().getTime(), landing_page: request.landing_page, media_url: request.media_url, text: request.text})
                        }, Math.random()*1000)
                    }else{
                        addRepeatedAdCount("fb-"+ad_id)
                    }
                })   
                break;
            case "twitter_ad":
                console.log(request.ad_id, request.tweet_id)

                isAdInDB("tw-" + request.tweet_id).then(res => {
                    if(!res){
                        sendResponse("ok")
                        getTwitterAdReasons(request)
                    }else{
                        console.log("Ad already on db")
                        sendResponse("already in list")
                        addRepeatedAdCount("tw-" +request.tweet_id)
                    }
                })
                
                break;
            case "ad_post_rate":
                putPostAdRate({id: request.id, platform: request.platform, totalPosts: request.totalPosts, numberOfAds: request.numberOfAds})
                break;
            case "fb_ad_click":
                console.log(request)
                for(var link of request.links){
                    getAdFromLandingPage(link).then(r =>{
                        sendVisitedAdToServer(r)
                    })
                    if(link.startsWith("https://l.facebook.com/l.php?u=")){
                        fetch(link).then(r => r.text()).then(r => {
                            try{
                                url = r.split('document.location.replace("')[1].split('");</script>')[0].replaceAll("\\","")
                                getAdFromLandingPage(url).then(r =>{
                                    sendVisitedAdToServer(r)
                                })
                            }catch{}
                        })
                    }
                }
                break;
            case "twitter_ad_click":
                console.log(request.textContent)
                setTimeout(() =>{
                    getAdByText(request.textContent, "twitter", true).then((r) =>{
                        if(r === undefined){
                            setTimeout(() =>{
                                getAdByText(request.textContent, "twitter", true).then((r) =>{
                                    sendVisitedAdToServer(r)
                                })
                            }, 15000)

                        }else{
                            sendVisitedAdToServer(r)
                        }
                    })
                }, 10000)
                break;
            case "twitter_interests":
                chrome.storage.local.get(['tw_interests_tab_id'], function(result) {
                    var tab_id = result.tw_interests_tab_id
                    
                    if(tab_id !== undefined){
                        chrome.tabs.remove(tab_id).catch(err => console.log(err))
                    }
                    const bulkOfInterests = []
                    for(var interest of request.interests.interested_in){
                        bulkOfInterests.push({
                            interest_id: "tw-" + interest.id,
                            interest_name: interest.display_name,
                            platform: "twitter"
                        })
                    }
                    saveBulkOfInterests(bulkOfInterests)
                })
                break;
            case "linkedin_ad":
                var timestamp = new Date().getTime()
                setTimeout(function(){
                    console.log("Linkedin AD: ", request.ad_id)
                    isAdInDB("li-" + request.ad_id).then(res =>{
                        if(res){
                            addRepeatedAdCount("li-" + request.ad_id)
                            return;
                        }
                        chrome.storage.local.get(['linkedin_csrf_token', 'linkedin_paginationToken'], function(result) {
                            
                            var url = "https://www.linkedin.com/voyager/api/voyagerFeedDashAdServing/urn:li:fsd_adServing:(urn:li:sponsoredCreative:" +
                            request.ad_id + "," + new Date().getTime()+ ")?decorationId=com.linkedin.voyager.dash.deco.feed.revenue.AdServing-23"
                            
                            fetch(url,{headers:{"csrf-token": result.linkedin_csrf_token}}).then(res => res.json()).then(res => {
                                var ad_reasons = []
                                var author = ""
                                
                                for(var i = 0; i < res.matchedTargetingFacets.length; i++){
                                    var reason_object = res.matchedTargetingFacets[i]
                                    var reason_text = reason_object.segmentDetail.text + " " + reason_object.detail.text
                                    
                                    // It seems this response is always in English, but I could be wrong
                                    if(reason_object.segmentDetail.text.includes("LinkedIn implements strict") || reason_object.segmentDetail.text.includes("LinkedIn may infer your")){
                                        reason_text = reason_object.detail.text
                                    }
                                    
                                    ad_reasons.push(reason_text)
                                    if(reason_object.detail.text.indexOf(" wants to")[0] !== -1){ 
                                        author = reason_object.detail.text.split(" wants to")[0]
                                    }
                                }
                                
                                saveAd({ad_id: "li-" + request.ad_id, 
                                        author: author, 
                                        reasons: ad_reasons, 
                                        timestamp: timestamp, 
                                        image: request.image,
                                        text: request.text,
                                        platform: "linkedin",
                                        landing_page: request.landing_page
                                    })                            
                            }).catch(e => console.log(e))
                        })
                    })
                }, Math.random()*2000)
                
                break;
            case "linkedin_ad_click":
                console.log(request.ad_id)
                setTimeout(() =>{
                    getAdById("li-" + request.ad_id).then((r) =>{
                        if(r === undefined){
                            setTimeout(() =>{
                                getAdById("li-" + request.ad_id).then((r) =>{
                                    sendVisitedAdToServer(r)
                                })
                            }, 15000)

                        }else{
                            sendVisitedAdToServer(r)
                        }
                    })
                }, 10000)
                break;
            case "google_ad_click":
                    setTimeout(() =>{
                        var id = getGoogleIdByLandingPage(request.landing_page)
                        getAdById(id).then((r) =>{
                            if(r !== undefined){
                                sendVisitedAdToServer(r)
                            }
                        })
                    }, 10000)
                    break;
            case "youtube_ad":
                console.log("YOUTUBE AD")
                getGoogleReasonsAd({ad_id: request.ad_id,
                                        explanation: request.explanation,
                                        landing_page: request.landing_page,
                                        text: request.text, 
                                        author: request.author, 
                                            image: request.thumbnail_url,
                                    platform: "youtube"}, youtube=true)
                
            default:
                break;
            }
    })

}

function getBetterURL(url){
    if(!url){
        return undefined
    }
    if(url.indexOf("://") !== -1){
        url = url.split("://")[1]
    }
    
    url = url.split("/")[0]

    if(url.indexOf("www.") === 0){
        url = url.split("www.")[1]
    }
    return url.split("?")[0]
}

                                
// --- Utility functions --- //

function addToFBAdQueue(ad_url_obj){
    
    chrome.storage.local.get(['fb_ad_queue'], function(result) {
        var queue = []
        if(result.fb_ad_queue !== undefined){
            queue = result.fb_ad_queue
        }
        
        var repeated = false
        queue.forEach((obj) =>{
            if(obj.ad_id === ad_url_obj.ad_id){
                repated = true
            }
        })
        if(!repeated){   
            queue.push(ad_url_obj)
            chrome.storage.local.set({"fb_ad_queue": queue})
        }
        
    });
}

                                

function getMatchIndices(regex, str){
    var result = [];
    var match;
    regex = new RegExp(regex,'g');
    
    while (match = regex.exec(str)) result.push(match.index);
    return result;
}

// Needs a string
 function validFbAdID(ad_id_to_check){
    if (typeof ad_id_to_check !== 'string') {
        return false;
      }
    
      const num = Number(ad_id_to_check);
    
      if (Number.isInteger(num) && num > 0) {
        return true;
      }

      return false;
 }

var decodeHtmlEntity = function(str) {
    return str.replace(/&#(\d+);/g, function(match, dec) {
      return String.fromCharCode(dec);
    });
};


function getGoogleIdByLandingPage(landing_page) {

    var landing_URL = new URL(landing_page.startsWith("http") ? landing_page : "https://" + landing_page)
    var search_parameters = new URLSearchParams(landing_URL.search)
    search_parameters.delete("gclid")
    search_parameters.delete("utm_source")
    search_parameters.delete("utm_content")
    search_parameters.delete("utm_term")
    search_parameters.delete("Origin")
    search_parameters.delete("veh")
    search_parameters.delete("trk")
    search_parameters.delete("nm")
    search_parameters.delete("cmadid")
    search_parameters.delete("laxrid")
    search_parameters.delete("laxerid")
    search_parameters.delete("ai")
    search_parameters.delete("sig")
    search_parameters.delete("at_variant")
    search_parameters.delete("mcid")

    landing_URL.search = search_parameters
    var id = "gl-" + landing_URL.toString().split("&nm")[0]
    id = id.substring(0,255) 
    return id 
}


// --- DB FUNCTIONS --- //

var db;
const dbName = "ads_db";
var request = indexedDB.open(dbName, 13);

request.onsuccess = function(event) {
    db = request.result;
    db.onerror = function(event) {
        console.log("db error", event)
    };
};

function saveAd(ad){
    console.log("saving ad:", ad)
    if(ad.landing_page && !ad.landing_page.startsWith("http")){
        ad.landing_page = "https://" + ad.landing_page
    }
    var tx = db.transaction("ads", "readwrite");
    var objectStore = tx.objectStore("ads");
    var req = objectStore.add(ad);
    req.onsuccess = function(e) {
        console.log("ad added to db")
        sendAdToServer(ad)
    }
    req.onerror = function(e) {
        console.log("failed to add to db ", e)
    }
}

function saveGoogleAdImage(image_data){
    if(db === undefined){
        try{
            db = request.result
        }catch(_){
            setTimeout(() =>{
                saveGoogleAdImage(image_data)
            }, 100)
            return;
        }
    }
    var tx = db.transaction("googleAdImages", "readwrite");
    var objectStore = tx.objectStore("googleAdImages");
    var req = objectStore.add(image_data);
    req.onsuccess = function(e) {
        console.log("image data added to db")
    }
}

function getGoogleAdImage(frame_url){
    return new Promise((resolve) =>{
        console.log(frame_url)
        if(!frame_url){
            resolve(undefined)
        }

        if(db === undefined){
            try{
                db = request.result
            }catch(_){
                setTimeout(() =>{
                    getGoogleAdImage(frame_url).then(r => resolve(r))
                }, 500)
                return;
            }
        }
        var tx = db.transaction(["googleAdImages"]);
        var objectStore = tx.objectStore("googleAdImages");
        var req = objectStore.get(frame_url)
    
        req.onsuccess = function(e){
            console.log(req.resul)
            resolve(req.result)
        }
    })

}

function getAdByText(text, platform, nonVisited=false){
    return new Promise((resolve) =>{
        if(db === undefined){
            try{
                db = request.result
            }catch(_){
                setTimeout(() =>{
                    getAdByText(text, platform, nonVisited).then(r => resolve(r))
                }, 500)
                return;
            }
        }
        var tx = db.transaction(["ads"]);
        var objectStore = tx.objectStore("ads");
        const index = objectStore.index('platform');
        var req = index.openCursor(IDBKeyRange.only(platform));
        text = text.replaceAll("?","").replaceAll("\n","")
        req.onsuccess = function(e){
			var cursor = e.target.result;
			if(cursor){
                if(!cursor.value.text || (cursor.value.visited && nonVisited) || !text.includes(cursor.value.text.replaceAll("?","").replaceAll("\n","").replaceAll("\\\\n","").replaceAll("&amp;", "&").replaceAll("&#039;","'").replaceAll(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2580-\u27BF]|\uD83E[\uDD10-\uDDFF]/g, ''))){
                    cursor.continue()
                }else{
                    console.log("Found Ad by text")
                    resolve(cursor.value)
                }
			}else{
                resolve(undefined)
            }
        }
    })

}

function updateAdLocal(ad){
    console.log("Updating ad:", ad)
    var tx = db.transaction("ads", "readwrite");
    var objectStore = tx.objectStore("ads");
    var req = objectStore.put(ad);
    req.onsuccess = function(e) {
        console.log("ad updated to db")
    }
    req.onerror = function(e) {
        console.log("failed to update ad into db ", e)
    }

}

function sendAdToServer(ad){
    getUserID().then(user_id =>{
        fetchSecret(SERVER_ADDRESS + "ad", {
                user_id: user_id,
                ad_info: ad
        }).then(res => res.json()).then(res => {
            if(res.image_file !== "no image"){
                console.log("Image received:" + res.image_file)
            }
            let new_ad = {...ad, ...res} 
            updateAdLocal(new_ad)
        }).catch(err => console.log(err))
    }).catch(() => console.log("Couldnt send ad")) // This shouldn't happen: no permissions to execute the app, but somehow managed to execute sendAdToServer 
}

function sendInterestToServer(interest){ //Only used when the interest couldnt been sent to the server after valoration
    getUserID().then(user_id => {
        fetchSecret(SERVER_ADDRESS + "interests", {
                user_id: user_id,
                interests: [interest]
        }).then(res => res.json()).then(res => {
            var request = indexedDB.open("ads_db");
            request.onsuccess = function(event) {
                var db = event.target.result;
                var objectStore = db.transaction(["interests"], "readwrite").objectStore("interests")
                objectStore.put({...interest, received: true})
            };
            console.log("Interest rating received")
        }).catch(err => console.log(err))
    })
}

function sendPostAdRate(){
    getUserID().then(user_id =>{
        getPostAdRate().then(ad_post_rate => {
            fetchSecret(SERVER_ADDRESS + "adPostRate", {
                user_id: user_id,
                ad_post_rate: ad_post_rate
            }).then(res => res.json()).then(res => {
                console.log("Ad post rate recevied")
            }).catch(err => console.log(err))
        })
    }).catch((err) => console.log(err))
}

function sendVisitedAdToServer(ad){
    getUserID().then(user_id =>{
        fetchSecret(SERVER_ADDRESS + "landingPageVisited", {
            user_id: user_id,
            ad_id: ad.ad_id
        }).then(res => res.json()).then(res => {
            let new_ad = {...ad, ...res} 
            updateAdLocal(new_ad)
        }).catch(err => console.log(err))
    }).catch(() => console.log("Couldnt send ad")) // This shouldn't happen: no permissions to execute the app, but somehow managed to execute sendAdToServer 
}


function sendInterestsToServer(interests){
    getUserID().then(user_id =>{
        fetchSecret(SERVER_ADDRESS + "interests", {
            user_id: user_id,
            interests: interests
        }).then(res => res.json()).then(res => {
            if(res.received){
                var objectStore = db.transaction(["interests"], "readwrite").objectStore("interests")
                for(var interest of interests){
                   objectStore.put({...interest, received: true})
                }
            }else{
                console.log("error ocurred sending interests", interests)
            }
        }).catch(err => console.log(err))
    }).catch(() => console.log("Couldnt send interests")) // This shouldn't happen: no permissions to execute the app, but somehow managed to execute sendAdToServer 
}

function sendDemographicToServer(demo){
    return new Promise((resolve, reject) => {
        getUserID().then(user_id =>{
            fetchSecret(SERVER_ADDRESS + "demographic", {
                user_id: user_id,
                demographic: demo
            }).then(res => res.json()).then(res => {
                if(res.received){
                    console.log("received info")
                    resolve()
                }else{
                    reject("error ocurred sending demographic")
                }
            }).catch(err => {
                console.log(err)
                setTimeout(() => resolve(sendDemographicToServer(demo)), 2500)
            })
        }).catch(() => reject("Couldnt send demographic")) 
    })
}

function saveBulkOfInterests(interests){
    const elementsToTry = []

    console.log("trying to save:", interests)
    for(interest of interests){
        interest.interest_name = interest.interest_name.replace("&amp;", "&").replace("&#039;","'")
        elementsToTry.push(saveInterestDB(interest))
    }
    Promise.all(elementsToTry).then((values) =>{
        const elementsToSend = []
        for(let i = 0; i < values.length; i ++){
            if(values[i]){
                elementsToSend.push(interests[i])
            }
        }
        if(elementsToSend.length > 0){
            console.log("Really trying to send: ", elementsToSend)
            sendInterestsToServer(elementsToSend)
        }
    })
}

function saveInterestDB(interest){
    return new Promise((resolve) =>{
        if(db === undefined){
            try{
                db = request.result
            }catch(_){
                setTimeout(() =>{
                    saveInterestDB(interest).then(r => resolve(r))
                }, 500)
                return;
            }
        }
        var tx = db.transaction("interests", "readwrite");
        var objectStore = tx.objectStore("interests");
        var req
        if(interest.platform === "twitter"){
            const index = objectStore.index('platform');
            req = index.openCursor(IDBKeyRange.only(interest.platform));
            req.onsuccess = function(e) {
                var cursor = e.target.result;
                if (cursor){
                    if(cursor.value.interest_name === interest.interest_name){
                        resolve(false)
                        return
                    }
                    cursor.continue()
                }else{
                    objectStore.add(interest)
                    resolve(true)
                }
            };
        }else{
            req = objectStore.openCursor(interest.interest_id);
            req.onsuccess = function(e) {
                var cursor = e.target.result; 
                if (!cursor) {
                    objectStore.add(interest)
                    resolve(true)
                }else{
                    resolve(false)
                }
            };
        }
    })
}

function saveDemographicData(demo, sendToServer=true){
    console.log(demo)
    var tx = db.transaction("demographic_data", "readwrite");
    var objectStore = tx.objectStore("demographic_data");
    var req = objectStore.openCursor(demo.demographic_id);
    req.onsuccess = function(e) {
        var cursor = e.target.result;
        if (!cursor) { 
            objectStore.add(demo)
            if(sendToServer){
                sendDemographicToServer(demo).catch(err => console.log(err))
            }
        }else{
            if(cursor.value.value !== demo.value || demo.received){
                objectStore.put(demo)
                if(sendToServer){
                    sendDemographicToServer(demo).catch(err => console.log(err))
                }
            }
        }
    };
}


function isAdInDB(ad_id){
    return new Promise((resolve) =>{
        if(db === undefined){
            try{
                db = request.result
            }catch(_){
                setTimeout(() =>{
                    isAdInDB(ad_id).then(r => resolve(r))
                }, 500)
                return;
            }
        }
        var tx = db.transaction(["ads"]);
        var objectStore = tx.objectStore("ads");
        var req = objectStore.get(ad_id)
    
        req.onsuccess = function(e){
            resolve(req.result !== undefined)
        }
    })
}

function areThereInterests(){
    return new Promise((resolve) =>{
        if(db === undefined){
            try{
                db = request.result
            }catch(_){
                setTimeout(() =>{
                    areThereInterests().then(r => resolve(r))
                }, 500)
                return;
            }
        }
        var tx = db.transaction(["interests"]);
        var objectStore = tx.objectStore("interests");
        var req = objectStore.getAll()
    
        req.onsuccess = function(e){
            resolve(e.target.result.length > 0)
        }
    })
}

function getAdById(ad_id){
    return new Promise((resolve) =>{
        if(db === undefined){
            try{
                db = request.result
            }catch(_){
                setTimeout(() =>{
                    getAdById(ad_id).then(r => resolve(r))
                }, 500)
                return;
            }
        }
        var tx = db.transaction(["ads"]);
        var objectStore = tx.objectStore("ads");
        var req = objectStore.get(ad_id)
    
        req.onsuccess = function(e){
            resolve(req.result)
        }
    })  
}

function getAdFromLandingPage(landing_page, times = 0){

    if(landing_page === undefined){
        return new Promise((resolve) => resolve(undefined))
    }
    if(!landing_page.includes("youtube.com/watch?v")){
        landing_page = landing_page.split("?")[0] //Remove the url parameters as they would not be included in the URL
    }
    isHttp = landing_page.startsWith("http:")
    // Two landing pages to check, just inb case the / is not included in any version of the landing page
    var alternative_landing_page = landing_page
    if(alternative_landing_page.endsWith("/")){
        alternative_landing_page = alternative_landing_page.slice(0,alternative_landing_page.length-1)
    }else{
        alternative_landing_page = alternative_landing_page + "/"
    }

    return new Promise((resolve) =>{
        Promise.all([
            getAdFromLandingPageInternal(landing_page),
            getAdFromLandingPageInternal(alternative_landing_page),
            getAdFromLandingPageInternal(landing_page.replace(isHttp ? "http:" : "https:", isHttp ? "https:" : "http:")),
            getAdFromLandingPageInternal(alternative_landing_page.replace(isHttp ? "http:" : "https:", isHttp ? "https:" : "http:")),
            getAdFromLandingPageInternal(landing_page.replace("www.","")),
            getAdFromLandingPageInternal(alternative_landing_page.replace("www.","")),
            getAdFromLandingPageInternal(landing_page.replace(isHttp ? "http:" : "https:", isHttp ? "https:" : "http:").replace("www.","")),
            getAdFromLandingPageInternal(alternative_landing_page.replace(isHttp ? "http:" : "https:", isHttp ? "https:" : "http:").replace("www.",""))
        ]).then((values)=> {
            for(var value of values){
                if(value !== undefined){
                    resolve(value)
                    return
                }
            }

            if(times < 4){ //Why repeat the process so many times? It is possible to retrieve the information of an ad some minutes after the ad was visualized
                setTimeout(() => {
                    getAdFromLandingPage(landing_page, times + 1 ).then(r => {
                        resolve(r)
                    })
                }, 90 * 1000)
            }else{
                resolve(undefined)
            }

        });
    })
}

function getAdFromLandingPageInternal(landing_page){
    return new Promise((resolve) =>{
        if(db === undefined){
            try{
                db = request.result
            }catch(_){
                setTimeout(() =>{
                    getAdFromLandingPageInternal(landing_page).then(r => resolve(r))
                }, 100)
                return
            }
        }
        var tx = db.transaction(["ads"]);
        var objectStore = tx.objectStore("ads");
        const index = objectStore.index('landing_page');
        var req = index.openCursor(IDBKeyRange.only(landing_page));
    
		req.onsuccess = function(e) {
			var cursor = e.target.result;
			if(cursor){
                if(cursor.value.visited){
                    cursor.continue()
                }else{
                    resolve(cursor.value)
                }
			}else{
                resolve(undefined)
            }
		};
    })
}

function saveUserIDLocalDB(user_id){
    console.log("saving user id: ", user_id)
    var tx = db.transaction("key_info", "readwrite");
    var objectStore = tx.objectStore("key_info");
    var req = objectStore.add({"key_name": "user_id", "user_id":user_id});
    req.onsuccess = function(e){
        console.log(e)
    }
}

function getUserIDFromDB(){
    return new Promise((resolve) =>{
        if(db === undefined){
            try{
                db = request.result
            }catch(_){
                setTimeout(() =>{
                    getUserIDFromDB().then(r => resolve(r))
                }, 100)
                return
            }
        }
        var tx = db.transaction(["key_info"]);
        var objectStore = tx.objectStore("key_info");
        var req = objectStore.get("user_id")
    
        req.onsuccess = function(e){
            if(req.result === undefined){
                resolve(req.result)
            }else{
                resolve(req.result.user_id)
            }
        }
    })
}

function addRepeatedAdCount(ad_id, tab_url=null){
    return new Promise((resolve) =>{
        repeatedEarly(ad_id).then(res => {
            if(!res){
                getUserID().then(user_id => {
                    addRepeatedAdToDB(ad_id)
                    fetchSecret(SERVER_ADDRESS + "repeatedAdCount", {
                        user_id, ad_id, tab_url
                    }).then(res => res.json()).then(res => {
                        console.log(res)
                    }).catch(err => console.log(err))
                })
            }
        })
    })
}

function addRepeatedAdToDB(ad_id){
    return new Promise((resolve) =>{

		var tx = db.transaction(["repeatedAds"], "readwrite");
		var objectStore = tx.objectStore("repeatedAds");
		var req = objectStore.put({ad: ad_id, timestamp: new Date().getTime()});

		req.onsuccess = function(e) {
			console.log(e)
		};
	})
}

function repeatedEarly(ad_id){
    return new Promise((resolve) =>{

        var tx = db.transaction(["repeatedAds"]);
        var objectStore = tx.objectStore("repeatedAds");
        var req = objectStore.get(ad_id)
    
        req.onsuccess = function(e){
            if(e.target.result){  //15 minutes
                resolve(new Date().getTime() - (15 * 1000 * 60) < e.target.result.timestamp)
            }else{
                resolve(false)
            }
        }
    })
}


function getUnsentAd(){
	return new Promise((resolve) =>{
        if(db === undefined){
            try{
                db = request.result
            }catch(_){
                setTimeout(() =>{
                    getUnsentAd().then(r => resolve(r))
                }, 500)
                return;
            }
        }
		var tx = db.transaction(["ads"], "readwrite");
		var objectStore = tx.objectStore("ads");
		var req = objectStore.openCursor();
		req.onsuccess = function(e) {
			var cursor = e.target.result;
			if(cursor){
				if(!cursor.value.received && (cursor.value.timestamp < new Date().getTime() - 30000)){
                    resolve(cursor.value)
				}else{
					cursor.continue()
				}
			}else{
                resolve(undefined)
            }
		};
	})
}

function getUnsentInterests(){
	return new Promise((resolve) =>{
        if(db === undefined){
            try{
                db = request.result
            }catch(_){
                setTimeout(() =>{
                    getUnsentInterests().then(r => resolve(r))
                }, 500)
                return;
            }
        }
		var tx = db.transaction(["interests"], "readwrite");
		var objectStore = tx.objectStore("interests");
		var req = objectStore.openCursor();

        var interests = []
		req.onsuccess = function(e) {
			var cursor = e.target.result;
			if(cursor){
				if(!cursor.value.received){
                    interests.push(cursor.value)
                    if(interests.length >= 200){
                        resolve(interests)
                    }
				}
                cursor.continue()
			}else{
                resolve(interests)
            }
		};
	})
}

function getUnsentDemo(){
	return new Promise((resolve) =>{
        if(db === undefined){
            try{
                db = request.result
            }catch(_){
                setTimeout(() =>{
                    getUnsentDemo().then(r => resolve(r))
                }, 500)
                return;
            }
        }
		var tx = db.transaction(["demographic_data"], "readwrite");
		var objectStore = tx.objectStore("demographic_data");
		var req = objectStore.openCursor();

        var demos = []
		req.onsuccess = function(e) {
			var cursor = e.target.result;
			if(cursor){
				if(!cursor.value.received){
                    demos.push(cursor.value)
				}
                cursor.continue()
			}else{
                resolve(demos)
            }
		};
	})
}

function getPostAdRate(){
	return new Promise((resolve) =>{
		if(!db){
			db = request.result;
		}
		var tx = db.transaction(["postAdRate"], "readwrite");
		var objectStore = tx.objectStore("postAdRate");
		var req = objectStore.openCursor();
        var adPostRate = {twitter: {posts: 0, ads: 0}, facebook: {posts: 0, ads: 0}, linkedin: {posts: 0, ads: 0}}
		req.onsuccess = function(e) {
			var cursor = e.target.result;
			if(cursor){
                adPostRate[cursor.value.platform]["posts"] = adPostRate[cursor.value.platform]["posts"] + cursor.value.totalPosts
                adPostRate[cursor.value.platform]["ads"] = adPostRate[cursor.value.platform]["ads"] + cursor.value.numberOfAds
                cursor.continue()
			}else{
                resolve(adPostRate)
            }
		};
	})
}

function putPostAdRate(ad){
    if(!db){
        try{
            db = request.result
        }catch(_){
            setTimeout(() =>{putPostAdRate(ad)}, 200)
            return
        }
    }
    var tx = db.transaction("postAdRate", "readwrite");
    var objectStore = tx.objectStore("postAdRate");
    var req = objectStore.put(ad);
    req.onsuccess = function(e) {
    }
    req.onerror = function(e) {
        
    }

}

function putHostnameTopics(hostnames){
    if(!db){
        try{db = request.result}catch(_){
            setTimeout(() =>{putHostnameTopics(hostnames)}, 200)
            return
        }
    }
    var tx = db.transaction("hostnameTopics", "readwrite");
    var objectStore = tx.objectStore("hostnameTopics");
    hostnames.forEach(hostname => {
        var req = objectStore.put(hostname);
        req.onsuccess = function(e) {}
        req.onerror = function(e) {}
    })
}

function getHostnameTopipcs(){
	return new Promise((resolve) =>{
		if(!db){
			db = request.result;
		}
        var tx = db.transaction(["hostnameTopics"]);
        var objectStore = tx.objectStore("hostnameTopics");
        var req = objectStore.getAll()
        req.onsuccess = function(e){
            resolve(e.target.result)
        }
	})
}

function getTopicsAndInsertAsInterests(){
	return new Promise((resolve) =>{
		if(!db){
			db = request.result;
		}
        var tx = db.transaction(["topics"]);
        var objectStore = tx.objectStore("topics");
        var req = objectStore.getAll()
        req.onsuccess = function(e){
            topics = e.target.result
            topics.sort((a, b) => b.count - a.count)
            topicsToAddToInterests = []
            topics.forEach((topic, i) => {
                if(i < 25){ // Top 25 general categories
                    topicsToAddToInterests.push({
                        interest_id: "browser-topic-" + topic.topic,
                        interest_name: topic.topic,
                        platform: "browser"
                    })
                }
            })
            saveBulkOfInterests(topicsToAddToInterests)
        }
	})
}

function getVisitsBeforeTime(url, time){
    return new Promise((resolve) =>{
        chrome.history.getVisits({"url": url}, function(info) {
            visitCount = 0
            for(visit of info){
                if(visit.visitTime > time) visitCount++
            }
            resolve(visitCount)
        })
    });
}

function getHostnamesVisited(){
    chrome.storage.local.get(['last_history_time'], function(result) {
        var time = (result.last_history_time) ? result.last_history_time : new Date().getTime() - (86400 * 1000 * 60)
        if(new Date().getTime() - time <  86400 * 1000 * 1){
            return;
        }
    
        chrome.history.search({text: '', maxResults: 100000000, startTime: time }, async function(data) {
            
            let hosts = {}
            for(page of data){
                var url = new URL(page.url)
                if(url.hostname.startsWith("www.")){
                    url = new URL(page.url.replace("www.", ""))
                }
                if(!(page.url.startsWith("https://m.facebook.com/") || page.url.startsWith("chrome-extension:") || page.url.startsWith("file://") || url.hostname === "")){
                    var visitCount = await getVisitsBeforeTime(page.url, time)
                    if(hosts[url.hostname] === undefined){
                            hosts[url.hostname] = visitCount
                    }else{
                        hosts[url.hostname] += visitCount
                    }
                }
            }

            let topics = {}
            let newTime = new Date().getTime()
            getHostnameTopipcs().then(hostnames => {
                hostToTopic = {}
                hostnames.forEach(hostname => {
                    hostToTopic[hostname.hostname] = hostname.topics
                })
                console.log(hostnames)
                let hostnamesToQuery = []
                Object.keys(hosts).forEach(host => {
                    if(hostToTopic[host] === undefined){
                        hostnamesToQuery.push(host)
                    }else{
                        hostToTopic[host].forEach(topic => {
                            if(topics[topic] === undefined){
                                topics[topic] = 0
                            }
                            topics[topic] += hosts[host]
                        })
                    }
                })
                console.log(hostnamesToQuery)
                if(hostnamesToQuery.length > 0){
                    // Query to server
                    getUserID().then(user_id =>{
                        fetchSecret(SERVER_ADDRESS + "getTopicsFromHostnames", {
                            user_id: user_id,
                            hostnames: hostnamesToQuery
                        }).then(res => res.json()).then(res => {
                            putHostnameTopics(res)
                            res.forEach(hostname => {
                                hostname.topics.forEach(topic => {
                                    if(topics[topic] === undefined){
                                        topics[topic] = 0
                                    }
                                    topics[topic] += hosts[hostname.hostname]
                                })
                            })
                            sendTopicsToServer(topics, newTime)
                        }).catch(err => console.log(err))
                    }).catch((err) => console.log(err)) 
                }else{
                    sendTopicsToServer(topics, newTime)
                }
            })
        });
    })
}

function sendTopicsToServer(topics, time){
    getUserID().then(user_id =>{
        fetchSecret(SERVER_ADDRESS + "topics", {
                user_id: user_id,
                topics: topics,
                time: time,
                rep: true
        }).then(res => res.json()).then(res => {
            if(res.received){
                chrome.storage.local.set({"last_history_time": time})
                putTopics(topics)
                getTopicsAndInsertAsInterests()
            }
        }).catch(err => console.log(err))
    }).catch((err) => console.log(err)) 
}

function putTopics(newTopics){
    return new Promise((resolve) => {
        if(db === undefined){
            try{
                db = request.result
            }catch(_){
                setTimeout(() =>{
                    putTopics(newTopics).then(r => resolve(r))
                }, 500)
                return;
            }
        }
        var tx = db.transaction("topics", "readwrite");
        var objectStore = tx.objectStore("topics");
        Object.keys(newTopics).forEach(topic => {
            var req= objectStore.openCursor(topic);
            req.onsuccess = function(e) {
                var cursor = e.target.result; 
                if (!cursor) {
                    objectStore.add({topic, count: newTopics[topic]})
                }else{
                    objectStore.put({topic, count: newTopics[topic] + cursor.value.count})
                }
            };
        })
        resolve(true)
    })
}

setInterval(() => {
    isUsageAllowed().then(allowed => {
        if(allowed){
            getHostnamesVisited()
        }
    })
}, 120000)

request.onupgradeneeded = function(event) {
    var db = event.target.result;
    var objectStore;
    if(event.oldVersion < 2){
        objectStore = db.createObjectStore("ads", { keyPath : "ad_id" });

        objectStore.createIndex("ad_id", "ad_id", { unique: true });
        objectStore.createIndex("author", "author", { unique: false });
        objectStore.createIndex("timestamp", "timestamp", { unique: false });
        objectStore.createIndex("platform", "platform", { unique: false });
        objectStore.createIndex("valoration", "valoration", { unique: false });
        objectStore.createIndex("landing_page", "landing_page", { unique: false });

        // This function is not really necessary for new users
        objectStore.transaction.oncomplete = function(second_event) {      
            chrome.storage.local.get(['reasons_google', 'reasons', 'reasons_tw', 'linkedin_reasons'], function(result) {

            if(result.reasons_tw === undefined && result.reasons_google === undefined && result.reasons === undefined && result.linkedin_reasons === undefined){
                console.log("New user")
                return;
            }
            
            var reasons_tw = new Map();
            if(result.reasons_tw !== undefined){
                reasons_tw = new Map(JSON.parse(result.reasons_tw));
            }

            var reasons_google = new Map();
            if(result.reasons_google !== undefined){
                reasons_google = new Map(JSON.parse(result.reasons_google));
            }

            var reasons = new Map();
            if(result.reasons !== undefined){
                reasons = new Map(JSON.parse(result.reasons));
            }

            var linkedin_reasons = new Map();
            if(result.linkedin_reasons !== undefined){
                linkedin_reasons = new Map(JSON.parse(result.linkedin_reasons));
            }

            
            var adsObjectStore = db.transaction("ads", "readwrite").objectStore("ads");

            for (let [key, value] of reasons.entries()){
                value.platform = "facebook"
                value.fb_ad_id = value.ad_id
                value.ad_id = "fb-" + key
                value.image = undefined
                adsObjectStore.add(value);
            }

            for (let value of reasons_tw.values()){
                value.platform = "twitter"
                value.ad_tw_id = value.ad_id
                value.ad_id = "tw-" + value.tweet_id
                adsObjectStore.add(value);
            }

            for (let value of linkedin_reasons.values()){
                value.platform = "linkedin"
                value.ad_id = "li-" + value.ad_id
                adsObjectStore.add(value);
            }
            
            var google_ads = []
            for (let value of reasons_google.values()){
                if(value.landing_page && !google_ads.includes(getGoogleIdByLandingPage(value.landing_page))){
                    value.platform = "google"
                    value.ad_id = getGoogleIdByLandingPage(value.landing_page)
                    google_ads.push(value.ad_id)
                    try {
                        value.author = value.landing_page.split("://")[1].split("/")[0].split(":")[0]
                    }catch{ err => 
                        value.author = value.landing_page
                    }
                    adsObjectStore.add(value);
                }
            }
            });
        }
    
        objectStore = db.createObjectStore("interests", { keyPath : "interest_id" });

        objectStore.createIndex("interest_id", "interest_id", { unique: true });
        objectStore.createIndex("interest_name", "interest_name", { unique: false });
        objectStore.createIndex("platform", "platform", { unique: false });
        objectStore.createIndex("valoration", "valoration", { unique: false });

        objectStore = db.createObjectStore("demographic_data", { keyPath : "demographic_id" });

        objectStore.createIndex("demographic_id", "demographic_id", { unique: true });
        objectStore.createIndex("demographic_name", "demographic_name", { unique: false });
        objectStore.createIndex("value", "value", { unique: false });
        objectStore.createIndex("platform", "platform", { unique: false });
        objectStore.createIndex("valoration", "valoration", { unique: false });
    }

    if(event.oldVersion < 5){
        objectStore = db.createObjectStore("key_info",{ keyPath : "key_name" });
    }

    if(event.oldVersion < 7){
        var request = event.target;
        var db = request.result;
        var txn = request.transaction;
        objectStore = txn.objectStore("ads")
        objectStore.createIndex("received_by_server", "received_by_server", { unique: false });
    }

    if(event.oldVersion < 8){
        objectStore = db.createObjectStore("googleAdImages",{ keyPath : "frame_url" });
    }

    if(event.oldVersion < 9){
        objectStore = db.createObjectStore("postAdRate",{ keyPath : "id" });
        objectStore.createIndex("platform", "platform", { unique: false });
    }

    if(event.oldVersion < 10){
        objectStore = db.createObjectStore("hostnameTopics",{ keyPath : "hostname" });
        objectStore = db.createObjectStore("topics",{ keyPath : "topic" });
    }

    if(event.oldVersion < 11){
        isUsageAllowed().then(allowed => {
            if(allowed){
                chrome.storage.local.set({"terms": false})
                chrome.storage.local.set({"termsUpdated": true})
            }
        })
    }
    if(event.oldVersion < 12){
        objectStore = db.deleteObjectStore("topics");
        objectStore = db.createObjectStore("topics",{ keyPath : "topic" });
        chrome.storage.local.remove("last_history_time")
    }

    if(event.oldVersion < 13){
        objectStore = db.createObjectStore("repeatedAds",{ keyPath : "ad" });
    }
};



// Crypto

function getSecretKey(){
    return new Promise((resolve) => {
        getSecretKeyRaw().then(secretKey => {
            const keyData = new Uint8Array(secretKey.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
            crypto.subtle.importKey('raw', keyData, { name: 'AES-CBC', length: 256 }, false, ['encrypt', 'decrypt']).then(r => resolve(r))
        })
    })
}

const keyDataRandom = crypto.getRandomValues(new Uint8Array(32));
const keyStringRandom = Array.from(keyDataRandom).map(b => ('00' + b.toString(16)).slice(-2)).join('');

function getSecretKeyRaw(){
    return new Promise((resolve) => {
        if(db === undefined){
            try{
                db = request.result
            }catch(_){
                setTimeout(() =>{getSecretKeyRaw().then(r => resolve(r))}, 100)
                return;
            }
        }
        var request = indexedDB.open("ads_db");

        var tx = db.transaction(["key_info"]);
        var objectStore = tx.objectStore("key_info");
        var req = objectStore.get("secret_key")
        
        req.onsuccess = function(e){
            if(req.result === undefined){
                getUserID().then(user => {
                    fetch(SERVER_ADDRESS + "registerKey", {
                        method: "POST", 
                        headers: {'Accept': 'application/json', 'Content-Type': 'application/json'},
                        body: JSON.stringify({user_id: user, key: keyStringRandom})
                    }).then(res => res.json()).then(res => {
                        var tx = db.transaction(["key_info"], "readwrite");
                        var objectStore = tx.objectStore("key_info");
                        var req = objectStore.add({"key_name": "secret_key", "secret_key": keyStringRandom})

                        req.oncomplete = function(e) {
                            resolve(keyStringRandom)
                        }
                    }).catch(err => { console.log(err) })
                })
            }else{
                resolve(req.result.secret_key)
            }
        }
    })
}

// This should have been a signature 
function fetchSecret(url, body){
    console.log("fetchSecret", url, body)
    return new Promise((resolve, reject) => {
        getSecretKey().then(secretKey => {
            const iv = crypto.getRandomValues(new Uint8Array(16));
            if(!body.timestamp){
                body.timestamp = (new Date()).getTime()
            }
            crypto.subtle.encrypt({ name: 'AES-CBC', iv }, secretKey, new TextEncoder().encode(JSON.stringify(body))).then(encryptedBody => {
                let enc  = new Uint8Array(encryptedBody); 
                let encrypted_body_hex = Array.prototype.map.call(enc, x => ('00' + x.toString(16)).slice(-2)).join('')
                let new_body = {
                    encrypted: true,
                    user_id: body.user_id,
                    iv,
                    encrypted_body: encrypted_body_hex
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

