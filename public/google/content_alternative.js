//Global Variables
var FRAME_SIZE = undefined; // Is undefined when we are at the main window
var NESTED_IFRAME = undefined; // true if nested iFrame with same size exists
var RETRY = 0;
var MIN_SIZE_FOR_IMAGES = { height: 40, width: 40 }; // tracking pixel max size
var MIN_SIZE_FOR_IFRAMES = { height: 20, width: 20 }; // tracking iFrame max size
var CURRENT_URL = '';
var TOP_URL = '';
var EXPLANATION_URL='';
var IFRAME_DATASET = undefined;

/*
/***************************/
/*Section Main function*/
/***************************/

//Main Function
requestIdleCallback(startThePlugin_alternative)

function startThePlugin_alternative() {
  var isInIFrame = (window.self != window.top);
  if(!isInIFrame){
    setTimeout(function () { test_iframe_datection(); }, 3000); //10000 my decision
  }else{
    FRAME_SIZE = { width:-1, height:-1 };
    setTimeout(function () { iframeCollection(); }, 3000); //10000
  }
  setTimeout(function () { startThePlugin_alternative(); }, 4000)
}

var test_iframe_datection = function (){
  //Identify the current URL
  CURRENT_URL = document.URL;

  if(CURRENT_URL!=undefined &&CURRENT_URL!=null && !CURRENT_URL.includes('linkedin') && !CURRENT_URL.includes('facebook.') && !CURRENT_URL.includes('twitter.')&& !CURRENT_URL.includes('chrome-extension://') && !CURRENT_URL.includes('https://verea.networks.imdea.org')){
  //Identify links
  var iframes = document.getElementsByTagName("iframe")
  for (counter_iframe_main_window=0;counter_iframe_main_window<iframes.length;counter_iframe_main_window++){
      if(iframes[counter_iframe_main_window].contentDocument!=null){
        links=iframes[counter_iframe_main_window].contentDocument.getElementsByTagName("a")
        NUMER_LINKS=links.length;
        /*Variables that we are going to send to the DB*/
        var explanation_main= ""
        var landing_page= ""
        var src_ad= ""
        //

        for (counter_links=0;counter_links<NUMER_LINKS;counter_links++){
          try{
            href_link=links[counter_links].href
            //Getting the explanation if exists
            if(href_link.startsWith("https://adssettings.google.com/whythisad") | href_link.startsWith("http://adssettings.google.com/whythisad")){
              explanation_main=href_link
            }
          }catch{}
        }

        for (counter_links=0;counter_links<NUMER_LINKS;counter_links++){
          try{
              href_link=links[counter_links].href

              result_ad=get_landing_page_links(href_link)
              if(result_ad!=="no_result" && result_ad!=="" && result_ad!=="#" && !result_ad.startsWith("https://&") && !result_ad.startsWith("http://&")){
                CURRENT_URL = new URL(CURRENT_URL);
                CURRENT_URL = CURRENT_URL.origin
                ad_found=true;
                src_ad=href_link;
                landing_page=result_ad
                record={}
                record["explanation"]=explanation_main;
                record["ad_found"]=true;
                record["type_ad"]="main_window";
                try{
                  record["landing_page"]=decodeURIComponent(landing_page.replace("%26dclid=%edclid!", ""));
                }catch(_){
                  record["landing_page"]= (landing_page);
                }
                record["src_ad"]=src_ad;
                record["current_url"]=CURRENT_URL;
                record["html"] = iframes[counter_iframe_main_window].contentDocument.getElementsByTagName("html")[0].outerHTML //Only access the iframe html, not the document html
                record["image"] = getImageFromDocument(iframes[counter_iframe_main_window].contentDocument.getElementsByTagName("html")[0])
                if(!record["image"]){
                  record["image_base64_url"] = getDataURLFromCanvas(iframes[counter_iframe_main_window].contentDocument.getElementsByTagName("html")[0])
                }
                console.log(record)
                setTimeout(() => {
                  chrome.runtime.sendMessage({message: 'resultsAds', ads: record });
                }, 1000)

                iframes[counter_iframe_main_window].contentDocument.getElementsByTagName("html")[0].addEventListener("click", function (e) {
                  chrome.runtime.sendMessage({message: 'google_ad_click', landing_page: record["landing_page"] });
                }, true)

                break
              }
          }catch(error_getting_explanation){
            console.log("Error getting explanation iframe ",error_getting_explanation)
          }
        }
          //if(record["ad_found"]==true){
          //  chrome.runtime.sendMessage({type: 'resultsAds', ads: record });
          //}
        }
      }
    }
  
}
var iframeCollection = function () {

  CURRENT_URL = document.URL;
  if(!CURRENT_URL.includes('facebook.') && !CURRENT_URL.includes('chrome-extension://') && !CURRENT_URL.includes('https://verea.networks.imdea.org')){
  CURRENT_BASE_DOMAIN=base_domain_extractor(CURRENT_URL)
  //First, Is the size of the Iframe Correct?
  var dim = getIFrameDimensions();
  if(dim.height==0 || dim.width ==0){
    dim["height"]=document.body.clientHeight;
    dim["width"]=document.body.clientWidth;
  }
  if (dim.height > MIN_SIZE_FOR_IFRAMES.height && dim.width > MIN_SIZE_FOR_IFRAMES.width) {
    iframe_host=window.location.hostname
    if(iframe_host.startsWith("www.")){
      iframe_host=iframe_host.substr(4,iframe_host.length-1)
    }
    base_domain=base_domain_extractor(iframe_host)
    
    if (adDomains.indexOf(iframe_host) >= 0 || adBlockSureThing.indexOf(iframe_host) >= 0 || adBlockSureThing.indexOf(base_domain) >= 0 || adBlockSureThing.indexOf(base_domain) >= 0) {
      explanation=undefined;
      ad_found=false;
      type_ad=undefined;
      landing_page=undefined;
      src_ad=undefined;
      html = undefined;
      image = undefined
      image_base64_url = undefined
      //-----------------------------------//
      var links_iframes = document.getElementsByTagName('a');

      if (links_iframes.length == 0 || links_iframes==undefined) {
          links_iframes = document.getElementsByTagName('a');
      }

      //Get the explanation in the case of Google
      for(i=0;i<links_iframes.length;i++){
        var href_link = links_iframes[i].href;
        try{
          ////////////////////////ADSETTINGS//////////////////////
          if(href_link.startsWith("https://adssettings.google.com/whythisad") | href_link.startsWith("http://adssettings.google.com/whythisad")){
            explanation=href_link
            console.log(explanation, document)
          }
        }catch(error_getting_explanation){console.log("Error getting explanation iframe ",error_getting_explanation)}
        try{
          if((href_link!=undefined) && (landing_page==undefined)) {
            result_ad=get_landing_page_links(href_link)
            if(result_ad!=="no_result" && result_ad!=="" && result_ad!=="#"){
              ad_found=true;
              type_ad="a_link";
              landing_page=result_ad;
              src_ad=href_link;
              html=document.getElementsByTagName("html")[0].outerHTML;
              image = getImageFromDocument(document.getElementsByTagName("html")[0])
              if(!image){
                image_base64_url = getDataURLFromCanvas(document.getElementsByTagName("html")[0])
              }
              }
          }
        }catch(error_getting_href_link){console.log("Error gettin href link  ",error_getting_href_link)}

        try{
          var data_a4a_orig_href_link = links_iframes[i]["data-a4a-orig-href"];
          if((data_a4a_orig_href_link!=undefined) && (landing_page==undefined)) {
            result_ad=get_landing_page_links(data_a4a_orig_href_link)
            if(result_ad!=="no_result" && result_ad!=="" && result_ad!=="#"){
              ad_found=true;
              type_ad="a_link_data_a4a_orig_href";
              landing_page=result_ad;
              src_ad=data_a4a_orig_href_link;
              }
          }
        }catch(error_getting_data_a4a_orig_href_link){console.log("Error gettin data-a4a-orig-href link line  ",error_getting_data_a4a_orig_href_link)}

        try{
          if(landing_page==undefined && (ad_found==false || ad_found==undefined)){
            var final_url = links_iframes[i]["data-u2-final-url"];
            if(final_url!=undefined){
              result_ad=get_landing_page_links(final_url)
              if(result_ad!=="no_result" && result_ad!=="" && result_ad!=="#"){
                if(landing_page==undefined){
                  ad_found=true;
                  type_ad="data-u2-final-url";
                  landing_page=result_ad;
                  src_ad=href_link;
                }
              }
            }
          }
        }catch(e){console.log("Error gettint data-u2-final-url",e)}
      }

      if(!ad_found){
        try{
          innerHtml = document.documentElement.innerHTML
          if(innerHtml.indexOf(";url=") !== -1){
            landing_page = innerHtml.split(";url=")[1].split("&amp")[0].split('"')[0]
          }else if(innerHtml.indexOf("destinationUrl") !== -1){
            landing_page = innerHtml.split("destinationUrl")[1].split("'")[1]
          }else{
            landing_page = getLandingPageByClickTag(document)
          }

          if(landing_page.indexOf("://ad.doubleclick.net") !== -1 ){
            console.log(landing_page)
            landing_page = get_landing_page_links(landing_page)
          }

          if(landing_page !== "" && landing_page !== undefined && landing_page.length > 5 && landing_page !== "no result" && landing_page.indexOf(".") !== -1){
            ad_found = true;
            html = document.getElementsByTagName("html")[0].outerHTML; //The document is only the iFrame (ad), not the real website
            image = getImageFromDocument(document.getElementsByTagName("html")[0])
            if(!image){
              image_base64_url = getDataURLFromCanvas(document.getElementsByTagName("html")[0])
            }
            type_ad = "destinationUrlAd"
          }else{
            landing_page = undefined
          }
        }catch(e){console.log("Error getting destinationUrl", e)}
      }

      if(ad_found){
        if(explanation==undefined){
          explanation=identify_explanation_scripts()
        }
      }
      //Verify if the ad was found()
      /*---Identify landing page in the script and noscript element---*/
      if(landing_page==undefined){
        result_script_analysis=identify_ads_scripts()
          if (result_script_analysis!=null){
            if(ad_found==false || ad_found==undefined){
              ad_found=true;
              type_ad=result_script_analysis["type"];
              landing_page=result_script_analysis["landing_page"];
              src_ad=result_script_analysis["link"];
              }
          }
      }
        //SEND RESULTS//
        console.log("Ad found:", ad_found, document)
          if(ad_found==true){
              CURRENT_URL = new URL(CURRENT_URL);
              CURRENT_URL = CURRENT_URL.origin
              record={}
              record["explanation"]=explanation;
              record["ad_found"]=ad_found;
              record["type_ad"]=type_ad;
              try{
                record["landing_page"]=decodeURIComponent(landing_page.replace("%26dclid=%edclid!", ""));
              }catch(_){
                record["landing_page"]= (landing_page);
              }
              record["src_ad"]=src_ad;
              record["current_url"]=CURRENT_URL;
              record["html"]=html
              record["image"]=image
              record["image_base64_url"] = image_base64_url

              document.addEventListener("click", function (e) {
                chrome.runtime.sendMessage({message: 'google_ad_click', landing_page: record["landing_page"] });
              }, true)

              var frames = document.getElementsByTagName("iframe")
              var frame_url 
              for(frame of frames){
                var width = frame.getAttribute("width") || frame.width

                if(width){
                  width = parseInt(width)
                }else{
                  width = 0
                }

                if(width > 40 && frame.getAttribute("src")){
                  frame_url = frame.getAttribute("src")
                  break
                }
              }
              record["frame_url"] = frame_url
              setTimeout(() => {
                chrome.runtime.sendMessage({message: 'resultsAds', ads: record });

              }, 1000)
          }else{
            image = getImageFromDocument(document.getElementsByTagName("html")[0])
            if(!image){
              image_base64_url = getDataURLFromCanvas(document.getElementsByTagName("html")[0])
            }
            console.log({href: document.location.href, image, image_base64_url})
            if(image && image.indexOf("http") === -1 && image.indexOf("www") === -1){
              if(document.location.href.charAt(document.location.href.length - 1) === "/"){
                image = document.location.href + image
              }else{
                image = document.location.href.split("/").slice(0,-1).reduce((all, i) => all + "/" + i) + "/" + image
              }
            }

            if(image || image_base64_url){
              chrome.runtime.sendMessage({message: "googleAdImage", data: {frame_url: document.location.href, image, image_base64_url}})
            } 
              
          }
        }
      }
    }
}

