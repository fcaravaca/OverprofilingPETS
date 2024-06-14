import Button from '@mui/material/Button';

import TwitterIcon from '@mui/icons-material/Twitter';
import FacebookIcon from '@mui/icons-material/Facebook';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import IconButton from '@mui/material/IconButton';
import GoogleIcon from '@mui/icons-material/Google';
import YouTubeIcon from '@mui/icons-material/YouTube';


import { useState, useEffect } from 'react';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card'

import {SERVER_ADDRESS, sendAdValoration} from '../utils/dbConnector'

import { ThemeProvider, createTheme } from '@mui/material/styles';
import FiveStarClassification from './FiveStarClassification';
const theme = createTheme({
    palette: {
      secondary: {
        main: '#636362'
      }
    }
});

export default function AdToClassify({adToDisplay, classifiedCallback}){

    const [selectedPlatform, setSelectedPlatform] = useState(undefined)
    const [surveyResult, setSurveyResult] = useState(undefined)
    const [allowShowPlatform, setAllowShowPlatform] = useState(false)

    useEffect(()=>{
        if(surveyResult !== undefined || selectedPlatform !== undefined){
            sendAdValoration({...adToDisplay, guessed_platform: selectedPlatform, valoration: surveyResult})
        }
    }, [surveyResult, selectedPlatform])

    if(!adToDisplay){
        return undefined
    }

    let image_url = undefined

    if(adToDisplay.image_file){
        image_url = SERVER_ADDRESS + adToDisplay.image_file
    }

    if(adToDisplay.image_base64_url){
        image_url = adToDisplay.image_base64_url
    }

    return(
        <Card sx={{backgroundColor: "#20232A", color: "white", marginTop: 0, marginBottom: 3, padding: 5, paddingBottom: 1, boxShadow: "5px 2px 2px 2px black"}}>
            <Grid container spacing={3} direction="row" alignItems="center" justifyContent="center">
                <Grid item xs={12} md={8}>

                        <img style={{maxHeight: "300px", maxWidth: "80%", marginBottom: "8px"}} src={image_url}/>
                        <p style={{fontSize: "1.15rem", width: "90%", margin:"auto"}}>{adToDisplay.author}{adToDisplay.text ? ": " + adToDisplay.text.split("https://t.co/")[0].split("https://lnkd.in/")[0] : ""}</p>
                </Grid>

                <Grid item xs={12} md={4} onMouseLeave={() => {
                    if(selectedPlatform && surveyResult && !allowShowPlatform){ // The allowShowPlatform is to avoid to trigger the callback more than once
                        setAllowShowPlatform(true)
                        classifiedCallback({...adToDisplay, guessed_platform: selectedPlatform, valoration: surveyResult})
                    }}}>
                <Grid container spacing={3} direction="column" alignItems="center" justifyContent="center" style={{fontSize: "1.33rem"}}>
                    <Grid item xs={12} md={6}>
                        <>
                            <div>In which platform do you think that the AD was shown to you?</div>
                            <p style={{margin: 0, padding: 0, fontSize: 14}}>If you haven't seen this ad, or don't remember where it comes from, please use the button of "Not seen - don't remember"</p>
                            <SelectPlatform callback={(platform) => setSelectedPlatform(platform)} blocked={allowShowPlatform}/>
                            <div style={{minHeight: "35px"}}>
                                {selectedPlatform !== undefined && surveyResult !== undefined && allowShowPlatform ? "This ad was collected in " + adToDisplay.platform : ""}
                            </div>
                        </>
                    </Grid>
                    <Grid item xs={12} md={6}>
                    <div>Classify the ad from 1 (not interested / not relevant ad) to 5 (interested / relevant)</div>
                        <p>
                            <FiveStarClassification valoration={adToDisplay.valoration} callback={(num) => setSurveyResult(num)} blocked={allowShowPlatform}/>
                        </p>
                    </Grid>
                </Grid>
                </Grid>
            </Grid>
        </Card>
    )
}

function SelectPlatform({callback, blocked}){

    const [selectedPlatform, setSelectedPlatform] = useState(null)

    const handleSelection = (platform) => {
        if(!blocked){
            callback(platform)
            setSelectedPlatform(platform)
        }
    }

    useEffect(() => {
        if(!blocked){
            setSelectedPlatform(null)
        }
    }, [blocked])


    return(
        <div>
        <IconButton style={{margin: 11, marginBottom: 4, color: selectedPlatform === "twitter" ? "rgb(2, 136, 209)" :"white"}} onClick={() => handleSelection("twitter")}>
            <TwitterIcon style={{fontSize: 40}}/>  
        </IconButton>

        <IconButton style={{margin: 11, marginBottom: 4, color: selectedPlatform === "facebook" ? "rgb(2, 136, 209)" :"white"}} onClick={() => handleSelection("facebook")}>
            <FacebookIcon style={{fontSize: 40}}/>  
        </IconButton>

        <IconButton style={{margin: 11, marginBottom: 4, color: selectedPlatform === "linkedin" ? "rgb(2, 136, 209)" :"white"}} onClick={() => handleSelection("linkedin")}>
            <LinkedInIcon style={{fontSize: 40}}/>  
        </IconButton>

        <IconButton style={{margin: 11, marginBottom: 4, color: selectedPlatform === "google" ? "rgb(2, 136, 209)" :"white"}} onClick={() => handleSelection("google")}>
            <GoogleIcon style={{fontSize: 40}}/>  
        </IconButton>

        <IconButton style={{margin: 11, marginBottom: 4, color: selectedPlatform === "youtube" ? "rgb(2, 136, 209)" : "white"}} onClick={() => handleSelection("youtube")}>
            <YouTubeIcon style={{fontSize: 40}}/>
        </IconButton>
        <ThemeProvider theme={theme}>
            <>
                <Button color={selectedPlatform === "no platform" ? "info" : "secondary"}
                variant="contained" 
                onClick={() => handleSelection("no platform")}>Not seen - Don't remember</Button>
            </>
        </ThemeProvider>
        </div>
    )


}

