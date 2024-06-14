function DOMCounter(){
    if(localStorage.getItem("id_eid"))
        var id_eid = new Map(JSON.parse(localStorage.getItem("id_eid")));
    else
        var id_eid = new Map();
  
      //now we analyse the intercepted ads
      var scripts_tags = document.getElementsByTagName('script');
      var ads_messages = []
      
  
      for(var i=0; i<scripts_tags.length; i++){
  
        if(scripts_tags[i].textContent.startsWith("var ytInitial")){
            var raw_json = scripts_tags[i].textContent.split("var ytInitialData = ")[1]
            if(raw_json === undefined){
                continue
            }
            raw_json = raw_json.slice(0, -1) // This removes a ";"
            var ytInitialData = JSON.parse(raw_json)

            try{

    
            var videos = ytInitialData.contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.richGridRenderer.contents

            videos.forEach(video => {
                if(video.richItemRenderer && video.richItemRenderer.content.displayAdRenderer){
                    var ad_raw_info = video.richItemRenderer.content.displayAdRenderer
                    var text = ad_raw_info.titleText.simpleText
                    var author = ad_raw_info.secondaryText.simpleText
                    var landing_page = ad_raw_info.clickCommand.urlEndpoint.url.split("&adurl=")[1].split("&")[0]

                    if(landing_page.includes("ds_dest_url%3D")){
                        console.log("compose url")
                        landing_page = landing_page.split("ds_dest_url%3D")[1]
                    }

                    landing_page = decodeURIComponent(landing_page)
                    if(landing_page.slice(-1) == "&"){
                        landing_page = landing_page.slice(0,-1)
                    }
                    
                    var thumbnails = ad_raw_info.image.thumbnail.thumbnails
                    var max_height = 0
                    var thumbnail_url

                    var about_this_ad 
                    var about_this_ad_array = ad_raw_info.menu.menuRenderer.items
                    about_this_ad_array.forEach(about_this => {
                        if(about_this.menuNavigationItemRenderer && about_this.menuNavigationItemRenderer.navigationEndpoint.openPopupAction){
                            about_this_ad = about_this.menuNavigationItemRenderer.navigationEndpoint.openPopupAction.popup.aboutThisAdRenderer.url.privateDoNotAccessOrElseTrustedResourceUrlWrappedValue
                        }

                    })

                    thumbnails.forEach(thumbnail =>{
                        if(thumbnail.height > max_height){
                            max_height = thumbnail.height
                            thumbnail_url = thumbnail.url
                        }
                    })
                    ads_messages.push({message: "youtube_ad", ad_id: "yt-" + landing_page.slice(0,200), explanation: about_this_ad, landing_page, text, author, thumbnail_url})
                }
            })

            }catch(err){}
        }

      }

      var intercepted_elements = document.getElementsByClassName("__interceptedAds");
      for(var i=0; i<intercepted_elements.length; i++){
        var ad = JSON.parse(intercepted_elements[i].innerText)
        ads_messages.push({message: "youtube_ad", ad_id: "yt-" + ad.landing_page.slice(0,200), explanation: ad.reasons_url, landing_page: ad.landing_page, text:null, author:null, thumbnail_url: ad.image})
      }

      ads_messages.forEach((message,i) => {
        setTimeout(()=>{
            console.log(message)
            chrome.runtime.sendMessage(message)
        }, i * 100)
      })
      if(ads_messages.length === 0){
          setTimeout(()=>{
              requestIdleCallback(DOMCounter)
          }, 100)
      }
  }

  requestIdleCallback(DOMCounter);
