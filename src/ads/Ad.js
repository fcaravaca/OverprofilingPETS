// MUI
import ImageListItem from '@mui/material/ImageListItem';
import ImageListItemBar from '@mui/material/ImageListItemBar';
import IconButton from '@mui/material/IconButton';
import InfoIcon from '@mui/icons-material/Info';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import Button from '@mui/material/Button'

// Custom Components
import FiveStarClassification from '../utils/FiveStarClassification';
import VisitedLinkIcon from '../utils/VisitedLinkIcon';
import PlatformIcon from '../utils/PlatformIcon'

// Server address
import {SERVER_ADDRESS, getInterestRating} from '../utils/dbConnector'

export default function Ad({ad_info, platform, callback,width, canShowPlatformIcon}){

    if(ad_info === undefined){
        return(null)
    }

    let ad_url = getBetterURL(ad_info.landing_page)
    let site_url = getBetterURL(ad_info.current_url)
    let image_url = undefined
    let small_image = false

    if(!ad_info.author && (ad_info.platform === "google" || ad_info.platform === "youtube") && ad_url && ad_url.split(".").slice(0,-1).length > 0){
        ad_info.author = ad_url.split(".").slice(0,-1).reduce((all, val) => all + " " + val.charAt(0).toUpperCase() + val.slice(1))
        ad_info.author = ad_info.author.charAt(0).toUpperCase() + ad_info.author.slice(1)

    }

    
    if(ad_info.image && !ad_info.image_file && ad_info.image !== "no image"){
        image_url = ad_info.image.trim().split(" ")[0]       
    }

    if(ad_info.image_file){
        image_url = SERVER_ADDRESS + ad_info.image_file
        small_image =  ad_info.image_file.split("_")[1] < 150
    }

    if(ad_info.image_base64_url){
        image_url = ad_info.image_base64_url
    }


    let item_width = "23vw"
    if(width === 2000){
        item_width = "480px"
    }
    if(width < 1400){
        item_width = "30vw"
    }
    if(width < 1100){
        item_width = "44vw"
    }
    if(width < 600){
        item_width = "86vw"
    }

    async function setBackdrop(){

        const openInNewTab = (url) => {
            const newWindow = window.open(url, '_blank', 'noopener,noreferrer')
            if (newWindow) newWindow.opener = null
        }

        function getInterestsRatingFormAll(){
            return new Promise(async (resolve) => {
                if(ad_info.reasons){
                    let interests = []
                    for (const reason of ad_info.reasons){
                        let interestRating = await getInterestRating(reason)
                        interests.push(<div style={{paddingLeft: 5}}>
                        <Stack direction="row" alignItems="center" justifyContent="flex-start" spacing={0.5}>
                            <span>- {reason}</span>
                            {interestRating ? 
                            <>
                            <span>- You rated this interest with: </span>
                            <span style={{minWidth: "180px"}}>
                            <FiveStarClassification valoration={interestRating}/></span>
                            </>
                            : ""}
                            
                        </Stack>
                        </div>)
                    }
                    resolve(interests)
                }else{
                    resolve([])
                }
            })
        }
        let interests = await getInterestsRatingFormAll()

        const backdrop = (
            <div style={{paddingLeft: 20, maxWidth: "fit-content", textAlign: "left"}}>
            {image_url && 
                <img
                src={image_url}
    
                style={{maxHeight: "30vh", maxWidth: "80vw"}}
                alt={"ad"}
                loading="lazy"
                />}
            <h4>{ad_info.author}</h4> 
            
            {(site_url && canShowPlatformIcon) ? 
            <h4>Ad seen in {site_url}</h4>
            : ""}
    
            {(canShowPlatformIcon && ad_info.valoration) ? 
                <Stack direction="row" alignItems="center" justifyContent="flex-start" spacing={0.5}>
                    <span>You rated this ad with:</span>
                    <span style={{minWidth: "180px"}}>
                        <FiveStarClassification valoration={ad_info.valoration}/>
                    </span>
                </Stack>
            : ""}
    
            {(ad_info.platform === "twitter" && canShowPlatformIcon) ?
            <div>Click the icon to visit the tweet: <IconButton sx={{ color: 'rgba(255, 255, 255, 1)' }} onClick={() => openInNewTab("https://twitter.com/i/status/" + ad_info.tweet_id)}> <PlatformIcon platform="twitter"/></IconButton></div>
            : ""}
            <p style={{wordWrap: "break-word"}}>{ad_info.text || ad_info.title}</p>
            Collection date: {ad_info.timestamp && new Date(ad_info.timestamp).toLocaleString()}
            {interests && interests.length > 0 ? 
            <div style={{marginTop: 4, marginBottom: 3}}>
                Reasons of this ad:
                <div style={{maxHeight: "200px", overflowY: "auto"}}>
                    {interests.map(value => value)}
                </div>
            </div>
            : <div>No reasons found</div>}
            {ad_info.landing_page && <div><b>Landing page:</b> <a style={{color: "white"}} href={ad_info.landing_page}>{ad_info.landing_page.substring(0, 100)}</a></div>}
    
        </div>
        )
        callback({open: true, info: backdrop})

    }


    return(
    <ImageListItem className="ad-img" style={{minHeight: "300px", width: item_width}}>
            {image_url ? 
            <img
            src={image_url}

            style={{height: "300px", backgroundColor: "white", objectFit: small_image ? "scale-down" : ""}}
            alt={"ad"}
            loading="lazy"
            />
        : <div style={{height: "300px", backgroundColor: "black"}}/>}

        <ImageListItemBar
            title={                
                <Stack direction="row" alignItems="center" gap={0.5}>
                    {canShowPlatformIcon && <PlatformIcon platform={platform}/>} {ad_info.visited && <VisitedLinkIcon/>} <Typography style={{ fontWeight: 600 }} variant="body1">{ad_info.author}</Typography>
                </Stack>}
            subtitle={<div style={{wordBreak: "break-all", maxWidth: "100%", whiteSpace: "normal", lineHeight: "1.5em", height: "3em"}}>{ad_info.text || ad_info.title}</div>}
            position="below"
            style={{height: "80px"}}
            actionIcon={
                <Tooltip title="More info about this ad">
                    <IconButton sx={{ color: 'rgba(255, 255, 255, 0.54)' }} onClick={()=>setBackdrop()}>
                        <InfoIcon />
                    </IconButton>
                </Tooltip>
            }
        />
    </ImageListItem>
    )

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