var identify_ads_gwd= function(){
  var result_ad={}
  try{
    var gwd_elements = document.getElementsByTagName("gwd-taparea")
    if(gwd_elements.length){
      var gwd_elements = document.getElementsByTagName("gwd-taparea")
    }
    for (index_gwd=0;index_gwd<gwd_elements.length;index_gwd++){
      gwd_element=gwd_elements[index_gwd]
      url_gwd=gwd_element.url
      if(url_gwd!=undefined){
        result_ad=get_landing_page_links(url_gwd)
        if(result_ad!="no_result"){
          result_ad["landing_page"]=result_ad
          result_ad["link"]=url_gwd
          result_ad["type"]="gwd"
          break
          }
      }
      src_gwd=gwd_element.src
      if(src_gwd!=undefined){
        result_ad=get_landing_page_links(src_gwd)
        if(result_ad!="no_result"){
          result_ad["landing_page"]=result_ad
          result_ad["link"]=src_gwd
          result_ad["type"]="gwd"
          break
          }
      }
      href_gwd=gwd_element.href
      if(href_gwd!=undefined){
        result_ad=get_landing_page_links(href_gwd)
        if(result_ad!="no_result"){
          result_ad["landing_page"]=result_ad
          result_ad["link"]=href_gwd
          result_ad["type"]="gwd"
          break
          }
      }

    }
  }catch(e){console.log("Error gettin ad in gwd elements")}
  return null
}

