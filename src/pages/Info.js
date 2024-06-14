import { useEffect, useState } from 'react';

import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoIcon from '@mui/icons-material/Info';
import {getUserInfo, checkTaskRequirements} from '../utils/dbConnector'
import {useChromeStorageLocal} from 'use-chrome-storage';


export default function Info(){

    const [expanded, setExpanded] = useState(false);
    const [info, setInfo] = useState();
    const [completionCode, setCompletionCode] = useState();
    const [demo, setDemographic] = useChromeStorageLocal("demographic_info");

    const handleChange = (panel) => (event, isExpanded) => {
      setExpanded(isExpanded ? panel : false);
    };

    useEffect(() =>{
        getUserInfo().then(newInfo =>{
            setInfo(newInfo)
        })
    }, [])

    useEffect(() => {
        if(demo && demo.registrationID){
            checkTaskRequirements().then(info => {
                if(info.completed){
                    setCompletionCode(info.code)
                }
            })
        }
    }, [demo])

    const information = [
        {
            title: "Purpose of the extension",
            subtitle: "Why are we collecting Ad data",
            text: <>
                    <p>The goal of this research project is willing to understand how accurate are the profiles Big. Tech companies create from users. In particular, we focus on the following companies: Facebook, Twitter, LinkedIn and Google. The way these companies operate is creating a profile for a user based on the activity of this user assigning them demographic information (e.g., gender, age, location, etc,), interests (e.g., soccer, music, Italian food, etc.) and other elements. The referred companies allow advertisers to run ad campaigns targeting specific profiles defined by the advertiser. Our research projects aims to use advance research techniques to quantify how accurate the profiles created by Big. Tech companies are. This will allow us answering questions like: Do BigTech companies assign users an reasonable number of interests or instead they assign a very large number of interests beyond what an actual human being can cope with? The interests assigned are actually relevant for the users or in fact they are not aligned to what users are interested in? etc. </p>
                    <p>To run this project we will have to collect the interests the four referred companies assign to users. To this end we have developed a web browser add on that implements this task. The web browser add on will operate only upon the user provide an explicit consent by accepting these terms of use. </p>
                    <p>The data collected for this of this research project is limited to research purposes and will not be used for commercial purposes.</p> 
                  </>
        },
        {
            title: "Interests",
            subtitle: "How are the interests added",
            text: "Platforms add interests based on different aspects, such as your behaviour using the site (e.g., when you click on a specific post), your search history, pages and apps you use, people you follow. Then this interests are used by advertisers to reach you. We access to your interests from Google, LinkedIn, Twitter and Facebook, and they are available in the Interests tab",
        },
        {
            title: "Browsing topics",
            subtitle: "Topics inferred from your browsing history",
            text: "Browsings topics are inferred from the websistes you had visited in the previous weeks. These topics will replace interests, to be less specific, with the goal to improve privacy. By Q3 2023, the new Privacy Sandbox APIs will be fully available in Chrome, then the next year, thrid-party cookies will be disabled."
        },
        {
            title: "Demographic data",
            subtitle: "Demographic data that is assigned to your profile",
            text: "Some platforms (e.g., Google) estimate some of your demographic info (age, gender), which later could be use to target ads to you. We access this information and display it in the Interest tab",
        },
        {
            title: "Valuation and rating of interests and demographic data",
            subtitle: "Information about valuations and ratings",
            text: <span>In the <i>INTERESTS</i> tab from the navbar you can visualize the Interts and Demographic data that the different platforms have assigned to you. The demographic data can be classified whether they are true or not. The interests can be classified in a scale from 1 to 5 stars (being 1 not relevant, 5 very relevant for you). After classifying some interests some information about the interests will be displayed, as the average rating of each platform. The platform where the interest was collected will be only shown in a different screen (which is accessible by the <i>SHOW ALREADY CLASSIFIED ITEMS</i> button), to avoid bias while classifying interests..</span>,
        },
        {
            title: "Ads collected",
            subtitle: "What information is collected",
            text: <Typography style={{display: 'flex', alignItems: 'center', flexWrap: 'wrap'}}>The extension will collect information from Google, LinkedIn, Twitter and Facebook ads. The extension will identify that an ad was loaded, and then save some information such as who is the author of the ad, which landing page it has, when was the ad shown, image and text related to the ad and why the ad was show to you. You can visualize the ads we have collected in the <i>ADS COLLECTED</i> tab from the navbar. From each ad you can see more details if you click in the info button (<InfoIcon/>)</Typography>
        },
        {
            title: "Rate and classify ads",
            subtitle: "Classify Ads tab",
            text: "In the Classify Ads tab some of the ads you have seen will be shown to you. In this screen you can rate how of accurate the targeting of the ad was performed, and whether or not you remember in which platform the ad was shown to you.",
        },
        {
            title: "Your info",
            subtitle: "Information",
            text: info ? <div>
            {
                completionCode &&
                <div style={{fontSize: "1.1rem"}}>
                    <b>Completion Code</b>: {completionCode}
                </div>
            }
            <div>
                User id: {info.userID}
            </div>
            {demo && demo.registrationID &&
                <div>
                    Registration ID: {demo.registrationID}
                </div>
            }
            <div>
                Ads collected: {info.ads}
            </div>
            <div>
                Ads classified: {info.classified_ads}
            </div>
            <div>
                Interests collected: {info.interests}
            </div>
            <div>
                Interests classified: {info.classified_interests}
        
            </div>
            </div> : "Loading"
        }
    ]
  
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
                INFORMATION
            </Typography>
        <div style={{maxWidth: "90%",margin: "auto", marginBottom: "20px"}}>

        {information.map((infoElement, index) => {
            return (
                <Accordion expanded={expanded === index} onChange={handleChange(index)}>
                    <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    >
                    <Typography sx={{ width: '45%', flexShrink: 0 }}>
                        <b>{infoElement.title}</b>
                    </Typography>
                    <Typography sx={{ color: 'text.secondary' }}>{infoElement.subtitle}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                    <Typography align="justify">
                    <div style={{maxWidth: "95%",margin: "auto", paddingLeft: "20px"}}>
                        {infoElement.text}
                    </div>
                    </Typography>
                    </AccordionDetails>
                </Accordion>
            )
        })}
        </div>
    </>
    )

}