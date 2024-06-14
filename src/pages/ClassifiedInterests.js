
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack'
import { useState, useEffect } from 'react';

import InterestSummary from '../utils/InterestSummary'
import Interst from '../utils/Interst'
import PlatformIcon from '../utils/PlatformIcon';

export default function Interests(){


    const [interests, setInterests] = useState([])
    const [interestsClassified, setInterestsClassified] = useState([])
    const [ascendentSort, setAscendentSort] = useState(true)
    const [sorted, setSorted] = useState(false)
    const [gridElements, setGridElements] = useState([])
    const [relevantValue, setRelevantValue] = useState("valoration")
    
    useEffect(()=>{
        var db;
        var request = indexedDB.open("ads_db");

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
        };
    }, [])


    useEffect(()=>{
        const newClassified = []
        interests.forEach((interest) =>{
            if(interest.valoration){
                newClassified.push(interest)
            }
        })
        setInterestsClassified(newClassified)
        
    }, [interests])

    const classifyByRating = () => {
        if(interestsClassified.length > 0){
            let interests_copy = interestsClassified.sort((a,b) => (b.valoration - a.valoration)*(ascendentSort ? 1 : -1))
            setInterestsClassified([...interests_copy])
            setAscendentSort(!ascendentSort)
            setRelevantValue("valoration")
            setSorted(true)
        }
    }

    const classifyByPlatform = () => {
        if(interestsClassified.length > 0){
            let interests_copy = interestsClassified.sort((a,b) => b.platform.localeCompare(a.platform)*(ascendentSort ? 1 : -1))
            setInterestsClassified([...interests_copy])
            setAscendentSort(!ascendentSort)
            setRelevantValue("platform")
            setSorted(true)
        }
    }

    useEffect(() => {

        let new_grid
        if(sorted){
            console.log("update", interestsClassified)
            var prev_relevant_value = undefined
            let containers = {}
            const keys = []
            interestsClassified.forEach((interest)=>{
                if(interest[relevantValue] !== prev_relevant_value){
                    prev_relevant_value = interest[relevantValue]
                    containers[interest[relevantValue]] = []
                    keys.push(interest[relevantValue])
                }  
                containers[interest[relevantValue]].push(
                    <Interst key={interest.interest_id} info={interest} isDemo={false}/>    
                )
            })

            new_grid = keys.map((container_v) =>{
                let title = ""
                if(relevantValue === "platform"){
                    title = <Stack direction="row" alignItems="center" justifyContent="center" gap={0.2}> 
                    <PlatformIcon platform={container_v}/>{capitalizeFirstLetter(container_v)+":"}</Stack>
                }
                if(relevantValue === "valoration"){
                    title = container_v + " stars:"
                }

                return <>
                <h4 style={{margin: 0, marginTop: 2}}>{title}</h4>
                <div style={{fontSize: 16}}>{containers[container_v].length} interests</div>
                <Grid container key={container_v} spacing={1.8} style={{width: "95%", margin: "auto", marginBottom: 12}}>
                    {containers[container_v]}
                </Grid>
                </>
            })


        }else{

            new_grid = 
                <Grid container spacing={1.8} style={{width: "95%", margin: "auto"}}>
                {interestsClassified.map((interest)=>{
                    return  <Interst key={interest.interest_id} info={interest} isDemo={false}/>    
                })}
            </Grid>
            
        }
        setGridElements(new_grid)

    }, [interestsClassified, sorted, ascendentSort])

    return(
        <div style={{width: "95%", margin: "auto", paddingBottom: 150, margin: "auto", paddingBottom: 150,  maxWidth: "2000px"}}>
        <div style={{position: "relative"}}>


        <h4>Ad interests already classified</h4>
        {interestsClassified.length >= 10 ? (
        <>
            <p style={{fontSize: 23, padding: 1, margin: 8}}>You have classified {interestsClassified.length} interests</p>
            <div style={{position: "sticky", top: 60, zIndex: 1}}>
                
                <InterestSummary info={interestsClassified} smallVersion={false}/>

            </div>
            
            <div>
                <Button sx={{margin: 2}} variant='contained' onClick={() => classifyByRating()}>Classify by rating</Button>
                <Button sx={{margin: 2}} variant='contained' onClick={() => classifyByPlatform()}>Classify by platform</Button>
            </div>
          
                   
                {gridElements}
        </>
        ): "Not enough classified interests"}
        </div>
        </div>
    )

}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
  