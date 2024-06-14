// React & hooks
import { useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';

// Stylesheets
import './App.css';

// Pages
import Home from './pages/Home'
import Age from './pages/Age'
import AgeMinor from './pages/AgeMinor'
import Terms from './pages/Terms'
import TermsDeny from './pages/TermsDeny'
import Interests from './pages/Interests';
import DemographicData from './pages/DemographicData'

import SmallNavBar from './utils/NavBar'
import AllAds from './pages/AllAds';
import ClassifiedInterests from './pages/ClassifiedInterests'
import ClassifyAd from './pages/ClassifyAd'
import { VisualizeHTMLAd } from './pages/VisualizeHTMLAd';
import {useChromeStorageLocal} from 'use-chrome-storage';
import Info from './pages/Info';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import BlockElement from './utils/BlockedElement';
import {useBlockedExtensionHook} from './utils/useBlockedExtensionHook'


function App() {


  const [elementToDisplay, setElementToDisplay] = useState(<Home/>)
  const [alternativeHeader, setAlternativeHeader] = useState(true)
  const [searchParams, setSearchParams] = useSearchParams();
  const [demo] = useChromeStorageLocal("demographic_info");
  const [terms] = useChromeStorageLocal("terms")

  //const [blockedTime] = useChromeStorageLocal("blocked_time")
  const [blockedTime] = useBlockedExtensionHook();
  const [extensionBlocked, setExtensionBlocked] = useState(false)

  useEffect(() => {
    console.log(blockedTime)
    if(!blockedTime){
      return;
    }
    const diff_time = blockedTime - (new Date()).getTime()
    console.log(diff_time)
    
    if(blockedTime > 500){
      setExtensionBlocked(true);
      setTimeout(() => {
        setExtensionBlocked(false);
      }, diff_time)
    } 
  }, [blockedTime])

  useEffect(()=>{

      // The user hasn't complete the Age/Terms/Demographic data form

    if((!searchParams.get("route") || searchParams.get("route")==="") && (demo === undefined || terms !== "agree")){
      console.log(demo === undefined,terms !== "agree",searchParams.get("route") ,searchParams.get("route")==="")
      setElementToDisplay(<Button sx={{width: "80%", margin: "auto", my:1}} variant="contained" onClick={() => window.open("/popup.html?route=age_verification", '_blank').focus()}>Complete the register</Button>)
      return;
    }

    switch(searchParams.get("route")){

      case "home":
        setElementToDisplay(<Home/>)
        break;
      case "age_verification":
        setElementToDisplay(<Age/>)
        break;
      case "minor":
        setElementToDisplay(<AgeMinor/>)
        break;
      case "terms":
        setElementToDisplay(<Terms/>)
        break;
      case "terms_deny":
        setElementToDisplay(<TermsDeny/>)
        break;
      case "demographic_data":
        setElementToDisplay(<DemographicData/>)
        break;
      case "interests":
          setElementToDisplay(<div style={{minHeight: "100vh"}}><SmallNavBar/><Interests/></div>)
          setAlternativeHeader(false)
          break;
      case "classified_interests":
        setElementToDisplay(<div style={{minHeight: "100vh"}}><SmallNavBar/><ClassifiedInterests/></div>)
        setAlternativeHeader(false)
        break;
      case "ads":
        setElementToDisplay(<div style={{minHeight: "100vh"}}><SmallNavBar/><AllAds/></div>)
        setAlternativeHeader(false)
        break;
      case "classify_ad":
        setElementToDisplay(<div style={{minHeight: "100vh"}}><SmallNavBar/><ClassifyAd/></div>)
        setAlternativeHeader(false)
        break;
      case "info":
        setElementToDisplay(<div style={{minHeight: "100vh"}}><SmallNavBar/><Info/></div>)
        setAlternativeHeader(false)
        break;
      default:
        setElementToDisplay(<Home/>)
        break;
      
    }

  }, [searchParams, demo, terms])

  if(searchParams.get("route") === "visualize_ad"){
    return(
      <div><VisualizeHTMLAd/></div>
    )
  }

  return (
    <div className="App"  style={{minWidth: "200px"}}>
      <BlockElement blocked={extensionBlocked} blockedTime={blockedTime}/>
      {alternativeHeader &&
        <header className="App-header">
        <img src="images/logo_128.png" alt="logo" style={{borderRadius: 5, marginTop: 4}}/>
        <p style={{margin: 3}}>
        <Typography
            variant="h6"
            noWrap
            sx={{
            mx: 1,
            fontFamily: 'monospace',
            fontWeight: 700,
            letterSpacing: '.1rem',
            color: 'inherit',
            textDecoration: 'none',
            alignItems: 'center'
            }}
        >
            OVERPROFILING
        </Typography>
        </p>
      </header>
      }
      <div className="App-body">

        {elementToDisplay}

      </div>
    </div>

  );
}

export default App;