function identify_ads_meta(){
  rg_ex_comments= /\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*|(<!--[\s\S]*?-->)$/gm //detect comments only /**/ and <-- -->not for // comments
  var result_ad_return={}
  ad_found_meta = false
  try{
    var meta_iframes=document.getElementsByTagName('meta');
    if (meta_iframes.length == 0) {
       meta_iframes = document.getElementsByTagName('meta');
    }
    for (meta_index=0;meta_index<meta_iframes.length;meta_index++){
      try{
        meta_content=$(meta_iframes[meta_index]).attr('content')
        if(meta_content!=undefined){
          splitter=meta_content.split(",")
          for (index_splitter=0;index_splitter<splitter.length;index_splitter++){
              link_meta=splitter[index_splitter]
              try{
                if(link_meta!=null && link_meta!="" && link_meta!=undefined){
                    link_meta=link_meta.replace(/\&quot;/g,"").replace(/\&quot/g,"")
                    landing_page_meta=get_landing_page_links(link_meta)
                    base_domain_landing_page=base_domain_extractor(landing_page_script)

                    base_domain=base_domain_extractor(splitter_comilla_simples[index_url_removed_comilla_simples])
                    valid_base_domain=base_domain_extractor(landing_page_script)
                    if(landing_page_meta!="no_result" && ad_found_meta==false &&(adDomains.indexOf(base_domain_landing_page) < 0) && (not_valid_landing_pages.indexOf(base_domain_landing_page)<0) && (adBlockSureThing.indexOf(base_domain_landing_page)<0)  && base_domain_landing_page!="" && base_domain_landing_page!="no_result" ){
                    //if(result_ad!="no_result"){
                        result_ad_return["landing_page"]=landing_page_meta
                        result_ad_return["link"]=link_meta
                        result_ad_return["type"]="meta"
                        ad_found_meta=true
                        return result_ad_return

                      }else if( ad_found_meta==false && base_domain!=CURRENT_BASE_DOMAIN && valid_base_domain &&(adDomains.indexOf(base_domain) < 0)  && (adBlockSureThing.indexOf(base_domain)<0) && base_domain!="" && base_domain!="no_result") {
                        result_ad["landing_page"]=link_meta
                        result_ad["link"]=link_meta
                        result_ad["type"]="meta"
                        ad_found_noscript=true
                      }
                }
              }catch(error_meta_interno){console.log("Error interno meta ",error_meta_interno)}
            }
          }
      }catch(e){continue;}
    }
    return null
  }catch(e){console.log("Error getting ad in META element")}
}

