import React from 'react';

import {useState, useEffect} from 'react'
// MUI
import Box from '@mui/material/Box';
import ImageList from '@mui/material/ImageList';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Slide from '@mui/material/Slide';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import TwitterIcon from '@mui/icons-material/Twitter';
import FacebookIcon from '@mui/icons-material/Facebook';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import IconButton from '@mui/material/IconButton';
import GoogleIcon from '@mui/icons-material/Google';
import YouTubeIcon from '@mui/icons-material/YouTube';

import Badge from '@mui/material/Badge';
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'

import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel';
import Tooltip from '@mui/material/Tooltip'
import Stack from '@mui/material/Stack'
import InfoIcon from '@mui/icons-material/Info';

import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import Ad from '../ads/Ad'
import TotalAdsBarChart from '../charts/TotalAdsBarChart'
import AdReasonsChart from '../charts/AdReasonsChart'
import StackedDateAdsBarChart from '../charts/StackedDateAdsBarChart'
import useForcePageUpdate from '../utils/useForcePageUpdate'

import { getPercentageOfAds, getInterestRating, countInterests } from '../utils/dbConnector'

import InputBase from '@mui/material/InputBase';
import SearchIcon from '@mui/icons-material/Search';
import { styled, alpha } from '@mui/material/styles';

import TargetedInterests from '../charts/TargetedInterests';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const Search = styled('div')(({ theme }) => ({
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: alpha(theme.palette.common.white, 0.15),
    '&:hover': {
      backgroundColor: alpha(theme.palette.common.white, 0.25),
    },
    margin: 'auto',
    width: '80%',
  }));
  
const SearchIconWrapper = styled('div')(({ theme }) => ({
    padding: theme.spacing(0, 2),
    height: '100%',
    position: 'absolute',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
}));
  

const StyledInputBase = styled(InputBase)(({ theme }) => ({
    color: 'inherit',
    '& .MuiInputBase-input': {
        padding: theme.spacing(1, 1, 1, 0),
        // vertical padding + font size from searchIcon
        paddingLeft: `calc(1em + ${theme.spacing(4)})`,
        transition: theme.transitions.create('width'),
        width: '100%',
    },
}));

const adsPerPage = 48

