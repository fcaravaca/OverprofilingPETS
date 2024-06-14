/* Injected SCRIPT */
/* Method that intercepts the connections done by FB and gets the information of AD_id and TOKEN for requesting the reasons */


/* This method checks if the DOM is ready and sends a message to get preferences */

let random_id = (Math.random() + "").split(".")[1]


function checkForDOM() {
  if (document.body && document.head && !document.querySelector('[data-testid="royal_login_button"]')) {
    chrome.runtime.sendMessage({message: "firstDOM"});
    localStorage.removeItem("id_eid")
  } else {
    requestIdleCallback(checkForDOM);
  }
}
requestIdleCallback(checkForDOM);

/* It checks whether the interception of connections has been activated or not */
function scrapeData() {
    var responseContainingEle = document.getElementsByClassName('__interceptedData');
    if (responseContainingEle) {
        //var response = JSON.parse(responseContainingEle.innerHTML);
    } else {
        requestIdleCallback(scrapeData);
    }
}
requestIdleCallback(scrapeData);

/* This method does the main processing by extracting the ids and tokens and sending them to be analysed */
function DOMCounter(){

  if(!document.querySelector('[data-testid="royal_login_button"]')){
    if(localStorage.getItem("id_eid"))
        var id_eid = new Map(JSON.parse(localStorage.getItem("id_eid")));
      else
        var id_eid = new Map();

    //there are some ads that do not depend on the connections and are preloaded in advance, we check it before
    var preloaded_ads = getElementsByXPath("//script[contains(., 'ad_id')]",document);

    var adids_preloaded = [];
    var tokens_preloaded = [];
    var urls_preloaded = [];
    for(var i=0; i<preloaded_ads.length; i++){

      ads_indexes = getMatchIndices(/"ad_id":/g,preloaded_ads[i].textContent);
      for(var l=0; l<ads_indexes.length; l++){
        var preloaded_ad = preloaded_ads[i].textContent.substring(ads_indexes[l]+9,preloaded_ads[i].textContent.length);
        preloaded_ad = preloaded_ad.substring(preloaded_ad,preloaded_ad.indexOf('"'));

        if(!adids_preloaded.includes(preloaded_ad))
          adids_preloaded.push(preloaded_ad);
      }
      token_indexes = getMatchIndices(/"client_token":/g,preloaded_ads[i].textContent);
      for(var l=0; l<token_indexes.length; l++){
        var preloaded_token = preloaded_ads[i].textContent.substring(token_indexes[l]+16,preloaded_ads[i].textContent.length);
        preloaded_token = preloaded_token.substring(preloaded_token,preloaded_token.indexOf('"'));

        if(!tokens_preloaded.includes(preloaded_token))
          tokens_preloaded.push(preloaded_token);
      }
      url_indexes = getMatchIndices(/"target_url":/g,preloaded_ads[i].textContent);
      for(var l=0; l<url_indexes.length; l++){
        var url_preloaded = preloaded_ads[i].textContent.substring(url_indexes[l]+14,preloaded_ads[i].textContent.length);
        url_preloaded = url_preloaded.substring(url_preloaded,url_preloaded.indexOf('"'));
        url_preloaded = url_preloaded.replaceAll("\\","")

        if(!urls_preloaded.includes(url_preloaded))
        urls_preloaded.push(url_preloaded);
      }
      if(url_indexes.length === 0){
        url_indexes = getMatchIndices(/"ExternalWebLink"/g,preloaded_ads[i].textContent);
        for(var l=0; l<url_indexes.length; l++){
          var url_preloaded = preloaded_ads[i].textContent.substring(url_indexes[l]+25,preloaded_ads[i].textContent.length);
          url_preloaded = url_preloaded.substring(url_preloaded,url_preloaded.indexOf('"'));
          url_preloaded = url_preloaded.replaceAll("\\","")
  
          if(!urls_preloaded.includes(url_preloaded))
          urls_preloaded.push(url_preloaded);
        }
      }



      while(urls_preloaded.length < adids_preloaded.length){
        urls_preloaded.push(null)
      }
    }

    for(var i=0; i<adids_preloaded.length; i++){
      if(!id_eid.has(adids_preloaded[i])){
        id_eid.set(adids_preloaded[i],tokens_preloaded[i]);
        //in case the ad is new we send it to be analysed
        getWAST(tokens_preloaded[i], adids_preloaded[i], null, urls_preloaded[i]);
      }
    }
    //now we analyse the intercepted ads
    var ads = document.getElementsByClassName('__interceptedData');
    for(var i=0; i<ads.length; i++){
      ad = ads[i].querySelector('[id="intercepted_data"]');
      ad = JSON.parse(ad.textContent);
      if(!id_eid.has(ad.ad_id)){
        id_eid.set(ad.ad_id,ad.client_token);
        //in case the ad is new we send it to be analysed
        getWAST(ad.client_token, ad.ad_id, ad.media_url, ad.landing_page, ad.text);
      }
    }
    //we store everything inside the session storage of the FB tab in order to be able to know if an ad has been already analysed
    localStorage.setItem("id_eid", JSON.stringify([...id_eid]));
  }
  requestIdleCallback(DOMCounter);
}
requestIdleCallback(DOMCounter);