function identify_ads_scripts(){
  rg_ex_comments= /\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*|(<!--[\s\S]*?-->)$/gm //detect comments only /**/ and <-- -->not for // comments
  var result_ad={}

      var script_iframes = document.getElementsByTagName('script');
      if (script_iframes.length == 0) {
          script_iframes = document.getElementsByTagName('script');
      }
      ad_found_noscript=false
      ad_found_script=false
      for (script_index=0;script_index<script_iframes.length;script_index++){
        try{
          var htmlObject_script= script_iframes[script_index].textContent;
          htmlObject_script=htmlObject_script.replace(rg_ex_comments, '');
          urls_within_script=url_extactor(htmlObject_script)
          if(urls_within_script!=null){
            for (index_url=0;index_url<urls_within_script.length;index_url++){
              try{
                splitter_comilla=urls_within_script[index_url].split("\"")//.split("\"")
                for (index_url_removed_comilla=0;index_url_removed_comilla<splitter_comilla.length;index_url_removed_comilla++){
                  if(splitter_comilla[index_url_removed_comilla]!=undefined){
                    splitter_comilla_simples=splitter_comilla[index_url_removed_comilla].split("\'")//.split("\"")
                    for (index_url_removed_comilla_simples=0;index_url_removed_comilla_simples<splitter_comilla_simples.length;index_url_removed_comilla_simples++){
                          landing_page_script=get_landing_page_links(splitter_comilla_simples[index_url_removed_comilla_simples])
                          base_domain=base_domain_extractor(splitter_comilla_simples[index_url_removed_comilla_simples])
                          valid_base_domain=validate_base_domains(base_domain)
                          base_domain_landing_page=base_domain_extractor(landing_page_script)
                          if(landing_page_script!="no_result" && ad_found_noscript==false &&(adDomains.indexOf(base_domain_landing_page) < 0) && (not_valid_landing_pages.indexOf(base_domain_landing_page)<0) && (adBlockSureThing.indexOf(base_domain_landing_page)<0)  && base_domain_landing_page!="" && base_domain_landing_page!="no_result" ){
                            result_ad["landing_page"]=landing_page_script
                            result_ad["link"]=splitter_comilla_simples[index_url_removed_comilla_simples]
                            result_ad["type"]="script"
                            ad_found_noscript=true
                        }else if( ad_found_noscript==false && base_domain!=CURRENT_BASE_DOMAIN && valid_base_domain &&(adDomains.indexOf(base_domain) < 0)  && (adBlockSureThing.indexOf(base_domain)<0) && base_domain!="" && base_domain!="no_result") {
                            result_ad["landing_page"]=splitter_comilla[index_url_removed_comilla]
                            result_ad["link"]=splitter_comilla[index_url_removed_comilla]
                            result_ad["type"]="script"
                            ad_found_noscript=true
                          }
                        }
                    }
                  }//anyadir catc
              }catch(e_interno_script){
                console.log("Error interno SCRIPT a la hora de analizar la URL")
                console.log("Reason  ? ",e_interno_script)
              }
            }
            if(ad_found_script){
              return result_ad
            }
          }
        }catch(e){
            console.log("Error getting script ",e)
          }
      }//End script analysis

      /*
      var noscript_iframes = document.getElementsByTagName('noscript');
      if (noscript_iframes.length == 0) {
         noscript_iframes = document.getElementsByTagName('noscript');
      }
      ad_found_noscript=false
      for (noscript_index=0;noscript_index<noscript_iframes.length;noscript_index++){
        try{
          var htmlObject_script= noscript_iframes[noscript_index].textContent;
          htmlObject_script=htmlObject_script.replace(rg_ex_comments, '');
          urls_within_script=url_extactor(htmlObject_script)
          if(urls_within_script!=null){
            for (index_url=0;index_url<urls_within_script.length;index_url++){
              try{
              splitter_comilla=urls_within_script[index_url].split("\"")//.split("\"")
              for (index_url_removed_comilla=0;index_url_removed_comilla<splitter_comilla.length;index_url_removed_comilla++){
                if(splitter_comilla[index_url_removed_comilla]!=undefined){
                    splitter_comilla_simples=splitter_comilla[index_url_removed_comilla].split("\'")//.split("\"")
                    for (index_url_removed_comilla_simples=0;index_url_removed_comilla_simples<splitter_comilla_simples.length;index_url_removed_comilla_simples++){
                          landing_page_script=get_landing_page_links(splitter_comilla_simples[index_url_removed_comilla_simples])
                          base_domain=base_domain_extractor(splitter_comilla_simples[index_url_removed_comilla_simples])
                          valid_base_domain=validate_base_domains(base_domain)
                          base_domain_landing_page=base_domain_extractor(landing_page_script)
                          if(landing_page_script!="no_result" && ad_found_noscript==false &&(adDomains.indexOf(base_domain_landing_page) < 0) && (not_valid_landing_pages.indexOf(base_domain_landing_page)<0) && (adBlockSureThing.indexOf(base_domain_landing_page)<0)  && base_domain_landing_page!="" && base_domain_landing_page!="no_result" ){

                            result_ad["landing_page"]=landing_page_script
                            result_ad["link"]=splitter_comilla_simples[index_url_removed_comilla_simples]
                            result_ad["type"]="noscript"
                            ad_found_noscript=true
                        }else if( ad_found_noscript==false && base_domain!=CURRENT_BASE_DOMAIN && valid_base_domain &&(adDomains.indexOf(base_domain) < 0)  && (adBlockSureThing.indexOf(base_domain)<0) && base_domain!="" && base_domain!="no_result") {
                            result_ad["landing_page"]=splitter_comilla[index_url_removed_comilla]
                            result_ad["link"]=splitter_comilla[index_url_removed_comilla]
                            result_ad["type"]="noscript"
                            ad_found_noscript=true
                        }
                      }
                    }
                }//FOR
                if(ad_found_noscript){
                  return result_ad
                }
              }catch(e_interno_noscript){
                console.log("Error NOSCRIPT: ",e_interno_noscript)
              }

            }//FOR
          }//IF
        }catch(e){console.log("Error getting script ",e)}//END NOSCRIPT
      }
      */

return null
}

