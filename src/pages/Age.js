import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {useChromeStorageLocal} from 'use-chrome-storage';
import Button from '@mui/material/Button';


export default function Age(){

    const [searchParams, setSearchParams] = useSearchParams();
    const [age, setAge] = useChromeStorageLocal("age_consent");


    function handleButton(response){
        setAge(response)
    }

    useEffect(()=>{
        if(age === "minor"){
            setSearchParams({route: "minor"})
        }else if(age === "adult"){
            setSearchParams({route: "terms"})
        }
    }, [age, setSearchParams])

    return(
        <div class="div_explanation">
        <h1>Are you an Adult?</h1>
        <p>
            Before using the extension we want to make sure that all of our
            volunteers are adults. Please, indicate if you are an adult.
            In case you are not, please uninstall the extension. The extension
            will not send any data to the Database until you finish the consent procedure.
        </p>
        <Button style={{margin: 10, color: "white", fontWeight: 600}} variant="contained" color="success" id="submit_button_adult" type="button"  className="button_submit" onClick={() => handleButton("adult")}>
          I AM AN ADULT!
        </Button>
        <Button style={{margin: 10, color: "white", fontWeight: 600}} variant="contained" color="error" id="submit_button_minor" type="button" className="button_submit_not_agree" onClick={() => handleButton("minor")}>
          I AM A MINOR!
        </Button>
      </div>
    )
}
