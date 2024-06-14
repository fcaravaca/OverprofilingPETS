setTimeout(function(){
console.log("inject.js")
// This reads requests and inserts HTML elements in the website to then read in the domAnalyze/contentScripts/content_alternative files
  var XHR = XMLHttpRequest.prototype;
  var send = XHR.send;
  var open = XHR.open;
  XHR.open = function(method, url) {
      this.url = url; // the request url
      return open.apply(this, arguments);
  }
  try{
    XHR.send = function() {
        var sendReturn = true
        this.addEventListener('load', function() {
          if (this.url.includes('api/graphql') && !this.url.includes("twitter.com")) {
            if(this.response.type != "application/vnd.linkedin.normalized+json+2.1" && this.response && this.response.indexOf('ad_id') != -1){
                console.log("Loading something", this.url)
                var newString = this.response.slice()
                try{
                  newString = "[" + newString.replace(new RegExp("[\r\n]", "gm"), ",").replaceAll(",,", ",") + "]"

                  array_of_objects = JSON.parse(newString)
                  array_of_objects.forEach(object =>{
                    if(JSON.stringify(object).includes("ad_id")){

                      if(object.label !== undefined){
                        console.log("Label found")
                        if(object.data.category === "SPONSORED"){
                          console.log(object.data.node)
                          var ad_id = object.data.node.sponsored_data.ad_id
                          var client_token = object.data.node.sponsored_data.client_token.replace("@", "\\u0040")
                          var media = object.data.node.comet_sections.content.story.attachments[0].styles.attachment.media
                          var text = object.data.node.comet_sections.content.story.comet_sections.message.story.message.text
                          console.log(getURIFromMediaObject(media), text, getFBLandingPageBruteForce(object.data.node))
                          
                          injectFBContentInHTML(ad_id, client_token, getURIFromMediaObject(media), getFBLandingPageBruteForce(object.data.node), text)
                        }else{
                          console.log("But not sponsored")
                        }
                      }else{
                        console.log("Label not found")
                        if(object.data.viewer.sideFeed){
                          console.log("Side feeds")
                          object.data.viewer.sideFeed.nodes.forEach(node => {
                            if(node.ads){

                              node.ads.nodes.forEach(ad =>{
        
                                var media = ad.rhc_ad.attachments[0].all_subattachments.nodes.length > 0 ? ad.rhc_ad.attachments[0].all_subattachments.nodes[0].media : null
                                var landing = getFBLandingPageBruteForce(ad)
                                var image = getURIFromMediaObject(media)
                                if(!landing){
                                  try{
                                    landing = ad.rhc_ad.target_url
                                  }catch(_){}
                                }
                                if(!image && ad.rhc_ad.image){
                                  try{
                                    image = ad.rhc_ad.image.uri
                                  }catch(_){}
                                }
                                console.log(image, landing, ad.rhc_ad.title)
                  
                                injectFBContentInHTML(ad.sponsored_data.ad_id, ad.sponsored_data.client_token.replace("@", "\\u0040"), image , landing, ad.rhc_ad.title)
                              })

                            }
                          })

                        }

                        if(object.data.viewer.news_feed){
                          console.log("news feed")
                          object.data.viewer.news_feed.edges.forEach(edge => {
                            var media = edge.node.comet_sections.content.story.attachments[0].styles.attachment.media
                            var text = edge.node.comet_sections.content.story.comet_sections.message.story.message.text
                            console.log(getURIFromMediaObject(media), text, getFBLandingPageBruteForce(edge))

                            injectFBContentInHTML(edge.node.sponsored_data.ad_id, edge.node.sponsored_data.client_token.replace("@", "\\u0040"),getURIFromMediaObject(media),getFBLandingPageBruteForce(edge), text)
                          })
                        }

                      }
                    }
                  })
                }catch(err){
                  console.log(err)
                }
              }
            }
          if (this.url.includes('twitter.com/i/api/2/timeline')) {
            timeline = JSON.parse(this.response).timeline.instructions

            for(var i = 0; i < timeline.length; i++){
              console.log(timeline[i].addEntries)
              if(timeline[i].addEntries === undefined){
                continue;
              }
              var entries = timeline[i].addEntries.entries
              console.log(entries)
              console.log("Entries", entries)
              for(var j = 0; j < entries.length; j++){
                if(entries[j].entryId && entries[j].entryId.includes("promotedTweet")){
                  var tweet_id = entries[j].content.item.content.tweet.id
                  var promotedMetadata = entries[j].content.item.content.tweet.promotedMetadata
                  console.log("Found AD with tweet id:", tweet_id)
                  injectTWAd(promotedMetadata.impressionId, tweet_id)
                }
              }
            }
          }
          if (this.url.includes('twitter.com') && (this.url.includes('HomeTimeline') || this.url.includes("api/graphql/"))) {
            var instructions = JSON.parse(this.response).data.home
            if(instructions !== undefined){
              console.log("Found Twitter Instructions:", instructions)

              instructions = instructions.home_timeline_urt.instructions
              for(var i = 0; i < instructions.length; i ++){
                var entries = instructions[i].entries
                if(entries === undefined){
                  continue;
                }
                for(var j = 0; j < entries.length; j++){
                  function search2(title, index){
                    if(entries[j].entryId.includes(title)){
                      var tweet_id = entries[j].entryId.split("-")[index]
                      var promotedMetadata = entries[j].content.itemContent.promotedMetadata
                      var image_info = null
                      console.log("Entries", entries[j].content.itemContent.tweet_results)
                      try{
                        var card = undefined
                        card = entries[j].content.itemContent.tweet_results.result.card
                        if(card === undefined)
                          card = entries[j].content.itemContent.tweet_results.result.tweet.card
                        console.log("Card", card)
                        if(card === undefined){
                          image_info = entries[j].content.itemContent.tweet_results.result.tweet.legacy.entities.media[0].media_url_https
                        }
              
                        card = card.legacy.binding_values[0].value.string_value
                        card = JSON.parse(card)
                        if(card.media_entities){
                          Object.values(card.media_entities).forEach(o => {
                            image_info = o.media_url_https
                          })
                        }
                      }catch{}
                      console.log("Found AD with tweet id:", tweet_id)
                      injectTWAd(promotedMetadata.impressionId, tweet_id, image_info)
                    }
                  }
                  search2("promotedTweet", 1)
                  search2("promoted-tweet", 2)
                }
                
              }
            }
          }
          if (this.url.includes('twitter.com') && this.url.includes('include_profile_interstitial_type')) {
            var object = JSON.parse(this.response).globalObjects
            if(object !== undefined && object.tweets !== undefined){
              var dataDOMElement = document.createElement('div');
              if(dataDOMElement !== undefined){
                
                dataDOMElement.className = '__interceptedTweets';
                var tweets = document.createElement('div');
                tweets.textContent = JSON.stringify(object.tweets)
                
                dataDOMElement.style.height = 0;
                dataDOMElement.style.overflow = 'hidden';
                dataDOMElement.appendChild(tweets);
                
                document.body.appendChild(dataDOMElement);
              }
            }
          }

          if (this.url.includes('twitter.com') && this.url.includes('twitter_interests.json')) {
            var object = JSON.parse(this.response)
            if(object !== undefined && object.interested_in !== undefined){

              
              var dataDOMElement = document.createElement('div');
              dataDOMElement.className = '__interceptedInterests';
              var interests = document.createElement('div');
              interests.textContent = JSON.stringify(object)
              
              dataDOMElement.style.height = 0;
              dataDOMElement.style.overflow = 'hidden';
              dataDOMElement.appendChild(interests);
              
              document.body.appendChild(dataDOMElement);
            }
          }

          if(this.url.includes('/voyager/api/voyagerFeedUpdateActions') || this.url.includes('/voyager/api/voyagerFeedDashUpdateActions')){
            try{
              sendReturn = false
              console.log(this.url)
              this.response.text().then(r => {
                console.log(r)
                var object = JSON.parse(r)
                if(object !== undefined && object.data !== undefined && r.includes("AD_CHOICE")){
                  
                  
                  var dataDOMElement = document.createElement('div');
                  dataDOMElement.className = '__interceptedAds';

                  dataDOMElement.textContent = JSON.stringify(object.data.actions)
                  
                  dataDOMElement.style.height = 0;
                  dataDOMElement.style.overflow = 'hidden';
                  
                  document.body.appendChild(dataDOMElement);

                }
              
              }).catch((err) => console.log(err))
              
            }catch(err){console.log(err)}
              
          }

          if(this.url.includes('youtube') && this.url.includes('ad_break')){
            try{
              console.log(this.url)
              var object = JSON.parse(this.response)
              console.log(object)
              if(object !== undefined && object.playerAds !== undefined){
                
                

                  object.playerAds.forEach(playerAd =>{
                    try{
                    console.log(playerAd.adPlacementRenderer.renderer)
                    var image
                    image = playerAd.adPlacementRenderer.renderer.invideoOverlayAdRenderer.contentSupportedRenderer.imageOverlayAdContentRenderer.image.thumbnail.thumbnails[0].url
                    console.log(image)
                  

                    reasons_url = playerAd.adPlacementRenderer.renderer.invideoOverlayAdRenderer.adInfoRenderer.adHoverTextButtonRenderer.button.buttonRenderer.serviceEndpoint.openPopupAction.popup.aboutThisAdRenderer.url.privateDoNotAccessOrElseTrustedResourceUrlWrappedValue
                    console.log(reasons_url)
                    var dataDOMElement = document.createElement('div');

                    landing_page = playerAd.adPlacementRenderer.renderer.invideoOverlayAdRenderer.contentSupportedRenderer.imageOverlayAdContentRenderer.navigationEndpoint.urlEndpoint.url
                    console.log(landing_page)

                    dataDOMElement.className = '__interceptedAds';
                    dataDOMElement.textContent = JSON.stringify({image, reasons_url, landing_page})
                    dataDOMElement.style.height = 0;
                    dataDOMElement.style.overflow = 'hidden';
                    
                    document.body.appendChild(dataDOMElement);
                  }catch(err){console.log(err)}
                  })


                
              }
              
              
            }catch(err){console.log(err)}
          }
            
        });
        if(sendReturn){
          return send.apply(this, arguments);
        }
    };
  }catch(e){console.log("error incerceptadata")}
},0);

