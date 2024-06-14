
import Grid from '@mui/material/Grid';
import { useState, useEffect } from 'react';

import useForcePageUpdate from '../utils/useForcePageUpdate'
import InterestSummary from '../utils/InterestSummary'
import Interst from '../utils/Interst'
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import Paper from '@mui/material/Paper';
// React & hooks
import { useSearchParams } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import InfiniteScroll from 'react-infinite-scroll-component';
import {getAllReasonsOfAds, sendSocialMediaUsage, getSocialMediaUsage, sendWarning, isAllowedToClassify} from '../utils/dbConnector'
import {useBlockedExtensionHook} from '../utils/useBlockedExtensionHook'
import { useChromeStorageLocal } from 'use-chrome-storage';

export default function Interests(){

    const setSearchParams = useSearchParams()[1];

    const [interests, setInterests] = useState([])
    const [interestsClassified, setInterestsClassified] = useState([])
    const [interestsToClassify, setInterestsToClassify] = useState([])
    const [interestsToDisplay, setInterestsToDisplay] = useState([])
    const [reasonsOfAds, setReasonsOfAds] = useState()
    const [interestsToClassifyIndex, setInterestsToClassifyIndex] = useState({})
    
    const [demographic, setDemographic] = useState([])
    
    const forceUpdate = useForcePageUpdate(interests.length < 100 ? 1500 : 30000)
    const [platformsToShow, setPlatformsToShow] = useState([])

    const [interestsTime, setInterestsTime] = useChromeStorageLocal("interests_time",[])
    const perPage = 48;
    const [lastObjectPosition , setLastObjectPosition ] = useState(0);

    const [blockedTime, setBlockedTime] = useBlockedExtensionHook()
    const [blockedTimesSt, setBlockedTimesSt] = useChromeStorageLocal("blocked_times")
    const [demo] = useChromeStorageLocal("demographic_info")
    const [allowClassification, setAllowClassification] = useState(true)

    useEffect(() => {
        if(demo && demo.registrationID){
            isAllowedToClassify().then(value => {
                setAllowClassification(value)
            })
        }
    }, [demo])

    useEffect(() => {
        console.log(allowClassification)
    }, [allowClassification])

    useEffect(()=>{
        var db;
        var request = indexedDB.open("ads_db");

        getAllReasonsOfAds().then(newReasonsOfAds => setReasonsOfAds(newReasonsOfAds))

        request.onsuccess = function(event) {
            db = event.target.result;

            var transaction = db.transaction(["interests"]);
            var objectStore = transaction.objectStore("interests");
            var index = objectStore.index("interest_name");

            var res = []
            var cursor;
            index.openCursor().onsuccess = function(event){
                cursor = event.target.result
                if(cursor){
                    if(cursor.value && cursor.value.platform !== "garbage"){
                        res.push(cursor.value)
                    }
                    cursor.continue()
                }else{
                    setInterests(res)
                }
            }

            var objectStoreDemo = db.transaction(["demographic_data"]).objectStore("demographic_data")
            objectStoreDemo.getAll().onsuccess = function(event){
                if(demographic.length < event.target.result.length){
                    setDemographic(event.target.result)
                }
            }
        };
    }, [forceUpdate])

    useEffect(() => {
        getSocialMediaUsage().then(r => setPlatformsToShow(r))
    }, [])


    useEffect(()=>{
        const newClassified = []
        const newToClassify = []
        const newToClassifyIndex = {}
        interests.forEach((interest) =>{
            if(interest.valoration){
                newClassified.push(interest)
            }else{
                if(newToClassifyIndex[interest.interest_name] === undefined){
                    newToClassify.push(interest)
                    newToClassifyIndex[interest.interest_name] = []
                }else{
                    newToClassifyIndex[interest.interest_name].push(interest)
                }
            }
        })

        if(newClassified.length > interestsClassified.length + 9){ //10 new interests classified: trigger change 
            setInterestsClassified(newClassified)
        }

        if(newToClassify.length > interestsToClassify.length && reasonsOfAds !== undefined){ // More interests added: trigger change
            setInterestsToClassifyIndex(newToClassifyIndex)
            let randomInterests = newToClassify.sort((a, b) => 0.5 - Math.random())
            randomInterests = randomInterests.sort((a,b) => reasonsOfAds.includes(b.interest_name) - reasonsOfAds.includes(a.interest_name))

            let randomInterestsWithCT = randomInterests
            for(let i = Math.floor(Math.random() * (19) + 13); i < randomInterestsWithCT.length; i+=Math.floor(Math.random() * (19) + 40)){ //Between 40 and 60
                let garbageInterestName = ["Enkanpkpwd","Kekf ngdsqf","Kkaz  bmkkh","Prmv ncawu","Rapfr qqvts","Kfwhgnmwac","Eqe tgykxmg","Dmxpchtn qm","Nr mgnqpyq","Sfdfgp ftfw","Fxdwrsfn", "Vdbrgupxnz"][~~(Math.random() * 12)]
                randomInterestsWithCT.splice(i, 0, {
                    interest_id: "gb-" + garbageInterestName + i,
                    interest_name: garbageInterestName + " " + i,
                    platform: "garbage"
                })
            }

            setInterestsToClassify(randomInterests)
            if(interestsToDisplay.length === 0){
                setInterestsToDisplay(randomInterests.slice(lastObjectPosition, lastObjectPosition + perPage))
                setLastObjectPosition(newToClassify.length < perPage ? newToClassify.length : perPage)
            }
        }
    }, [interests, interestsClassified, reasonsOfAds])

    const getNextInterests = () => {
        setInterestsToDisplay(currentInterests => {
            return [...currentInterests, ...interestsToClassify.slice(lastObjectPosition, lastObjectPosition + perPage)]
        })   
        setLastObjectPosition(currentValue => currentValue + perPage)
    }

    const interestClassifiedHandle = (isGargabe) => {
        let currentTime = new Date().getTime()
        const newInterestsTime = [...interestsTime]
        if(newInterestsTime.length === 12){
            newInterestsTime.shift() // remove first item of the array
            newInterestsTime.push({currentTime, isGargabe})
            const diff_array = []
            
            for(let i = 0; i < newInterestsTime.length - 1; i++){
                let diff = newInterestsTime[i + 1].currentTime - newInterestsTime[i].currentTime
                if(newInterestsTime.isGargabe){
                    diff = diff / 2
                }
                diff_array.push(diff)
            }
            const mean = diff_array.reduce((a,b) => a + b) / diff_array.length
            if(mean < 590){
                sendWarning()
                let newBlockTimes = blockedTimesSt === undefined ? 0 : blockedTimesSt
                let time_to_block_extension = 5 * (2**newBlockTimes) * (newBlockTimes + 1)
                if(time_to_block_extension < 30){
                    time_to_block_extension += 5
                }
                setBlockedTimesSt(newBlockTimes + 1)
                setBlockedTime((new Date()).getTime() + 1000 * (time_to_block_extension))
            }
        }else{
            newInterestsTime.push({currentTime, isGargabe})
        }
        setInterestsTime(newInterestsTime)
    }

    return(
        <div style={{width: "95%", margin: "auto", paddingBottom: 150,  maxWidth: "2000px"}}>


            {platformsToShow.length > 0 ?
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
                SOCIAL MEDIA USAGE FORM
            </Typography>
            <Item>
                <Grid style={{width: "95%", margin: "auto"}} container spacing={1.8} alignItems="center">
                {platformsToShow.map(platform => {
                    return(
                    <Grid item xs={12} sm={6} md={4} lg={3}>
                    <FormControl onChange={(e) => sendSocialMediaUsage(platform, e.target.value)}>
                        <FormLabel id="demo-radio-buttons-group-label">{platform === "Browser" ? "How frequently do you use this browser": "How frequently do you connect to " + platform}?</FormLabel>
                        <RadioGroup>
                            <FormControlLabel value="everyday" control={<Radio />} label="Everyday" />
                            <FormControlLabel value="everyweek" control={<Radio />} label="Everyweek" />
                            <FormControlLabel value="monthly" control={<Radio />} label="Once a month" />
                            <FormControlLabel value="not_in_six_month" control={<Radio />} label="Not used in the last 6 months" />
                        </RadioGroup>
                        </FormControl>
                    </Grid>
                    )
                })}
                </Grid>
            </Item>
            </>
            : ""}
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
                DEMOGRAPHIC DATA
            </Typography>
        <Grid style={{width: "95%", margin: "auto"}} container spacing={1.8}>
            {demographic.map((demo) =>
                <Interst key={demo.demographic_id} info={demo} isDemo={true} textHeaderMinHeight="41px"/>
            )}
        </Grid>
        <div style={{position: "relative"}}>
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
            AD INTERESTS ALREADY CLASSIFIED
        </Typography>

        <p style={{fontSize: 15}}>This information is updated once you have classified several new interests</p>
        {interestsClassified.length >= 10 ? (
        <>
            <Button style={{zIndex:0}} variant="contained"  onClick={() => setSearchParams({route: "classified_interests"})}>Show already classified items</Button>
            <div style={{position: "sticky", top: 60, zIndex: 1}}>
                
                <InterestSummary info={interestsClassified} smallVersion={false}/>

            </div>
        </>
        ): "Not enough classified interests"}

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
            AD INTERESTS TO CLASSIFY
        </Typography>
        {
            allowClassification ? 

        <InfiniteScroll
            dataLength={interestsToDisplay.length}
            next={getNextInterests}
            hasMore={lastObjectPosition < interestsToClassify.length}
        >
            <Grid style={{width: "95%", margin: "auto"}} container spacing={1.8}>   
                {interestsToDisplay.map((interest)=>{
                    return <Interst key={interest.interest_id} info={interest} isDemo={false} otherInterests={interestsToClassifyIndex[interest.interest_name]} classifiedCallback={(isGargabeClassified) => interestClassifiedHandle(isGargabeClassified)}/>
                })}
            </Grid>
        </InfiniteScroll>    :
        <div style={{margin: 20, padding: 30}}>
            <p>
                You need to collect 60 ads before starting to classify interests. 
            </p>
            <p>
                From those 60 ads, remember that you have to collect a minium of 10 ads per platform (as stated in the instructions, you need account in at least <b>two</b> platforms)
            </p>
        </div>
        }
        </div>
        </div>
    )

}

const Item = styled(Paper)(({ theme }) => ({
    backgroundColor: '#1A2027',
    ...theme.typography.body2,
    padding: theme.spacing(1),
    textAlign: 'center',
    color: "#ffffff",
  }));