function identify_explanation_scripts(){
      rg_ex_comments= /\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*|(<!--[\s\S]*?-->)$/gm //detect comments only /**/ and <-- -->not for // comments
      var EXPLANATION_TO_RETURN=undefined
      var EXPLANATION_FOUND=false
      var noscript_iframes = document.getElementsByTagName('noscript');
      if (noscript_iframes.length == 0) {
         noscript_iframes = document.getElementsByTagName('noscript');
      }
      for (noscript_index=0;noscript_index<noscript_iframes.length;noscript_index++){
        try{
          var htmlObject_script= noscript_iframes[noscript_index].textContent;
          htmlObject_script=htmlObject_script.replace(rg_ex_comments, '$1');
          urls_within_script=url_extactor_addsettings(htmlObject_script)
          if(urls_within_script!=null){
            for (index_url=0;index_url<urls_within_script.length;index_url++){
              splitter_comilla=urls_within_script[index_url].split("\"")
              for (index_url_removed_comilla=0;index_url_removed_comilla<splitter_comilla.length;index_url_removed_comilla++){
                if(splitter_comilla[index_url_removed_comilla]!=undefined){
                  if((splitter_comilla[index_url_removed_comilla].startsWith("https://adssettings.google.com/whythisad")) |(splitter_comilla[index_url_removed_comilla].startsWith("http://adssettings.google.com/whythisad")) ) {
                    EXPLANATION_FOUND=true
                    return splitter_comilla[index_url_removed_comilla]
                    break
                  }
                }
              }
            }

          }
        }catch(e){console.log("Error getting script ",e)}
      }//END NOSCRIPT
      if(EXPLANATION_FOUND==false){
        var script_iframes = document.getElementsByTagName('script');
        if (script_iframes.length == 0) {
           script_iframes = document.getElementsByTagName('script');
        }
        for (script_index=0;script_index<script_iframes.length;script_index++){
          try{
          var htmlObject_script= script_iframes[script_index].textContent;
          htmlObject_script=htmlObject_script.replace(rg_ex_comments, '$1');
          urls_within_script=url_extactor_addsettings(htmlObject_script)
          if(urls_within_script!=null){
            for (index_url=0;index_url<urls_within_script.length;index_url++){
              splitter_comilla=urls_within_script[index_url].split("\"")//.split("\"")
              for (index_url_removed_comilla=0;index_url_removed_comilla<splitter_comilla.length;index_url_removed_comilla++){
                if(splitter_comilla[index_url_removed_comilla]!=undefined){
                  if((splitter_comilla[index_url_removed_comilla].startsWith("https://adssettings.google.com/whythisad")) |(splitter_comilla[index_url_removed_comilla].startsWith("http://adssettings.google.com/whythisad")) ) {
                    EXPLANATION_FOUND=true
                    return splitter_comilla[index_url_removed_comilla]
                    break
                  }
                }
              }
            }
          }
        }catch(e){
            console.log("Error getting explanation in script ",e)
          }
      }
  }
return undefined
}