export default function AllAds(){

    const [reasons, setReasons] = useState([])
    const [adsNumberByPlatform, setAdsNumberByPlatform] = useState({twitter: 0, linkedin: 0, facebook: 0, google: 0, youtube: 0}) 
    const [percentageOfAdPosts, setPercentageOfAdPosts] = useState({twitter: 0, linkedin: 0, facebook: 0})
    const forceUpdate = useForcePageUpdate(10000)
    const [loaded, setLoaded] = useState(false)
    const { height, width } = useWindowDimensions();

    const [adsByDay, setAdsByDay] = useState()
    const [reasonsForChart, setReasonsForChart] = useState()
    const [adLimit, setAdLimit] = useState(adsPerPage)
    const [weekText, setWeekText] = useState()
    const [search, setSearch] = useState()

    const [interests, setInterests] = useState([])
    const [generalReasons, setGeneralReason] = useState([])
    const [numberOfInterestsUsed, setNumberOfInterestsUsed] = useState()
    const [totalNumberOfInterests, setTotalNumberOfInterests] = useState({})

    useEffect(() => {
        Promise.all([
            getPercentageOfAds("twitter"), getPercentageOfAds("linkedin"), getPercentageOfAds("facebook"),
            countInterests("twitter"), countInterests("linkedin"), countInterests("facebook")
        ]).then(r =>{
            setPercentageOfAdPosts({
                twitter: r[0], linkedin: r[1], facebook: r[2]
            })
            setTotalNumberOfInterests({
                twitter: r[3], linkedin: r[4], facebook: r[5]
            })
        })
    }, [forceUpdate])


    useEffect(()=>{
        var db;
        var request = indexedDB.open("ads_db");
        const amount = {twitter: 0, linkedin: 0, facebook: 0, google: 0, youtube: 0}
        request.onsuccess = function(event) {
            db = event.target.result;
            var transaction = db.transaction(["ads"]);
            var objectStore = transaction.objectStore("ads");
            var index = objectStore.index("timestamp");

            var res = []
            index.openCursor().onsuccess = function(event){
                if(event.target.result){
                    if(event.target.result.value.received){
                        res.push(event.target.result.value)
                        amount[event.target.result.value.platform]++
  
                    }
                    event.target.result.continue()
                }else{
                    if(res.length > reasons.length){


                        const dates = []
                        const numberOfAds = {twitter: [], linkedin: [], facebook: [], google: [], youtube: []}
                        const currentTime = new Date().getTime()
                        let oldest_ad = new Date(res[0].timestamp).getTime()
                        let day_diferences = Math.floor((currentTime-oldest_ad) / (1000 * 60 * 60 * 24 )) + 2
                        while(day_diferences % 7 !== 0){
                            day_diferences++
                        }
                        for(let i = day_diferences - 1; i >= 0; i--){ //7 times or more
                            dates.push(new Date(currentTime - (1000 * 60 * 60 * 24 * i)).toLocaleDateString("sv")) //Why sweden locale instead of ISO? Their format is similar to ISO, and this way we keep track of the timezone info, that way the ads in the chart of ads seen by week will be accurate for the user
                            Object.keys(numberOfAds).forEach(plat => numberOfAds[plat].push(0))
                        }

                        const reasonsChart = {"twitter": {}, "facebook": {}, "linkedin": {}, "google": {}, "youtube": {}}
                        res.forEach((ad) => {

                            const date = new Date(ad.timestamp).toLocaleDateString("sv") 
                            numberOfAds[ad.platform][dates.indexOf(date)]++;

                            if(ad.reasons){
                                ad.reasons.forEach((reason, index) =>{
                                    if(ad.platform === "linkedin"){
                                        reason = reason.split(".")[0]
                                        if(reason.indexOf("interests include ") !== -1){
                                            reason = reason.split("interests include ")[1]
                                        }
                                    }
                                    if(ad.platform === "linkedin" && reason.includes("wants to reach ")){
                                        reason = reason.split("wants to reach ")[1]
                                    }
                                    if(ad.platform === "linkedin" && reason.includes("Your overall work experience")){
                                        reason = "Your work experience"
                                    }
                                    if(ad.platform === "linkedin" && reason.includes("Your overall work experience")){
                                        reason = "Your work experience"
                                    }
                                    if(ad.platform === "linkedin" && reason.includes("Your profile location")){
                                        reason = "Location"
                                    }
                                    if(ad.platform === "linkedin" && reason.includes("You have either interacted with")){
                                        reason = "Interacted with companies' content"
                                    }
                                    if(ad.platform === "facebook" && reason.includes("Set their age")){
                                        reason = "Age"
                                    }
                                    if(ad.platform === "facebook" && reason.includes("A primary location")){
                                        reason = "Location"
                                    }

                                    reason = capitalizeFirstLetter(reason)
                                    ad.reasons[index] = reason

                                    let allowAdding = true

                                    if(ad.platform === "twitter" && reason.includes(":")){ 
                                        const location = "Location" 
                                        if(!reasonsChart["twitter"][location]){
                                            reasonsChart["twitter"][location] = 1
                                        }else{
                                            reasonsChart["twitter"][location]++
                                        }
                                        allowAdding = false
                                    }
                                    
                                    if(ad.platform === "twitter" && /\d/.test(reason)){ // Twitter and contains a number -> age related
                                        reason = "Age"
                                        allowAdding = true
                                    }

                                    if(ad.platform === "linkedin" && reason.includes("Your skills include")){
                                        reason = "Your skills"
                                    }

                                    if(reason !== "No reasons found" && allowAdding){   
                                        if(reasonsChart[ad.platform][reason] === undefined){
                                            reasonsChart[ad.platform][reason] = 1
                                        }else{
                                            reasonsChart[ad.platform][reason]++
                                        }
                                    }
                                })
                            }
                        })

                        setReasonsForChart(reasonsChart)
                        setReasons(res.reverse())
                        setAdsNumberByPlatform(amount)
                        setAdsByDay({dates, numberOfAds})
                    }
                    setLoaded(true)
                }
            }
            
        };
    }, [forceUpdate, reasons.length])

    const sortObjectToArray = (object) => {
        let sortable = [];
        for (var value in object) {
            sortable.push([value, object[value]]);
        }

        sortable.sort(function(a, b) {
            return b[1] - a[1];
        });
        return sortable
    }

    useEffect(() => {
        if(!reasonsForChart){
            return;
        }
        const newReasons = {}
        const newInterests = {}
        Object.keys(reasonsForChart).forEach(key => {
            Object.keys(reasonsForChart[key]).forEach(interest => {
                if (newReasons[interest] === undefined){
                    newReasons[interest] = reasonsForChart[key][interest]
                }else{
                    newReasons[interest] += reasonsForChart[key][interest]
                }
            })
        })
        setGeneralReason(sortObjectToArray(newReasons))
        const dbQueries = []
        const reasonsArray = Object.keys(newReasons)
        for(var interest of reasonsArray){
            dbQueries.push(getInterestRating(interest, true))
        }

        Promise.all(dbQueries).then(r => {
            r.forEach((response, index) => {
                if(response){
                    newInterests[reasonsArray[index]] = newReasons[reasonsArray[index]]
                }
            })

            setInterests(sortObjectToArray(newInterests))
            
            const newNumberOfInterestsUsed = {}
            
            Object.keys(reasonsForChart).forEach(plat => {
                newNumberOfInterestsUsed[plat] = 0
                Object.keys(reasonsForChart[plat]).forEach(reason => {
                    if(newInterests[reason]){
                        newNumberOfInterestsUsed[plat] = newNumberOfInterestsUsed[plat] + 1
                    }
                })
            })
            setNumberOfInterestsUsed(newNumberOfInterestsUsed)
        })
    }, [reasonsForChart])
 

    const [backdrop, setBackdrop] = useState({open: false, info:null})
    
    const [hiddenPlatforms, setHiddenPlatforms] = useState([])
    const [onlyVisitedAds, setOnlyVisitedAds] = useState(false)
    const [adsContainer, setAdsContainer] = useState()
    const [hideUnclassified, setHideUnclassified] = useState(false)

    const handlePlatform = (platform) =>{
        var newHiddenPlatforms = [...hiddenPlatforms]

        if(newHiddenPlatforms.includes(platform)){
            newHiddenPlatforms.splice(newHiddenPlatforms.indexOf(platform), 1)
        }else{
            newHiddenPlatforms.push(platform)
        }

        setHiddenPlatforms(newHiddenPlatforms)
    }

    useEffect(() => {
        const ads =    
            reasons.map((ad) => {
            let canShowPlatformIcon = ad.received && (ad.valoration || ad.guessed_platform || (!ad.image && !ad.image_file && !ad.image_base64_url) || (ad.image === "no image" && !ad.image_file && !ad.image_base64_url))

            if(!(hiddenPlatforms.includes(ad.platform) && canShowPlatformIcon) &&
               !(hideUnclassified && !canShowPlatformIcon) &&
               !(onlyVisitedAds && !ad.visited) && 
               !(!!search && !( (ad.author && ad.author.toLowerCase().includes(search)) || (ad.text && ad.text.toLowerCase().includes(search)) ))
            ){
                return (
                    <Ad key={ad.ad_id} ad_info={ad} platform={ad.platform} callback={(info) => setBackdrop(info)} width={width > 2000 ? 2000 : width} canShowPlatformIcon={canShowPlatformIcon}/>
                )
            }else{
                return undefined
            }
        })
        setAdsContainer(ads.filter(ad => ad !== undefined))
    }, [hiddenPlatforms, onlyVisitedAds, reasons, search, width, hideUnclassified])

    if(!loaded){
        return ""
    }
    if(adsContainer === undefined || (adsContainer.length === 0 && !search && !onlyVisitedAds && !hideUnclassified)){
        return <div>
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
                alignItems: 'center',
                textAlign: "center"
                }}
            >
                ADS COLLECTED
            </Typography>

            No ads seen, try again later
        </div>
    }

    return(
        <div style={{textAlign: "left", margin: "auto", maxWidth: "2000px", padding: 20, paddingTop: 0}}>
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
                alignItems: 'center',
                textAlign: "center"
                }}
            >
                ADS COLLECTED
            </Typography>
            <div style={{textAlign: "center", fontSize: "1.2rem"}}>
            <Card sx={{width: "98%", backgroundColor: "#1A2027", color: "white", margin: "auto", marginBottom: "30px", marginTop: "10px", padding: "10px"}}>
                <Grid container spacing={2} justifyContent="center">
                <Grid item xs={5}>
                    Total Ads: {Object.values(adsNumberByPlatform).reduce((a,b) => a+b)}
                    <TotalAdsBarChart info={adsNumberByPlatform}/>
                </Grid>
                <Grid item xs={1}><div></div></Grid>
                <Grid item xs={5}>
                    Ads seen chart {weekText ? "(" + weekText + ")" : ""}
                    <StackedDateAdsBarChart info={adsByDay} textCallback={(text) => setWeekText(text)}/>
                </Grid>

                
                <Grid item xs={12}>
                <Accordion disableGutters={true} sx={{backgroundColor: "rgba(0,0,0,0.4)", backgroundImage: "", boxShadow: 0, color: "white"}}>
                    <AccordionSummary style={{justifyContent: "center"}} expandIcon={<ExpandMoreIcon sx={{color:"white"}}/>}>
                    <Typography variant="h5"  sx={{width: '100%', margin: "auto"}}><b>Expand Dashboard</b></Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                    <Grid item xs={12}>
                        <h3>These are the interests that platforms use more often to target you</h3>
                        <TargetedInterests rawInfo={reasonsForChart} interests={interests} generalReasons={generalReasons}/>
                    </Grid>
                    {["facebook", "twitter", "linkedin"].map(platform => {
                        if(reasonsForChart[platform] && Object.keys(reasonsForChart[platform]).length > 0){

                            
                            return (
                            <Grid item xs={12}>
                                <div style={{color: "white", margin: "auto", padding: "5px"}}>
                                    <Divider><h3 style={{margin: 0}}>{capitalizeFirstLetter(platform)}</h3></Divider>
                                    <Grid container spacing={2} justifyContent="flex-start" alignContent="center">
                                        <AdReasonsChart info={reasonsForChart} platform={platform} byRating={false} text={"Most common reasons for showing ads"} allowHideTop3={true}/>
                                        <AdReasonsChart info={reasonsForChart} platform={platform} byRating={true} text={"Mean interests valuation"} tooltip={<Tooltip title="This chart indicates the distribution of your interests valuations that had been used to target ads to you, and the mean number of stars"><InfoIcon/></Tooltip>}/>
                                        
                                        <Grid item xs={12} md={4}>
                                        <h5>{capitalizeFirstLetter(platform)} insights</h5>
                                        <div style={{fontSize: "1.3rem"}}>


                                        <p>
                                        You have seen <b>{adsNumberByPlatform[platform]}</b> unique ads on {capitalizeFirstLetter(platform)} 
                                        </p>
                                        {percentageOfAdPosts && percentageOfAdPosts[platform] && percentageOfAdPosts[platform].totalPosts && 
                                        <p>
                                            You have seen <b>{percentageOfAdPosts[platform].totalPosts}</b> {platform === "twitter" ? "tweets" : "posts"}, of which <b>{percentageOfAdPosts[platform].totalAds}</b> were ads:<br/>  
                                            <b>{percentageOfAdPosts[platform] && percentageOfAdPosts[platform].perc}</b> ads every 100 {platform === "twitter" ? "tweets" : "posts"}
                                        </p>
                                        }

                                        <p>
                                        You have been targeted by <b>{numberOfInterestsUsed && numberOfInterestsUsed[platform]}</b> different interests
                                        </p>
                                        {totalNumberOfInterests[platform] &&
                                        <p>
                                            {capitalizeFirstLetter(platform)} has assigned you <b>{totalNumberOfInterests[platform].interests}</b> interests
                                        </p>
                                        }
                                        </div>
                                        
                                        </Grid>
                                    </Grid>
                                </div>

                            </Grid>
                        )
                        }else{
                            return null
                        }
                    })}
                    { ((reasonsForChart["google"] && Object.keys(reasonsForChart["google"]).length > 0) || (reasonsForChart["youtube"] && Object.keys(reasonsForChart["youtube"]).length > 0)) &&
                    <Grid item xs={12}>
                    <div style={{color: "white", margin: "auto", padding: "5px"}}>
                                    <Divider><h3>Google Ads</h3></Divider>
                                    <Grid container spacing={2} justifyContent="flex-start" alignContent="center">
                                        {reasonsForChart["google"] && Object.keys(reasonsForChart["google"]).length > 0 && <AdReasonsChart info={reasonsForChart} platform={"google"} byRating={false} text={"Most common reasons for showing ads on Google Ads"} allowHideTop3/>}
                                        {reasonsForChart["youtube"] && Object.keys(reasonsForChart["youtube"]).length > 0 && <AdReasonsChart info={reasonsForChart} platform={"youtube"} byRating={false} text={"Most common reasons for showing ads on YouTube"} allowHideTop3/>}
                                    </Grid>
                                </div>
                            </Grid>
                    }

                    </AccordionDetails>
                </Accordion>
                </Grid>

                
                
                </Grid>

            </Card>
            <Grid container spacing={2} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Grid item xs={3}></Grid>
            <Grid item xs={12} md={6}>


            <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
                <div>
                    Hide or show platforms
                </div>
                <Tooltip title="Click in a platform icon to show or hide ads from that platform. Unclassified ads will appear anyways"><InfoIcon/></Tooltip>
            </Stack>

            <div style={{textAlign: "center", fontSize: "1rem"}}>
            <IconButton style={{margin: 5}} onClick={() => handlePlatform("facebook")}>
                <Badge color="primary">
                    <FacebookIcon  style={{fontSize: 35, color: (hiddenPlatforms.includes("facebook") ? "gray" : "white")}}/>
                </Badge>
            </IconButton>
            <IconButton style={{margin: 5}} onClick={() => handlePlatform("twitter")} >
                <Badge color="primary">
                    <TwitterIcon style={{fontSize: 35, color: (hiddenPlatforms.includes("twitter") ? "gray" : "white")}}/>
                    
                </Badge>
            </IconButton>
            <IconButton style={{margin: 5}} onClick={() => handlePlatform("linkedin")}>
                <Badge color="primary">
                    <LinkedInIcon style={{fontSize: 35, color: (hiddenPlatforms.includes("linkedin") ? "gray" : "white")}}/>
                </Badge>
            </IconButton>
            <IconButton style={{margin: 5}} onClick={() => handlePlatform("google")}>
                <Badge color="primary">
                    <GoogleIcon style={{fontSize: 35, color: (hiddenPlatforms.includes("google") ? "gray" : "white")}}/>
                </Badge>
            </IconButton>
            <IconButton style={{margin: 5}} onClick={() => handlePlatform("youtube")}>
                <Badge color="primary">
                    <YouTubeIcon style={{fontSize: 35, color: (hiddenPlatforms.includes("youtube") ? "gray" : "white")}}/>
                </Badge>
            </IconButton>
            </div>
            </Grid>
            <Grid item xs={12} md={3}>
            <Search>
            <SearchIconWrapper>
              <SearchIcon />
            </SearchIconWrapper>
            <StyledInputBase
              placeholder="Search…"
              value={search}
              onChange={(e) => {setSearch(e.target.value.toLowerCase()); setAdLimit(adsPerPage)}}
            />
          </Search>
          <div>
                <FormControlLabel control={<Switch />} label={<Stack direction="row" alignItems="center" spacing={1}>Show only visited ads <Tooltip title="Show only ads that you have visited the landing page or those that you have clicked on"><InfoIcon/></Tooltip></Stack>} checked={onlyVisitedAds} onChange={(e) => {setOnlyVisitedAds(e.target.checked); setAdLimit(adsPerPage)}}/>
                <FormControlLabel control={<Switch />} label={<Stack direction="row" alignItems="center" spacing={1}>Hide unclassified ads <Tooltip title="Select this option if you don't want to display the ads which are not classified yet"><InfoIcon/></Tooltip></Stack>} checked={hideUnclassified} onChange={(e) => {setHideUnclassified(e.target.checked); setAdLimit(adsPerPage)}}/>
            </div>
            </Grid>
                            
            </Grid>
            </div>
            <div>

            </div>
            <Dialog
                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open={backdrop.open}
                onClose={() => setBackdrop({open: false, info: backdrop.info})}
                fullWidth
                maxWidth="md"
                TransitionComponent={Transition}
                >    
                <DialogContent sx={{p: 0}}>
                    <div style={{padding: 15, fontSize: "1.1rem"}}>
                        {backdrop.info}
                    </div>
                </DialogContent>
            </Dialog>

            <div style={{minHeight: "500px"}}>

            <Box>
            <ImageList cols={width < 1400 ? width < 1100 ? width < 600 ? 1 : 2 : 3 : 4} gap={15} style={{padding: 10, paddingBottom:20, margin: 0}}>
                {adsContainer.slice(0, adLimit)}
            </ImageList>
            </Box>
            </div>
            <div style={{margin: "auto", width: "40%"}}>

            {adsContainer.length > adLimit ? <Button style={{width: "100%"}} variant="contained" onClick={() => setAdLimit(prev => prev + 2 * adsPerPage)}>Load More Ads</Button> : ""}
            </div>
        </div>
    )
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
  
function getWindowDimensions() {
    const { innerWidth: width, innerHeight: height } = window;
    return {
      width,
      height
    };
  }
  
function useWindowDimensions() {
    const [windowDimensions, setWindowDimensions] = useState(getWindowDimensions());
  
    useEffect(() => {
      function handleResize() {
        setWindowDimensions(getWindowDimensions());
      }
  
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);
  
    return windowDimensions;
  }