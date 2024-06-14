


import { useState, useEffect } from 'react';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography'
import InfiniteScroll from 'react-infinite-scroll-component';

import AdToClassify from '../utils/AdToClassify';
import Card from '@mui/material/Card'
import Stack from '@mui/material/Stack'
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CircularProgress from '@mui/material/CircularProgress';

import PlatformIcon from '../utils/PlatformIcon'
import {getInterestRating, isAllowedToClassify} from '../utils/dbConnector'
import { useChromeStorageLocal } from 'use-chrome-storage';

export default function ClassifyAd(){

    const [ads, setAds] = useState([])
    const [adsToDisplay, setAdsToDisplay] = useState([])
    const [alreadyClassified, setAlreadyClassifed] = useState([])
    const [summaryInfo, setSummaryInfo] = useState()
    const [loading, setLoading] = useState(true)

    const perPage = 5;
    const [lastObjectPosition , setLastObjectPosition ] = useState(0);

    const [demo] = useChromeStorageLocal("demographic_info")
    const [allowClassification, setAllowClassification] = useState(true)

    useEffect(() => {
        if(demo && demo.registrationID){
            isAllowedToClassify().then(value => {
                setAllowClassification(value)
            })
        }
    }, [demo])

    useEffect(()=>{
        var db;
        var request = indexedDB.open("ads_db");
        request.onsuccess = function(event) {
            db = event.target.result;

            var transaction = db.transaction(["ads"]);
            var objectStore = transaction.objectStore("ads");
            var index = objectStore.index("timestamp");

            var res = []
            var alreadyClassifiedTemp = []
            index.openCursor().onsuccess = function(event){
                if(event.target.result){
                    let ad = event.target.result.value // We only ad those ads without valoration 
                    if((ad.image_file || ad.image_base64_url) && (!ad.valoration || !ad.guessed_platform)){
                        res.push(ad)
                    }
                    if(ad.valoration !== undefined && ad.guessed_platform !== undefined){
                        alreadyClassifiedTemp.push(ad)
                    }
                    event.target.result.continue()
                }else{

                    (async () => {
                        for(let ad_i = 0; ad_i < res.length; ad_i++){

                            let interest_valorated = false
                            if(res[ad_i].reasons){
                                let promises = []
                                for(let i = 0; i < res[ad_i].reasons.length; i++){
                                    let reason = res[ad_i].reasons[i]
                                    if(res[ad_i].platform === "linkedin"){
                                        reason = reason.split(".")[0]
                                        if(reason.indexOf("interests include ") !== -1){
                                            reason = reason.split("interests include ")[1]
                                        }
                                    }
                                    promises.push(getInterestRating(reason))
                                }
                                await Promise.all(promises).then(values =>{
                                    values.forEach(value => {
                                        if(value){
                                            interest_valorated = true
                                        }
                                    })
                                    }
                                )
                            }
                            res[ad_i].interest_valorated = interest_valorated
                        }
                    

                        setAds(res.sort((a, b) => 0.5 - Math.random())
                                .sort((a, b) => (b.visited || false) - (a.visited || false))
                                .sort((a, b) => b.interest_valorated - a.interest_valorated))
                        setLoading(false)
                        setAlreadyClassifed(alreadyClassifiedTemp)
                        })()
                }
            }
        };
    }, [])

    useEffect(()=>{
        if(alreadyClassified.length > 0){
            let totalAds = alreadyClassified.length
            let sucessRate = 0
            let meanScore = 0
            let platformInfo = {}

            alreadyClassified.forEach(ad => {
                if(platformInfo[ad.platform] === undefined){
                    platformInfo[ad.platform] = {platform: ad.platform, totalAds: 0, meanScore: 0, sucessRate: 0, falseRate: 0}
                }
                platformInfo[ad.platform].totalAds++

                
                meanScore += ad.valoration
                platformInfo[ad.platform].meanScore += ad.valoration
                
                if(ad.guessed_platform === ad.platform){
                    sucessRate++
                    platformInfo[ad.platform].sucessRate++
                }else{
                    if(platformInfo[ad.guessed_platform] === undefined){
                        platformInfo[ad.guessed_platform] = {platform: ad.guessed_platform, totalAds: 0, meanScore: 0, sucessRate: 0, falseRate: 0}
                    }
                    platformInfo[ad.guessed_platform].falseRate++
                }

            })
            meanScore = Math.round(meanScore/totalAds * 100) / 100 + "★"
            sucessRate = Math.round(sucessRate/totalAds * 100) + "%"

            Object.keys(platformInfo).forEach((platform) => {
                if(platformInfo[platform].totalAds > 0){

                    platformInfo[platform].meanScore = Math.round(platformInfo[platform].meanScore/platformInfo[platform].totalAds * 100) / 100 + "★"
                    platformInfo[platform].sucessRate = Math.round(platformInfo[platform].sucessRate/platformInfo[platform].totalAds * 100) + "%"
                }
            })

            setSummaryInfo({totalAds, sucessRate, meanScore, platformInfo})
        }
    },[alreadyClassified])



    useEffect(()=>{
        if(ads.length > 0){
            getNextAds()
        }
    }, [ads])

    const getNextAds = () => {
        if(adsToDisplay === undefined){
            setAdsToDisplay(ads.slice(lastObjectPosition, lastObjectPosition + perPage))
        }else{
            setAdsToDisplay(currentAds => {
                return [...currentAds, ...ads.slice(lastObjectPosition, lastObjectPosition + perPage)]
            })
        }
        setLastObjectPosition(currentValue => currentValue + perPage)
    }

    if(!allowClassification){
        return(
            <div>
            <Typography
                variant="h5"
                noWrap
                sx={{
                margin: "30px",
                fontFamily: 'monospace',
                fontWeight: 700,
                letterSpacing: '.125rem',
                color: 'inherit',
                textDecoration: 'none',
                alignItems: 'center'
                }}
            >
                CLASSIFY ADS
            </Typography>
            <div style={{margin: 20, padding: 30}}>
            <p>
                You need to collect 60 ads before starting to classify ads. 
            </p>
            <p>
                From those 60 ads, remember that you have to collect a minium of 10 ads per platform (as stated in the instructions, you need account in at least <b>two</b> platforms)
            </p>
            </div>

            </div>
        )
    }

    return(
        <>
            <Typography
                variant="h5"
                noWrap
                sx={{
                margin: "30px",
                fontFamily: 'monospace',
                fontWeight: 700,
                letterSpacing: '.125rem',
                color: 'inherit',
                textDecoration: 'none',
                alignItems: 'center'
                }}
            >
                CLASSIFY ADS
            </Typography>
            <Grid container spacing={0} direction="row" alignItems="center" justifyContent="center" sx={{px: 4, margin: "auto", paddingBottom: "150px",  maxWidth: "2000px"}}>
                <Grid item xs={12} md={6}>
                    <Card sx={{color: "white", backgroundColor: "rgb(32, 35, 42)", p: 2, my: 1}}>
                        <Typography
                            variant="h6"
                            noWrap
                            sx={{
                            margin: "3px",
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            letterSpacing: '.125rem',
                            color: 'inherit',
                            textDecoration: 'none',
                            alignItems: 'center'
                            }}
                        >
                        CLASSIFICATION SUMMARY
                        </Typography>

                        {summaryInfo ? 
                        <>
                        <Stack direction="row" alignItems="center" justifyContent="center" spacing={2}>
                        <div>Mean score <p>{summaryInfo.meanScore}</p></div>
                        <div>Classified Ads <p>{summaryInfo.totalAds}</p></div>
                        <div>Success rate  <p>{summaryInfo.sucessRate}</p></div>
                        </Stack>
                        <Accordion disableGutters={true} sx={{backgroundColor: "rgba(0,0,0,0.2)", boxShadow: 0, color: "white"}}>
                        <AccordionSummary style={{justifyContent: "center"}} expandIcon={<ExpandMoreIcon sx={{color:"white"}}/>}>
                        <Typography variant="body1"  sx={{width: '100%', margin: "auto"}}><b>Show info by platform</b></Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                        <Typography>
                        <div>{Object.values(summaryInfo.platformInfo).map(platform => {
                        if(platform.platform !== "no platform"){
                            return (<Stack direction="row" alignContent="center" spacing={2} sx={{textAlign: "start"}}>
                                <PlatformIcon platform={platform.platform}/> 
                                <div style={{minWidth: "15%"}}>Total Ads: {platform.totalAds}</div> 
                                <div style={{minWidth: "20%"}}>Sucess rate: {platform.sucessRate}</div>
                                <div style={{minWidth: "20%"}}> Mean score: {platform.meanScore}</div>

                            </Stack>)
                        }else{
                            return null
                        }
                        })}</div>
                        </Typography>
                        </AccordionDetails>
                        </Accordion>
                        </>: "There are no classified ads"}
                        
                    </Card>

                </Grid>
                
                {adsToDisplay.length > 0  ? 
                <Grid item lg={12} xl={11}>
                    <InfiniteScroll
                        dataLength={adsToDisplay.length}
                        next={getNextAds}
                        hasMore={lastObjectPosition < ads.length}
                    >
                        {adsToDisplay.map(ad => {
                            return <AdToClassify adToDisplay={ad} classifiedCallback={(newAd) => {setAlreadyClassifed(prev => [...prev, newAd])}}/>
                        })}
                    </InfiniteScroll>
                </Grid>
                
                :  <Grid item lg={12} xl={11}>
                {loading ?<Stack direction="row" alignContent="center" justifyContent="center" spacing={3}><span>Loading </span><CircularProgress /></Stack> :
                "There are no more ads to classify, try again later"
                }
                </Grid>}
            </Grid>
        </>
    )
}