/**************************************/
/*Section Auxiliar functions */
/**************************************/

//Function to get the base domain of a FQDN
function base_domain_extractor(fqdn){
  //if starts with http:// or https://
  if(fqdn==null){return "no_result";}
  if(fqdn.startsWith("http://")){
    fqdn=fqdn.substr(7, fqdn.length-1)
  }else if(fqdn.startsWith("https://")){
    fqdn=fqdn.substr(8, fqdn.length-1)
  }
  fqdn=fqdn.split("/")
  fqdn=fqdn[0]
  var number_elements=fqdn.split(".")
  if(number_elements.length<2){
    return "no_result"
  }else if(number_elements.length==2){
    return fqdn
  }else{
    if(number_elements[number_elements.length-2].match(/^(com|edu|gov|net|ac|mil|org|nom|co|name|info|biz)$/i)){
      return number_elements[number_elements.length-3]+"."+number_elements[number_elements.length-2]+"."+number_elements[number_elements.length-1]
    }
    return number_elements[number_elements.length-2]+"."+number_elements[number_elements.length-1]
  }
}

function get_landing_page_links(link_href){
    link_href=link_href.replace(/\%3D/g,"=")
    link_href=link_href.replace(/\%25/g,"%")
    link_href=link_href.replace(/\%3A/g,":")
    link_href=link_href.replace(/\%2F\%2F/g,"//")
    link_href=link_href.replace(/\%3F/g,"?")
    link_href=link_href.replace(/&amp;redirect=/g,"adurl=")

    var reges = ["adurl=", "&mt_lp=", "clk=", "ex-src="];
    for(reg_ex of reges){
      link_split_1=link_href.split(reg_ex)
      if(link_split_1.length>1){
        for (i=0; i<link_split_1.length;i++){
            sub_link=link_split_1[i]
            sub_link_http=sub_link.split("http://")
            sub_link_https=sub_link.split("https://")
            //Check all http elements embedded in the link
            for(j=0; j<sub_link_http.length;j++){
              possible_landing_page=base_domain_extractor(sub_link_http[j])
              if( (adDomains.indexOf(possible_landing_page) < 0) && (adBlockSureThing.indexOf(possible_landing_page)<0) && possible_landing_page!="" && possible_landing_page!="no_result"  ){
                  return sub_link_http[j]
              }
            }
            for(j=0; j<sub_link_https.length;j++){
              possible_landing_page=base_domain_extractor(sub_link_https[j])
              if( (adDomains.indexOf(possible_landing_page) < 0) && (adBlockSureThing.indexOf(possible_landing_page)<0) && possible_landing_page!="" && possible_landing_page!="no_result" ) {
                  return sub_link_https[j]
              }
            }
        }
      }
    } 
    return "no_result"
}

