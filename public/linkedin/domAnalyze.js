function getElementByXpath(path) {
    return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

let random_id = (Math.random() + "").split(".")[1]

var ads_id = []
var posts_ads_id = []
var posts_information = {}

function collectAdImageWithActivityID(activity_id){
    var div_element = getElementByXpath('//div[@data-id="urn:li:activity:' + activity_id + '"]')
    return collectAdImage(div_element)

}

function collectPostTextWithActivityID(activity_id){
    var html_element = getElementByXpath('//div[@data-id="urn:li:activity:' + activity_id + '"]')
    try{
        var text_element = html_element.getElementsByClassName("feed-shared-text relative feed-shared-update-v2__commentary ")[0]
        return text_element.innerText
    }catch(_){
        return undefined
    }
}

function collectAdImage(html_element){
    // This is avideo
    var video_thumbnail = html_element.getElementsByClassName("video-s-loader__thumbnail")
    if(video_thumbnail.length > 0){
        console.log(video_thumbnail[0].getAttribute("src"))
        return video_thumbnail[0].getAttribute("src")
    }

    video_thumbnail = html_element.getElementsByClassName("vjs-poster-background")
    if(video_thumbnail.length > 0){
        var url = video_thumbnail[0].style["background-image"].split('"')[1]
        return url
    }

    var img_elements = html_element.getElementsByTagName("img")

    for(var i = img_elements.length - 1; i >= 0; i --){
        var img_element = img_elements[i]
        var src = img_element.getAttribute("src")
        if(!img_element.classList.contains("feed-shared-actor__avatar-image") && !img_element.classList.contains("reactions-icon") && src && !src.includes("profile-displayphoto-shrink")){
            return src
        }        
    }

    return null
}

function DOMCounter(){
    console.log("Linkedin DOMCounter")

    var intercepted_elements = document.getElementsByClassName("__interceptedAds");
    for(var i = 0; i < intercepted_elements.length; i++){
    
        if(intercepted_elements[i].innerText.includes("sponsoredCreative")){
            var json_value = JSON.parse(intercepted_elements[i].innerText)

            try{
                var activity_id
                var sponsored_id
                json_value.forEach(element => {

                    if(element["*saveAction"]){
                        activity_id = element["*saveAction"].split("li:activity:")[1].split(")")[0] // "*saveAction":"urn:li:fs_saveAction:(SAVE,urn:li:activity:6936951374395969537)",
                    }
                    if(element["*saveState"]){
                        activity_id = element["*saveState"].split("li:activity:")[1].split(")")[0] // Same thing, this should be the new version but maybe the one above then is used again
                    }
                    if(element["targetUrn"] && element["targetUrn"].includes("urn:li:sponsoredCreative:")){
                        sponsored_id= element["targetUrn"].split("urn:li:sponsoredCreative:")[1]
                    }
                })
                if(!ads_id.includes(sponsored_id)){
                    ads_id.push(sponsored_id)
                    posts_ads_id.push(activity_id)
                    try{
                        var post_element = getElementByXpath('//div[@data-id="urn:li:activity:' + activity_id + '"]')
                        if(!post_element.info){
                            post_element.addEventListener("click", function (e) {
                                chrome.runtime.sendMessage({message: "linkedin_ad_click", ad_id: e.currentTarget.info})
                            })
                            post_element.info = sponsored_id
                        }
                    }catch(err){
                        console.log(err)
                    }

                    var landing_page = posts_information[activity_id]
                    var image_url = collectAdImageWithActivityID(activity_id)
                    var text = collectPostTextWithActivityID(activity_id)
                    if(!image_url){ // Image preview
                        try{
                            image_url = post_element.getElementsByClassName("vjs-poster")[0].style["background-image"].split('"')[1]
                        }catch{}
                    }
                    if(!image_url){
                        try{
                            image_url = post_element.getElementsByClassName("vjs-poster-background")[0].style["background-image"].split('"')[1]
                        }catch{}
                    }
                    chrome.runtime.sendMessage({message: "linkedin_ad", ad_id: sponsored_id, image: image_url, landing_page, text})

                    console.log("linkedin ad", activity_id, sponsored_id, image_url, landing_page, text)
                }

            }catch(err){(err) => console.log(err)}
        }
    }

    var code_elements = document.getElementsByTagName("code");
    for(var i = 0; i < code_elements.length; i++){
        try{
            if(code_elements[i].innerText.includes("sponsoredCreative")){
                var json_value = JSON.parse(code_elements[i].innerText)
                if(json_value["included"]){
                    for(var value of json_value["included"]){
                        if(value["dashEntityUrn"] && value["dashEntityUrn"].includes("activity") && value["dashEntityUrn"].includes("sponsoredCreative")){
                            
                            activity_id = value["dashEntityUrn"].split("li:activity:")[1].split(",")[0]
                            sponsored_id= value["dashEntityUrn"].split("urn:li:sponsoredCreative:")[1].split(")")[0]
                            if(!ads_id.includes(sponsored_id)){
                                ads_id.push(sponsored_id)
                                posts_ads_id.push(activity_id)

                                var image_url = collectAdImageWithActivityID(activity_id)
                                var text = collectPostTextWithActivityID(activity_id)

                                chrome.runtime.sendMessage({message: "linkedin_ad", ad_id: sponsored_id, image: image_url, landing_page: undefined, text:text})
                                
                                var div_element = getElementByXpath('//div[@data-id="urn:li:activity:' + activity_id + '"]')
                                div_element.addEventListener("click", function (e) {
                                    chrome.runtime.sendMessage({message: "linkedin_ad_click", ad_id: e.currentTarget.info})
                                })
                                div_element.info = sponsored_id
                                var post_dropdown_dum = div_element.getElementsByClassName("feed-shared-control-menu__content artdeco-dropdown__content")[0]
                                post_dropdown_dum.setAttribute("already_analyzed",'true')
                            }
                        }
                    }
                }
            }
        }catch(err){console.log(err)}
    }
    // Ad banner (in the right side of the page)
    var ad_banner_iframe = document.getElementsByClassName("ad-banner")[0]
 
    if(ad_banner_iframe){

        const iWindow = ad_banner_iframe.contentWindow;
        const iDocument = iWindow.document;

        try{
            var only_one_ad = iDocument.getElementById("ads-container")
            var only_one_ad_id = only_one_ad.getAttribute("data-creative").split("sponsoredCreative:")[1]
            if(!ads_id.includes(only_one_ad_id)){
                ads_id.push(only_one_ad_id)
                
                var ad_images = only_one_ad.getElementsByTagName("img")
                var ad_image = null 
                for(var i = 0; i < ad_images.length; i++){

                    var classes = ad_images[i].classList
                    var profile = false
                    for(var j = 0; j < classes.length; j++){
                        if(classes[j].includes("profile-image")){
                            profile = true
                        }
                    }
                    var landing_page = undefined
                    var landing_page_element = only_one_ad.getElementsByTagName("a")

                    for(let i = 0; i < landing_page_element.length; i ++){
                        prov_landing = landing_page_element[i].getAttribute("href")
                        if(prov_landing !== undefined && prov_landing !== "" && !prov_landing.includes("linkedin.com/help/linkedin/answer/")){
                            landing_page = prov_landing
                            break
                        }
                    }

                    if(!profile){
                        ad_image = ad_images[i].getAttribute("src")
                        break
                    }
                }

                chrome.runtime.sendMessage({message: "linkedin_ad", ad_id: only_one_ad_id, image: ad_image, landing_page})

                only_one_ad.addEventListener("click", function (e) {
                    chrome.runtime.sendMessage({message: "linkedin_ad_click", ad_id: e.currentTarget.info})
                })
                only_one_ad.info = only_one_ad_id
            }

        }catch(e){}

        var img_xpath = '//section[@class="ta-creative"][%i%]//img'
        var landing_page_xpath = '//section[@class="ta-creative"][%i%]//a'
        
        try{
            xpath_sentence = '//section[@class="ta-creative"][%i%]/div'
            index = 1
            ad = iDocument.evaluate(xpath_sentence.replace("%i%", index), iDocument, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            ad_section = iDocument.evaluate('//section[@class="ta-creative"][%i%]'.replace("%i%", index), iDocument, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

            while(ad !== null){
                if(ad.getAttribute("data-creative")){
                    var ad_id = ad.getAttribute("data-creative").split("sponsoredCreative:")[1]
        
                    if(!ads_id.includes(ad_id)){
                        ads_id.push(ad_id)
                        var image = null
                        try{
                            image = iDocument.evaluate(img_xpath.replace("%i%", index), iDocument, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                            image = image.getAttribute("src")
                            console.log(image)
                        }catch{}
                        var landing_page = undefined
                        try{
                            landing_page = iDocument.evaluate(landing_page_xpath.replace("%i%", index), iDocument, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                            landing_page = landing_page.getAttribute("href")
                            console.log(landing_page)
                        }catch{}
                        console.log(landing_page)
                        chrome.runtime.sendMessage({message: "linkedin_ad", ad_id: ad_id, image: image, landing_page})

                        try{
                            ad_section.addEventListener("click", function (e) {
                                chrome.runtime.sendMessage({message: "linkedin_ad_click", ad_id: e.currentTarget.info})
                            })
                            ad_section.info = ad_id
                        }catch(_){}
                    }
                }
                index++;
                ad = iDocument.evaluate(xpath_sentence.replace("%i%", index), iDocument, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                ad_section = iDocument.evaluate('//section[@class="ta-creative"][%i%]'.replace("%i%", index), iDocument, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

            }
        }catch(e){}
    }


    // Obtains all posts, click a button to trigger a HTTP query, from there obtain the ad id. The info will appear using __interceptedAds 
    var posts_xpath = "(//div[@data-id])[%i%]"
    try{
        index = 1
        var post = getElementByXpath(posts_xpath.replace("%i%", index))
        while(post !== null){
            var post_dropdown = post.getElementsByClassName("feed-shared-control-menu__content artdeco-dropdown__content")[0]
            var post_dropdown_button = post.getElementsByClassName("feed-shared-control-menu__trigger")[0]
            if(post_dropdown !== undefined && post_dropdown.getAttribute("already_analyzed") !== "true"){
                
                var landing_page = null
                try{ // Selecting app-aware link would select other links which are not the landing page
                    var landing_page_element = post.getElementsByClassName("app-aware-link feed-shared-article__image-link tap-target")
                    if(landing_page_element.length === 0){
                        landing_page_element = post.getElementsByClassName("app-aware-link feed-shared-creative__link")
                    }
                    if(landing_page_element.length === 0){
                        landing_page_element = post.getElementsByClassName("app-aware-link feed-shared-event__banner-link")
                    }
                    if(landing_page_element.length === 0){
                        landing_page_element = post.getElementsByClassName("app-aware-link feed-shared-image__image-link")
                    }
                    if(landing_page_element.length === 0){
                        landing_page_element = post.getElementsByClassName("app-aware-link feed-shared-linkedin-video__description-link")
                    }


                    if(landing_page_element.length > 0){
                        console.log(landing_page_element)
                        landing_page = landing_page_element[0].getAttribute("href")
                        
                        if(landing_page.includes(".linkedin.com/leadGenForm/urn:li:fs_leadGenF")){
                            landing_page = undefined
                        }
                    }
                }catch(err){
                    console.log(err)
                }
                
                
                posts_information[post.getAttribute("data-id").split("urn:li:activity:")[1]] = landing_page
                post_dropdown.setAttribute("style",'display:none')
                post_dropdown.setAttribute("already_analyzed",'true')
                post_dropdown_button.click()
                post_dropdown_button.click()
                
                
            }else{
                if(post_dropdown !== undefined && post_dropdown.getAttribute("style") === 'display:none'){ //This will only trigger the sencond time the post has existed in the HTML
                    // This will allow the dropdown to be visible to the user            
                    post_dropdown.setAttribute("style", null) 
                    // This will hide the dropdown (see that the class with artdeco-dropdown__content--is-close)
                    post_dropdown.setAttribute("class","feed-shared-control-menu__content artdeco-dropdown__content artdeco-dropdown__content--is-close artdeco-dropdown--is-dropdown-element artdeco-dropdown__content--has-arrow artdeco-dropdown__content--arrow-right artdeco-dropdown__content--justification-right artdeco-dropdown__content--placement-bottom ember-view")
                }
            }
            index++
            post = getElementByXpath(posts_xpath.replace("%i%", index))
        }
    }catch(e){}
    
    if(Object.keys(posts_information).length > 0){
        chrome.runtime.sendMessage({message: "ad_post_rate", totalPosts: Object.keys(posts_information).length, numberOfAds: posts_ads_id.length, id:random_id, platform: "linkedin"})
      }
    setTimeout(function(){
        requestIdleCallback(DOMCounter);
    }, 1500)
}

setTimeout(function(){
    requestIdleCallback(DOMCounter);
}, 3000)
