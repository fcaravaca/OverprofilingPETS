
// React
import React from 'react'
import {useState, useRef, useEffect} from 'react';

// MUI
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel';

// dbConnector
import { getInterestRating } from '../utils/dbConnector';

// Chart-JS
import { CategoryScale, Chart, Tooltip, Legend, DoughnutController, ArcElement } from "chart.js";
import autocolors from 'chartjs-plugin-autocolors';
Chart.register(CategoryScale, Tooltip, Legend, DoughnutController, ArcElement, autocolors);

const AdReasonsChart = ({info, platform, byRating, text, tooltip,allowHideTop3}) =>  {
    const chartContainer = useRef(null);
    const [chartInstance, setChartInstance] = useState(undefined);
    const [notValidChart, setNotValidChart] = useState(false)
    const [textToDisplay, setTextToDisplay] = useState(text)
    const [hideTop3, setHideTop3] = useState(false)

    useEffect(async () => {

        if(!info){
            return
        }

        let info_sorted = info[platform] 
        info_sorted = Object.entries(info_sorted)
        .sort(([,a],[,b]) => b-a)

        if(hideTop3){
            info_sorted = info_sorted.slice(3)
        }

        info_sorted = info_sorted.reduce((r, [k, v]) => ({ ...r, [k]: v }), {});
        
        if(byRating){

            let new_info_sorted = {"5 ★": 0, "4 ★": 0, "3 ★": 0, "2 ★": 0, "1 ★": 0}
            let isValid = false
            let total = 0
            for(var interest of Object.keys(info_sorted)){
                let interest_rating = (await getInterestRating(interest))
                if(interest_rating !== undefined){
                    new_info_sorted[interest_rating + " ★"] = new_info_sorted[interest_rating + " ★"]+info_sorted[interest]
                    isValid = true
                    total += info_sorted[interest]
                }
            }
            if(isValid){
                let mean_score = [1,2,3,4,5].reduce((prev, elem) => elem * new_info_sorted[elem + " ★"] + prev, 0)
                console.log(mean_score)
                mean_score = mean_score/total
                setTextToDisplay(text + ": " + Math.round(mean_score*100)/100)
            }
            setNotValidChart(!isValid)
            info_sorted = new_info_sorted
        }
        let top3Categories = Object.keys(info_sorted).slice(0,byRating ? 5 : 3)

        if(chartInstance !== undefined) {
            chartInstance.destroy()
        }
        if (chartContainer && chartContainer.current) {
            
            let chart = new Chart(chartContainer.current, {
                type: "doughnut",
                data: {
                    labels: Object.keys(info_sorted),
                    datasets: [{
                        label: 'Ad reasons',
                        borderWidth: 1,
                        data: Object.values(info_sorted)
                    }]
                },
                options:{
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { 
                            position: "bottom",
                            display: true,
                            maxHeight: 28,
                            labels: {
                                usePointStyle: true,
                                filter: function(item, chart){

                                    return top3Categories.includes(item.text) 
                                }
                            }
                        },
                        autocolors: {
                            mode: 'data'
                        }
                    }
                }
              })
            setChartInstance(chart);
        }
    // eslint-disable-next-line
    }, [info, hideTop3]); //The eslint disable next line is because chartInstance, it has to be updated inside the useEffect block and it's checked at the start


    if(notValidChart){
        return null
    }

    return (
        <Grid item xs={12} md={4} style={{marginBottom: 20}}>
        <h5>
            <Stack direction="row" alignItems="center" justifyContent="center">
                {textToDisplay}
                {tooltip}
            </Stack>
        </h5>
        <div style={{height: "340px"}}> 
            <canvas
                ref={chartContainer}
            />
        </div>
        {allowHideTop3 && 
            <FormControlLabel
                control={
                    <Switch checked={hideTop3} onChange={(e) => setHideTop3(e.target.checked)}/>
                }
                label="Hide the top 3 most common reasons"
                />
        }
        </Grid>
    )


}

export default AdReasonsChart;