function url_extactor(text){
  var urlRegex = /(https?:\/\/[^\s]+)/g;
  var m;
  var final=[]

  m = urlRegex.exec(text);
  if(m!=null){
  for (index_value=0;index_value<m.length;index_value++){
      final.push(m[index_value])
    }
  }
  return final
}
function url_extactor_addsettings(text){
  var urlRegex = /(https?:\/\/adssettings.google.com\/whythisad[^\s]+)/g;
  var m;
  var final=[]

  m = urlRegex.exec(text);
  if(m!=null){
  for (index_value=0;index_value<m.length;index_value++){
      final.push(m[index_value])
    }
  }
  return final
}
//FROM THE OLD VERSION
//Function to extract iFrame dimensions
var getIFrameDimensions = function () {
  var dim = { width: -1, height: -1 };
  var w = window;
  var d = document;
  var e = d.documentElement;
  var g = d.getElementsByTagName('body')[0];
  dim.width = w.innerWidth || e.clientWidth || g.clientWidth;
  dim.height = w.innerHeight || e.clientHeight || g.clientHeight;
  return dim;
};
//Detect the size of the nested iframes
var detectSameSizeIFrame = function () {
  var iFrames = document.getElementsByTagName('iframe');
  if (iFrames.length > 0){
    for (var i = 0; i < iFrames.length; i++) {
      var h = iFrames[i].clientHeight;
      var w = iFrames[i].clientWidth;
      // Check if we have same size iFrame
      if (FRAME_SIZE.height == h && FRAME_SIZE.width == w) {
        return true;
      }
    }
  }
  return false;
};

