import Grid from '@mui/material/Grid';

import { styled } from '@mui/material/styles';
import Paper from '@mui/material/Paper';

import Divider from '@mui/material/Divider';
import {useState, useEffect} from 'react'
import Button from '@mui/material/Button';
import FiveStarClassification from './FiveStarClassification';

import PlatformIcon from './PlatformIcon'
import Stack from '@mui/material/Stack';
import { sendInterestToServerDB, sendDemographicToServerDB } from './dbConnector'
import ReplayIcon from '@mui/icons-material/Replay';

const Item = styled(Paper)(({ theme }) => ({
    backgroundColor: '#1A2027',
    ...theme.typography.body2,
    padding: theme.spacing(1),
    textAlign: 'center',
    color: "#ffffff",
  }));
  

const CustomDivider = styled(Divider)(({ theme }) => ({
    backgroundColor: 'rgba(242, 239, 240, 0.49)',
    ...theme.typography.body2,
    color: "#ffffff",
    borderBottomWidth: 0.1
  }));

export default function Interst({info, isDemo, textHeaderMinHeight="10px", otherInterests, classifiedCallback}){

    return(
        <Grid item xs={12} sm={6} md={4} lg={3} style={{paddingTop: 0, paddingBottom: 14}}><Item>
        <Stack divider={<CustomDivider variant="fullWidth" flexItem light={false}/>} alignItems="center" justifyContent="center" gap={0.5}>
        <div>
        <Stack  style={{minHeight: textHeaderMinHeight}} direction="row" alignItems="center" justifyContent="center" gap={0.5}>
            {info.valoration ? <PlatformIcon platform={info.platform}/> : ""}
        {isDemo ? (info.demographic_name + ": " + info.value) : info.interest_name}
        </Stack>
        </div>
        <InterestValoration info={info} isDemo={isDemo} otherInterests={otherInterests} classifiedCallback={classifiedCallback}/>
        </Stack>
        </Item></Grid>
    )
}


function InterestValoration({info, isDemo, otherInterests, classifiedCallback}){

    const [hoverValue, setHoverValue] = useState(info.valoration || 0)
    const [fixed, setFixed] = useState(info.valoration ? true : false) //Fixed indicates whether the user has already classify an interest

    useEffect(()=>{
        if(!info.valoration && fixed === true){
            updateValoration(info, hoverValue, isDemo)
            if(hoverValue !== null && !isDemo){
                classifiedCallback(info.platform === "garbage" && hoverValue > 1)
            }
            if(otherInterests){
                for(var otherInterest of otherInterests){
                    updateValoration(otherInterest, hoverValue, isDemo)
                }
            }
        }
    }, [fixed, info, hoverValue, isDemo])
    
    if(isDemo){
        if(fixed){
            if(!info.valoration){
                return <><div>Your answer: {hoverValue}</div> <Stack direction="row" alignItems="center" gap={0.5}>Change response <ReplayIcon onClick={() => {setHoverValue(undefined); setTimeout(()=>setFixed(false), 5)}}/></Stack></>
            }else{
                return <span>Your answer: {info.valoration}</span>
            }
        }
        return(
            <span>
                <Button variant="contained" color="error" sx={{marginRight: 1, color: "white", fontWeight: 600}} onClick={() => {setFixed(true); setHoverValue("no")}}>No</Button>
                <Button variant="contained" color="success" sx={{color: "white", fontWeight: 600}} onClick={() => {setFixed(true); setHoverValue("yes")}}>yes</Button>
            </span>
        )
    }

    return(
         <FiveStarClassification valoration={info.valoration} 
            callback={(num) => {
                setHoverValue(num);
                setFixed(true)
            }}
        />
    )
}

function updateValoration(info, valoration, isDemo){
    var newInfo = {...info, received: false} //Change this if you want to show the platform just after selecting it
    newInfo.valoration = valoration

    if(valoration === undefined){
        delete newInfo.valoration
    }

    var request = indexedDB.open("ads_db");
    request.onsuccess = function(event) {
        var db = event.target.result;
        var objectStore = !isDemo ? db.transaction(["interests"], "readwrite").objectStore("interests")
                                  : db.transaction(["demographic_data"], "readwrite").objectStore("demographic_data")
        objectStore.put(newInfo)
        if(!isDemo){
            sendInterestToServerDB(newInfo)
        }else{
            sendDemographicToServerDB(newInfo)
        }
    };

}
