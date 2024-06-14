
// React
import React from 'react'
import {useState, useRef, useEffect} from 'react';


// MUI 
import Button from '@mui/material/Button';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import Switch from '@mui/material/Switch';
import Stack from '@mui/material/Stack';
import BarChartIcon from '@mui/icons-material/BarChart';
import TimelineIcon from '@mui/icons-material/Timeline';

// Chart-JS
import 'chartjs-adapter-luxon';
import { CategoryScale, Chart, Tooltip, Legend, BarController, LinearScale, BarElement, TimeScale, LineController, PointElement, LineElement } from "chart.js";


Chart.register(CategoryScale, Tooltip, Legend, BarController, LinearScale, BarElement, TimeScale, LineController, PointElement, LineElement );


const StackedDateAdsBarChart = ({info, textCallback}) =>  {
    const chartContainer = useRef(null);
    const [chartInstance, setChartInstance] = useState(undefined);
    const [weekIndex, setWeekIndex] = useState(0)
    const [lineChart, setLineChart] = useState(false)


    const handlePrev = () => {
        if(info && (weekIndex < info.dates.length/7 - 1)){
            setWeekIndex((prev) => prev+1)
        }

    }
    const handlePost = () => {
        if(weekIndex > 0){
            setWeekIndex((prev) => prev-1)
        }

    }

    useEffect(() => {
        console.log(info)
        if(info === undefined || info.dates === undefined){
            return;
        }
        let totalDays = info.dates.length

        let firstIndex = totalDays - (7*(weekIndex+ 1))
        let lastIndex = totalDays - (7*weekIndex)

        if(chartInstance !== undefined) {
            chartInstance.destroy()
        }
        if(textCallback){
            if(lineChart){
                textCallback(null)
            }else{
                textCallback(info.dates[firstIndex] + " to " + info.dates[lastIndex-1])
            }
        }
        if (chartContainer && chartContainer.current) {
            
            let chart = new Chart(chartContainer.current, {
                type: lineChart ? "line" : "bar",
                data: {
                    labels: lineChart ? info.dates : info.dates.slice(firstIndex, lastIndex),
                    datasets: [
                    {
                        label: 'Twitter',
                        borderWidth: lineChart ? 2 : 0,
                        borderColor: "#3f50b5",
                        backgroundColor: "#3f50b5",
                        pointRadius: 1,
                        data: lineChart ? info.numberOfAds.twitter.map((sum => value => sum += value)(0)) : 
                                          info.numberOfAds.twitter.slice(firstIndex, lastIndex)
                    },
                    {
                        label: 'Facebook',
                        borderWidth: lineChart ? 2 : 0,
                        borderColor: "#8CBA38",
                        backgroundColor: "#8CBA38",
                        pointRadius: 1,
                        data: lineChart ? info.numberOfAds.facebook.map((sum => value => sum += value)(0)) : 
                                          info.numberOfAds.facebook.slice(firstIndex, lastIndex)
                    },
                    {
                        label: 'Linkedin',
                        borderWidth: lineChart ? 2 : 0,
                        borderColor: "#9920E8",
                        backgroundColor: "#9920E8",
                        pointRadius: 1,
                        data: lineChart ? info.numberOfAds.linkedin.map((sum => value => sum += value)(0)) : 
                                          info.numberOfAds.linkedin.slice(firstIndex, lastIndex)
                    },
                    {
                        label: 'Google',
                        borderWidth: lineChart ? 2 : 0,
                        borderColor: "#E8D320",
                        backgroundColor: "#E8D320",
                        pointRadius: 1,
                        data: lineChart ? info.numberOfAds.google.map((sum => value => sum += value)(0)) : 
                                          info.numberOfAds.google.slice(firstIndex, lastIndex)
                    },
                    {
                        label: 'YouTube',
                        borderWidth: lineChart ? 2 : 0,
                        borderColor: "#F86F45",
                        backgroundColor: "#F86F45",
                        pointRadius: 1,
                        data: lineChart ? info.numberOfAds.youtube.map((sum => value => sum += value)(0)) : 
                                          info.numberOfAds.youtube.slice(firstIndex, lastIndex)
                    }
                    ]
                },
                options:{
                    maintainAspectRatio: false,
                    indexAxis: 'x',
                    scales: {
                        x: {
                            stacked: !lineChart,
                            ticks: {
                                color: "white"
                            },
                            
                            type: 'time',
                            time: {
                              // Luxon format string
                              unit: 'day',
                              tooltipFormat: 'DD'
                            },
                            grid:{
                                color: "white",
                                display: false,
                                drawBorder: false
                            }
                        },
                        y: {
                            stacked: !lineChart,
                            ticks: {
                                color: "white",
                                
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
                            labels:{
                                usePointStyle: true,
                            }
                        }
                    }
                }
              })
            setChartInstance(chart);
        }
    // eslint-disable-next-line
    }, [info, weekIndex, lineChart]); //The eslint disable next line is because chartInstance, it has to be updated inside the useEffect block and it's checked at the start





    return (
        <>
            <div style={{height: "250px"}}> 
                <canvas
                    ref={chartContainer}
                />
            </div>
            <Stack direction="row" alignItems="center" justifyContent="center">
            {info && info.dates && info.dates.length > 7 ? 
                <>

                <span style={{marginLeft: 20}}>
                    <Button onClick={() => handlePrev()} sx={{color: "white"}} disabled={!(info && info.dates && weekIndex < info.dates.length/7 - 1)  || lineChart}><NavigateBeforeIcon />Previous week </Button> 
                </span>
                <span>
                    <Button onClick={() => handlePost()}  sx={{color: "white"}} disabled={!(weekIndex > 0) || lineChart}>Next week<NavigateNextIcon/></Button>
                </span>
                </> : ""}
                <span>
                <Stack direction="row" alignItems="center">
                    <BarChartIcon/>
                    <Switch label="Bar chart / Line Chart" cvhecked={lineChart} onChange={(e) => setLineChart(e.target.checked)}/>
                    <TimelineIcon/>
                </Stack>
                </span>
            </Stack>
        </>
    )


}

export default StackedDateAdsBarChart;