function validate_base_domains(base_domain){
  try{
    var re = new RegExp("^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+","i")
    var match = re.test(base_domain);
    return match
  }catch(e){
    console.log("Error base domains RegExpr ",e)
    return "no_result"
  }
}


function getImageFromDocument(doc){
  if(doc === undefined){
    return undefined
  }

  var images = doc.getElementsByTagName("img")

  for(var i = 0; i < images.length; i++){
    var image = images[i]
    var alt = image.getAttribute("alt") 
    var width = image.getAttribute("width") || image.width

    if(width){
      width = parseInt(width)
    }else{
      width = 0
    }
    
    var height = image.getAttribute("height") || image.height
    if(height){
      height = parseInt(height)
    }else{
      height = 0
    }
    

    if(alt === "Advertisement" || (height > 30 && width > 30) || image.classList.contains("img_ad")){
      return image.getAttribute("src")
    }
/*    
    var innerIframes = doc.getElementsByTagName("iframe")
    for(frame of innerIframes){
      iFrameImage = getImageFromDocument(frame.documentElement)
    }
  */
  }

  images = doc.getElementsByTagName("amp-img")
  for(var i = 0; i < images.length; i++){
    var amp_image = images[i]
      if(amp_image.classList.contains("img_ad")){
        var insideImage = amp_image.getElementsByTagName("img")
        if(insideImage.length > 0){
          return insideImage[0].getAttribute("src")
        }
      }
  }
  var creative_images = getElementsByXPath('//div[@class="creative-image"]//img',doc).concat(getElementsByXPath('//div[contains(@class,"product_image")]/img',doc))
                                                                                     .concat(getElementsByXPath('//div[contains(@class,"contenedorImg")]/img',doc))
                                                                                     .concat(getElementsByXPath('//div[contains(@class,"banner")]/img',doc))
                                                                                     .concat(getElementsByXPath('//a[@target="_blank"]//img', doc))
  
  for(creative_image of creative_images){
    var creative_image =  creative_images[0]
    width = creative_image.getAttribute("width") || creative_image.width
    height = creative_image.getAttribute("height") || creative_image.height
    if(width > 30 && height > 30){
      return creative_image.getAttribute("src")
    }
  }

  // Try to get background-image
  let doc_text
  try{
    doc_text = doc.documentElement.innerHTML
  }catch(_){
    doc_text = doc.innerHTML
  }
  
  if(doc_text){
    if(doc_text.indexOf("background-image:url(http") > 0 ){
      let first_background_image = doc_text.split("background-image:url(http")[1]
      first_background_image = first_background_image.split("}")[0].split(";")[0];
      first_background_image = "http" + first_background_image.slice(0, -1)
      return first_background_image
    }
  }

  // Brute force noscript
  var noscripts = document.getElementsByTagName("noscript")
  for(var noscript of noscripts){
    var text = noscript.textContent
    try{
        var image = text.split("<img")[1].split('src="')[1].split('"')[0]
        if(!image.startsWith("//")){
          return image
        }
    }catch(_){}
  }  

  return undefined
}

function getDataURLFromCanvas(doc_text){
  // Canvas element
  let canvas_element

  try{
    canvas_element = doc_text.getElementById("canvas")
  }catch(_){}

  if(!canvas_element){
    canvas_element = doc_text.getElementsByTagName("canvas")
    if(canvas_element.length > 0){
      canvas_element = canvas_element[0]
    }else{
      canvas_element = undefined
    }
  }

  if(canvas_element){
    data_url = canvas_element.toDataURL()
    return data_url
  }

  return undefined
}

function getElementsByXPath(xpath, parent){
    let results = [];
    let query = document.evaluate(xpath, parent || document,
        null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    for (let i = 0, length = query.snapshotLength; i < length; ++i) {
        results.push(query.snapshotItem(i));
    }
    return results;
}
 
function getLandingPageByClickTag(document){
  try{
    var textDocument = document.documentElement.innerHTML
    if(textDocument.indexOf("var clickTag = ") !== -1){
      possibleLanding = textDocument.split("var clickTag = ")[1].split('"')[1]
      if(possibleLanding.indexOf("google") === -1 && possibleLanding.indexOf("example") === -1){
        return possibleLanding
      }
    }
  }catch(_){
    return undefined
  }
  return undefined
}