import {useState, useEffect} from 'react'
import { useSearchParams } from 'react-router-dom';

export function VisualizeHTMLAd() {

    const [searchParams] = useSearchParams();
    const [timestamp, setTimestamp] = useState()
    
    const [adInfo, setAdInfo] = useState()

    useEffect(() => {
        setTimestamp(searchParams.get("timestamp"))
    }, [searchParams])

    useEffect(()=>{
        var db;
        var request = indexedDB.open("ads_db");

        if(!timestamp){
            return
        }

        request.onsuccess = function(event) {
            db = event.target.result;
            var transaction = db.transaction(["ads"]);
            var objectStore = transaction.objectStore("ads");
            var index = objectStore.index("timestamp");

            index.openCursor().onsuccess = function(event){
                if(event.target.result){
                    let ad = event.target.result.value
                    if((ad.timestamp + "" === timestamp + "") && ad.html){
                        setAdInfo(ad)
                    }
                    event.target.result.continue()
                }
            }
            
        };
    }, [timestamp])

    if(!adInfo){
        return <div>Ad not found</div>
    }else{

        
        document.open();
        document.write(adInfo.html.replaceAll('\\\\"','"').replaceAll("\\\\n","\n"));
        document.close()
    }
    
    return (null
      )
}