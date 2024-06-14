

import ToggleButton  from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'

import { useState, useEffect } from 'react';

export default function Survey({callback, blocked}) {


    const [selectedValue, setSeletectedValue] = useState(0)

    const handleSelection = (event, selection) => {
        if(!blocked){

            console.log(selection)
            setSeletectedValue(selection)
            callback(selection)
        }
    }

    useEffect(() => {
        if(!blocked){
            setSeletectedValue(0)
        }
    }, [blocked])

   /* const updateDB = (adValoration) => {
        var db;
        var request = indexedDB.open("ads_db");
        request.onsuccess = function(event) {
            console.log(event)
            db = event.target.result;
            var objectStore = db.transaction(["ads"], "readwrite").objectStore("ads");
            ad.valoration = adValoration;

            objectStore.put(ad)
            
        };
    }*/


    return(
        <>
            <ToggleButtonGroup value={selectedValue} style={{maxHeight: "44px", width:"clamp(200px,70%,800px)", marginBottom: 20}} variant="containt" exclusive
                onChange={handleSelection}>
                <ToggleButton style={{width: "100%", border: "0.3px solid black", backgroundColor: "#941F05", fontWeight: 900, color: "white", opacity: selectedValue === "1" ? 1 : 0.6, fontSize: "1.3rem"}} value="1">1</ToggleButton>
                <ToggleButton style={{width: "100%", border: "0.3px solid black", backgroundColor: "#BB2424", fontWeight: 900, color: "white", opacity: selectedValue === "2" ? 1 : 0.6, fontSize: "1.3rem"}} value="2">2</ToggleButton>
                <ToggleButton style={{width: "100%", border: "0.3px solid black", backgroundColor: "#FFC300", fontWeight: 900, color: "white", opacity: selectedValue === "3" ? 1 : 0.6, fontSize: "1.3rem"}} value="3">3</ToggleButton>
                <ToggleButton style={{width: "100%", border: "0.3px solid black", backgroundColor: "#98D131", fontWeight: 900, color: "white", opacity: selectedValue === "4" ? 1 : 0.6, fontSize: "1.3rem"}} value="4">4</ToggleButton>
                <ToggleButton style={{width: "100%", border: "0.3px solid black", backgroundColor: "#6FA70A", fontWeight: 900, color: "white", opacity: selectedValue === "5" ? 1 : 0.6, fontSize: "1.3rem"}} value="5">5</ToggleButton>
            </ToggleButtonGroup>
        </>
    )

}