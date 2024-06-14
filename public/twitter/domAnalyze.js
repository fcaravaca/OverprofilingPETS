localStorage.removeItem("id_eid")

let random_id = (Math.random() + "").split(".")[1]
let og_dim = {height: window.innerHeight, width: window.innerWidth}

function DOMCounter(){
  console.log("dom count")
  if(localStorage.getItem("id_eid"))
      var id_eid = new Map(JSON.parse(localStorage.getItem("id_eid")));
  else
      var id_eid = new Map();

    //now we analyse the intercepted ads
    var ads = document.getElementsByClassName('__interceptedData');
    var tweets = document.getElementsByClassName('__interceptedTweets');
    var ads_messages = []
    var tweets_set

    for(var i=0; i<ads.length; i++){

      adid = ads[i].querySelector('[id="intercepted_adid"]');
      adid = adid.textContent;

      var tweet_id = ads[i].querySelector('[id="intercepted_tweet_id"]');
      tweet_id = tweet_id.textContent;

      if(id_eid.has(tweet_id)){
        continue;
      }

      var tweet_info = null
      //console.log("tweets:", tweets)
      for(var j=0; j<tweets.length; j++){
        tweets_set = JSON.parse(tweets[j].innerText)
        if(tweets_set[tweet_id] !== undefined){
          tweet_info = tweets_set[tweet_id]
          break
        }
      }

      var image_url = ads[i].querySelector('[id="intercepted_image_info"]').textContent;
      console.log("Image URL", image_url)

      ads_messages.push({message: "twitter_ad", ad_id: adid, tweet_id: tweet_id, tweet_info: tweet_info, image_url})
    }
    if(ads_messages.length > 0){
      console.log("ads:", ads_messages)
    }

    fireChromeMessages(ads_messages, 0)
}
requestIdleCallback(DOMCounter);

// It seems that it's better to have delay a bit the messages, that's why it waits 100ms for every message 
function fireChromeMessages(messages, i){
  if(i >= messages.length){
    setTimeout(() => {
      requestIdleCallback(DOMCounter)
    }, 3000)
    return;
  }

  if(localStorage.getItem("id_eid"))
    var id_eid = new Map(JSON.parse(localStorage.getItem("id_eid")));
  else
    var id_eid = new Map();

  if(id_eid.get(messages[i].tweet_id) !== undefined){
    fireChromeMessages(messages,i+1) // this ad id is already collected
  }else{
    id_eid.set(messages[i].tweet_id,messages[i].ad_id)
    localStorage.setItem("id_eid", JSON.stringify([...id_eid]));
    setTimeout(() => {
      console.log("Sending tweet with ids", messages[i].ad_id, messages[i].tweet_id)
  
      chrome.runtime.sendMessage(messages[i], (r) =>{
        var lastError = chrome.runtime.lastError;
        if (lastError) {
          console.log(lastError.message);
          return
        }
        
        console.log(r)
        fireChromeMessages(messages,i+1)
      })
    }, 100)


  }



}

function DOMCounterInterests(){
  
  var interests = document.getElementsByClassName('__interceptedInterests');

  if(interests.length > 0){
      chrome.runtime.sendMessage({message: "twitter_interests", interests: JSON.parse(interests[0].innerText)})
    return;
  }

  requestIdleCallback(DOMCounterInterests);
}

requestIdleCallback(DOMCounterInterests);

setTimeout(() => {
  setTweetListener()
}, 1000)

function setTweetListener(){
  var tweets = getElementsByXPath('//article[.//*[contains(@d,"M20.75 2H3.25C2.007 2 1 3.007 1 4.25v15.5C1 20.993 2.007 22 3.25")]]').concat(getElementsByXPath('//article[.//*[contains(@d,"M19.498 3h-15c-1.381 0-2.5 1.12-2.5 2.5v13c0 1.38")]]'))

  for(var tweet of tweets){
    var textContent = tweet.textContent
    if(!tweet.info){
      tweet.addEventListener("click", function (e) {
        chrome.runtime.sendMessage({message: "twitter_ad_click", textContent: e.currentTarget.info})
      })
      tweet.info = textContent
    }
  }

  setTimeout(() => {
    setTweetListener()
  }, 3000)
}

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


let tweetsTransform = []
let numberOfAds = 0
function getProportionOfAdsTweet(){

  var tweets_elements = getElementsByXPath('//*[@data-testid="cellInnerDiv"]')

  let height = window.innerHeight
  let width = window.innerWidth

  if(height === og_dim.height && width === og_dim.width && !window.location.href.includes("status")){ 
    for(var tweet of tweets_elements){
      try{
        var style = tweet.getAttribute("style")
        style = style.split("transform: ")[1].split(";")[0]
        if(tweetsTransform.indexOf(style) === -1){
          tweetsTransform.push(style)
          var isAd = getElementsByXPath('.//*[contains(@d,"M20.75 2H3.25C2.007 2 1 3.007 1 4.25v15.5C1 20.993 2.007 22 3.25")]', tweet).concat(
            getElementsByXPath('.//*[contains(@d,"M19.498 3h-15c-1.381 0-2.5 1.12-2.5 2.5v13c0 1.38")]', tweet)
          )
          if(isAd.length > 0){
            numberOfAds++
          }
        }
      }catch(_){}
    }
    if(numberOfAds > 0){
      chrome.runtime.sendMessage({message: "ad_post_rate", totalPosts: tweetsTransform.length, numberOfAds, id:random_id, platform: "twitter"})
    }
  }

  setTimeout(() => {
    getProportionOfAdsTweet()
  }, 550)
}

requestIdleCallback(getProportionOfAdsTweet)