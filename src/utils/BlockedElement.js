import CircularProgress from '@mui/material/CircularProgress';
import Backdrop from '@mui/material/Backdrop';
import Stack from '@mui/material/Stack'

import {useEffect, useState} from 'react'

export default function BlockElement({ blocked, blockedTime }){

    const [timer, setTimer] = useState()

    useEffect(() => {
        setTimer(Math.ceil((blockedTime - (new Date()).getTime()) / 1000))
        const interval = setInterval(() => {
            setTimer(timer => timer - 1)
        }, 1000)
        return () => clearInterval(interval)
    }, [blockedTime])

    function formatTime(num) {
        var minutes = Math.floor(num / 60);
        var seconds = num % 60;
        return (minutes < 10 ? "0" + minutes : minutes) + ":" + (seconds < 10 ? "0" + seconds : seconds);
    }

    return (
        <Backdrop
            sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
            open={blocked}
        >
            <div style={{background: "#99999977", padding: "10px"}}>

            <p><b>You have classified too many interests in a very short time. This will be reported</b></p>
            <Stack alignItems={"center"}> 
            <b>Wait  until the extension unlocks {formatTime(timer)}</b> <CircularProgress></CircularProgress>
            </Stack>
            </div>
        </Backdrop>
    )
}