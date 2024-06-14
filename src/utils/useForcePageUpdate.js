
import {useState, useEffect} from 'react'

export default function useForcePageUpdate(delay){

    const [value, setValue] = useState(0)
    const [customInterval, setCustomInterval] = useState()
    useEffect(()=>{
        if(customInterval !== undefined){
            clearInterval(customInterval)
        }

        setCustomInterval(
            setInterval(()=>{
                setValue((prev) => prev + 1)
            }, delay)
        )
    }, [delay])

    return value
}