function injectTWAd(impressionId, tweet_id, image_info=null){
  if(!image_info){
    console.log("No image info")
  }
  console.log("Injecting Tw Ad", impressionId, tweet_id, image_info)
  // Why timeout this? We need to inject the tweet info before the tw ad is loaded by the twitter/domAnalyze.js
  setTimeout(function(){
    var dataDOMElement = document.createElement('div');
    dataDOMElement.className = '__interceptedData';

    var div_ad = document.createElement('div');
    var div_tweet_id = document.createElement('div');
    var div_image_info = document.createElement('div');

    div_ad.id = 'intercepted_adid';
    div_tweet_id.id = 'intercepted_tweet_id';
    div_image_info.id = 'intercepted_image_info';

    div_ad.textContent = impressionId;
    div_tweet_id.textContent = tweet_id;
    div_image_info.textContent = image_info;

    dataDOMElement.style.height = 0;
    dataDOMElement.style.overflow = 'hidden';

    dataDOMElement.appendChild(div_ad);
    dataDOMElement.appendChild(div_tweet_id);
    dataDOMElement.appendChild(div_image_info);

    document.body.appendChild(dataDOMElement);
  
  }, 5000)
}

function injectFBContentInHTML(ad_id, client_token, media_url, landing_page, text){
  
  const objectToInject = {ad_id, client_token, media_url, landing_page, text}
  console.log("Trying to inject", objectToInject)
  var dataDOMElement = document.createElement('div');
  dataDOMElement.className = '__interceptedData';

  div_ad = document.createElement('div');

  div_ad.id = 'intercepted_data';

  div_ad.textContent = JSON.stringify(objectToInject);

  dataDOMElement.style.height = 0;
  dataDOMElement.style.overflow = 'hidden';

  dataDOMElement.appendChild(div_ad);

  document.body.appendChild(dataDOMElement);
}


function getURIFromMediaObject(media){

  if(!media){
    return null
  }
  let uri
  if(media.flexible_height_share_image){
    uri = media.flexible_height_share_image.uri
  }else if(media.card_image){
    uri = media.card_image.uri
  }else if(media.image){
    uri = media.image.uri
  }else if(media.thumbnailImage){
    uri = media.thumbnailImage.uri
  }

  return uri
}

function getFBLandingPageBruteForce(object){
  var stringify_object = JSON.stringify(object)

  if(stringify_object.indexOf('ExternalWebLink","url":"') !== -1){
    var url = stringify_object.split('ExternalWebLink","url":"')[1]
    url = url.split('"')[0]
    return decodeURIComponent(url)
  }else{
    return null
  }
}