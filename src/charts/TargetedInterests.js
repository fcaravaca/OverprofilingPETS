import { useEffect, useState, useRef } from "react"

import { CategoryScale, Chart, Tooltip, Legend, BarController, ArcElement } from "chart.js";
import autocolors from 'chartjs-plugin-autocolors';
import Switch from "@mui/material/Switch";
import Button from '@mui/material/Button';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import FormControlLabel from "@mui/material/FormControlLabel";
Chart.register(CategoryScale, Tooltip, Legend, BarController, ArcElement, autocolors);

export default function TargetedInterests({rawInfo, interests, generalReasons}){

    const chartContainer = useRef(null);
    const [chartInstance, setChartInstance] = useState(undefined);
    const [mode, setMode] = useState(false)

    const [page, setPage] = useState(0)
    const maxPerPage = 20

    const handlePrev = () => {
        if(page > 0)
        setPage(prev => prev - 1)
    }
    const handlePost = () => {
        setPage(prev => prev + 1)
    }

    useEffect(() => {
        if(chartInstance !== undefined) {
            chartInstance.destroy()
        }
        if (chartContainer && chartContainer.current) {


            
            let chart = new Chart(chartContainer.current, {
                type: "bar",
                data: {
                    labels: (mode ? generalReasons : interests).slice(maxPerPage * page, maxPerPage * (page + 1)).map(r => r[0]),
                    datasets: [
                        {
                            label: "Times used to target you",
                            data: (mode ? generalReasons : interests).slice(maxPerPage * page, maxPerPage * (page + 1)).map(r => r[1]),
                            borderColor: "#3f50b5",
                            backgroundColor: "#3f50b5",
                            borderWidth: 0                          
                        }
                    ]
                },
                options:{
                    maintainAspectRatio: false,
                    indexAxis: 'x',
                    scales: {
                        x: {
                            stacked: false,
                            ticks: {
                                color: "white"
                            },
                            grid:{
                                color: "white",
                                display: false,
                                drawBorder: false
                            }
                        },
                        y: {
                            stacked: false,
                            ticks: {
                                color: "white",
                                stepSize: 1,
                            },
                            grid: {
                                display: true,
                                drawBorder: true
                            }
                        }
                    },
                    elements: {
                        point:{
                            radius: 3,
                            hoverRadius: 5 ,
                            hitRadius: 25
                        }
                    },
                    plugins:{
                        legend:{
                            display: false
                        },
                        autocolors: {
                            mode: 'data'
                        },
                        tooltip: {
                            callbacks: {
                                footer: (element) => {
                                    
                                    console.log(element)
                                    let text = ""
                                    Object.keys(rawInfo).forEach(plat => {
                                        if(rawInfo[plat][element[0].label]){
                                            text += "\n" + plat + ": " + rawInfo[plat][element[0].label]
                                        }
                                    })
                                    return text
                                }
                            }
                        }
                    }
                }
              })
            setChartInstance(chart);
        }
    // eslint-disable-next-line
    }, [generalReasons, interests, mode, page]);


    return(
        <div>
            {interests.length < 3 ? "There no enough ads to display this chart, try again later" :
            <>
            <div style={{height: "340px"}}>
            <canvas
                ref={chartContainer}
            />
            </div>
            <FormControlLabel
            value="end"
            control={<Switch checked={mode} onChange={(e) => setMode(e.target.checked)} />}
            label="Show other reasons"
            labelPlacement="end"
            />

            {rawInfo ? 
                    <>

                    <span style={{marginLeft: 20}}>
                        <Button onClick={() => handlePrev()} sx={{color: "white"}} disabled={page === 0}><NavigateBeforeIcon />Previous page </Button> 
                    </span>
                    <span>
                        <Button onClick={() => handlePost()}  sx={{color: "white"}} disabled={(page+1) * maxPerPage > (mode ? generalReasons : interests).length}>Next page<NavigateNextIcon/></Button>
                    </span>
                    </> : ""}
            </>
            }

        </div>
    )

}