/* This function sends a message to the background which is going to open a tab with the reasons url */
function getWAST(client_token, id, media_url=null, landing_page=null, text=null){
  try{

      client_token = client_token.replace(/\\/g, '\\\\')
      client_token = client_token.replaceAll(/"/g,'\\"')

	    chrome.runtime.sendMessage({message: "getWAST", ad_id: id, 
                                  url_request: 'https://m.facebook.com/nt/screen/?params={"client_token":"'+client_token+'","ad_id":"'+ id.split('"')[0] + '"}&path=/ads/waist&_rdr&locale=en_US',
                                  media_url, landing_page, text
                                });
	    //chrome.runtime.sendMessage({message: "getWAST", ad_id: id, url_request: 'https://m.facebook.com/waist_content/dialog/?client_token=' + encodeURIComponent(client_token) + '&id=' + id.split('"')[0]});
  }catch(error_getWast_contentScript){console.log("Error error_getWast_contentScript")}
}

/* Complementary function */
function getElementsByXPath(xpath, parent)
{
    let results = [];
    let query = document.evaluate(xpath, parent || document,
        null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    for (let i = 0, length = query.snapshotLength; i < length; ++i) {
        results.push(query.snapshotItem(i));
    }
    return results;
}

/* Function to get all de indices for a specific string */
function getMatchIndices(regex, str){
  var result = [];
  var match;
  regex = new RegExp(regex);
  while (match = regex.exec(str)) result.push(match.index);


  return result;
}


function containsNumber(str) {
  return /\d/.test(str);
}


let posts_texts = {}
let posts_with_ads = 0 
function countAdPostRate(){

  var xpath_sentence = '//div[@role="article"]'
  var posts = getElementsByXPath(xpath_sentence)

  let adImages = []

  let ads = document.getElementsByClassName('__interceptedData');
  for(var i=0; i<ads.length; i++){
    ad = ads[i].querySelector('[id="intercepted_data"]');
    ad = JSON.parse(ad.textContent);
    if(ad.media_url){
      adImages.push(ad.media_url.split("?")[0])
    }
  }

  for(var post of posts){
    if(post.type === "ad"){
      continue
    }

    let post_type = "post"
    let images = getElementsByXPath(".//img", post)
    for(let image of images){
      if(!image.src){
        continue
      }
      if(adImages.includes(image.src.split("?")[0])){
        post_type = "ad"
        if(post.type === undefined){
          console.log("AD", post)
          try{
            var links = post.getElementsByTagName("a")
            var urls = []
            for(var link of links){
              var href = link.href
              console.log(link, href)
              urls.push(href)
            }
            post.addEventListener("click", (e) => {
              console.log(e.currentTarget.info)
              chrome.runtime.sendMessage({message: "fb_ad_click", links: e.currentTarget.info})
            })
            post.info = urls
            post.type = "ad"
            posts_texts[post.textContent] = "ad"


          }catch(err){console.log(err)}
        }
        break
      }
    }

    if(post_type === "post"){
      posts_texts[post.textContent] = "post"
    }
    
  }
  let totalPosts = Object.values(posts_texts).length
  let numberOfAds = Object.values(posts_texts).reduce((value, current) => value + (current === "ad" ? 1 : 0), 0)

  console.log(adImages)
  console.log(totalPosts, numberOfAds)

  if(numberOfAds  === 0){
    posts_with_ads = totalPosts
  }

  console.log(totalPosts - posts_with_ads, numberOfAds)


  if(numberOfAds > 0){
    chrome.runtime.sendMessage({message: "ad_post_rate", totalPosts: totalPosts - posts_with_ads, numberOfAds: numberOfAds, id:random_id, platform: "facebook"})
  }
  
}

setInterval(() => {
  countAdPostRate()
}, 5000)




function clickSideFeedsAd(){

  var sideFeedAds = getElementsByXPath('//*[@aria-label="Advertiser"]')


  for(var sideAd of sideFeedAds){
    if(!sideAd.info){

      sideAd.addEventListener("click", function (e) {
        chrome.runtime.sendMessage({message: "fb_ad_click", links: e.currentTarget.info})
      })
      var url = sideAd.getAttribute("href")
      try{
        url = url.split("/l.php?u=")[1]
        url = decodeURIComponent(url)
      }catch(_){}
      sideAd.info = [url] // Array because fb_ad_click checks for arrays instead of unique urls
    }
  }
  setTimeout(() => {
    clickSideFeedsAd()
  }, 4000)
}

setTimeout(() => {
  clickSideFeedsAd()
}, 1000)