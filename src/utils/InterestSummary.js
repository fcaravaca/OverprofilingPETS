import { useEffect, useState } from "react"
import Stack from '@mui/material/Stack';
import PlatformIcon from "./PlatformIcon";

import Card from "@mui/material/Card";
import Button from "@mui/material/Button"
import InterestsBoxPlot from '../charts/InterestsBoxPlot'
import Tooltip from '@mui/material/Tooltip';
import Badge from '@mui/material/Badge';

import '../App.css'

export default function InterestSummary({info, smallVersion}){

    const [infoObject, setInfoObject] = useState({})
    const [boxPlotInfo, setBoxPlotInfo] = useState({})
    const [showBoxPlot, setShowBoxPlot] = useState(false)

    useEffect(()=>{

        const dummyObject = {}
        const platforms = []
        const summaryObject = {}
        const valorations = {}
        const boxPlot = {data:[]}

        info.forEach((interest) =>{
            dummyObject[interest.platform] = (dummyObject[interest.platform] || 0) + interest.valoration
            dummyObject[interest.platform + "-amount"] = (dummyObject[interest.platform + "-amount"] || 0) + 1

            if(valorations[interest.platform]){
                valorations[interest.platform].push(interest.valoration)
            }else{
                valorations[interest.platform] = [interest.valoration]
            }

            if(!platforms.includes(interest.platform)){
                platforms.push(interest.platform)
            }
        })

        platforms.forEach((platform) =>{
            summaryObject[platform] = Math.round( dummyObject[platform] / dummyObject[platform + "-amount"] * 100) / 100
            boxPlot.data.push(valorations[platform])
        })

        boxPlot.platforms = platforms
        setBoxPlotInfo(boxPlot)
        setInfoObject(summaryObject)


    }, [info])



    return(
        <div style={{backgroundColor:"#353a42", fontSize:"1.4rem", paddingBottom: "2px", paddingTop: "2px"}}>
        <Card sx={{width: "80%", backgroundColor: "#1A2027", color: "white", margin: "auto", marginBottom: "10px", marginTop: "10px", padding: "10px"}}>
        <div style={{marginBottom: 5}}>Score of each platform</div>
        <Stack style={{width: "95%", margin: "auto", marginBottom: 5}} direction="row" alignItems="center" justifyContent="space-around" gap={0}>
            {Object.keys(infoObject).map((platform) =>{
                return(
                   
                    <div style={{width: "25%",  marginBottom: 24}}>
                        <div>
                        <Stack direction="row" alignItems="center" justifyContent="center" key={platform} spacing={2}> 
                            <Badge badgeContent={boxPlotInfo.data !== undefined ? <Tooltip arrow title={"You have classified " + boxPlotInfo.data[boxPlotInfo.platforms.indexOf(platform)].length + " interests from " + platform.charAt(0).toUpperCase() + platform.slice(1)}><span>{boxPlotInfo.data[boxPlotInfo.platforms.indexOf(platform)].length}</span></Tooltip> : 0} color="primary" anchorOrigin={{ vertical: 'bottom',horizontal: 'right'}}>
                                <PlatformIcon platform={platform}/>
                            </Badge> 
                                
                            <span className="hideTextSmallWidth">{platform.charAt(0).toUpperCase() + platform.slice(1) + ": "}</span> {infoObject[platform]}
                        </Stack>
                        </div>
                    </div>
                )
            })}
        </Stack>
        {smallVersion === false && showBoxPlot === true &&
            <>
                <Button variant="contained" onClick = {() => setShowBoxPlot(false)}>Hide</Button>
                <InterestsBoxPlot info={boxPlotInfo}/>
            </>
        }
        {smallVersion === false && showBoxPlot === false &&
            <Button variant="contained" onClick = {() => setShowBoxPlot(true)}> Show score distribution</Button>
        } 
        </Card>
        </div>
    )


}