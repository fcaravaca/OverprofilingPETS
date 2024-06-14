import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import Grid from '@mui/material/Grid';
import ReplayIcon from '@mui/icons-material/Replay';

import { useState, useEffect } from 'react';


export default function FiveStarClassification({valoration, callback, blocked}){

    const [hoverValue, setHoverValue] = useState(valoration || 0)
    const [fixed, setFixed] = useState(valoration ? true : false) //Fixed indicates whether the user has already classify an interest
    const [revertButton, setRevertButton] = useState(false)

    useEffect(()=>{
        if((!valoration) && fixed === true){
            callback(hoverValue)
            setRevertButton(true)
        }
    }, [fixed, valoration, hoverValue])

    useEffect(()=>{
        if(blocked){
            setFixed(true)
            setRevertButton(false)
        }
    }, [blocked])

    return(
        <div onMouseLeave={() => fixed ? null : setHoverValue(null)} style={{width: "100%", paddingTop: 3}}>
        <Grid style={{width: "95%", margin: "auto"}} container spacing={0}>
           <Grid item xs={1}></Grid>
           <Grid item xs={10}>
               <span onMouseLeave={() => fixed ? null : setHoverValue(null)}>
                   <InterestStar value={1} hoverValue={hoverValue} setHoverValue={setHoverValue} setFixed={setFixed} fixed={fixed}/>
                   <InterestStar value={2} hoverValue={hoverValue} setHoverValue={setHoverValue} setFixed={setFixed} fixed={fixed}/>
                   <InterestStar value={3} hoverValue={hoverValue} setHoverValue={setHoverValue} setFixed={setFixed} fixed={fixed}/>
                   <InterestStar value={4} hoverValue={hoverValue} setHoverValue={setHoverValue} setFixed={setFixed} fixed={fixed}/>
                   <InterestStar value={5} hoverValue={hoverValue} setHoverValue={setHoverValue} setFixed={setFixed} fixed={fixed}/>
               </span>
           </Grid>
           <Grid item xs={1}>
               {revertButton ? 
                   <ReplayIcon onClick={() => {setFixed(false); setRevertButton(false); callback(null); setHoverValue(0)}}></ReplayIcon> : ""
               }
           </Grid>
        </Grid>
       </div>
    )
}


function InterestStar({value, hoverValue, setHoverValue, setFixed, fixed}){
    if(fixed){
        return(
            <span>
                {hoverValue >= value ? <StarIcon sx={{color:"#e3bf0b"}}/> : <StarBorderIcon/>}
            </span>
        )
    }else{
        return (
            <span onMouseEnter={() => setHoverValue(value)}
              onClick={() => setFixed(true)}
            >
                {hoverValue >= value ? <StarIcon color="primary"/> : <StarBorderIcon/>}
            </span>
        )
    }
}