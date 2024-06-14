// React
import React from 'react'
import {useState, useRef, useEffect} from 'react';

// Chart-JS
import { ViolinChart } from '@sgratzl/chartjs-chart-boxplot';

const InterestsBoxPlot = ({info}) =>  {
    const chartContainer = useRef(null);
    const [chartInstance, setChartInstance] = useState(undefined);

    useEffect(() => {

        if(chartInstance !== undefined) {
            chartInstance.destroy()
        }
        if (chartContainer && chartContainer.current) {
            
            let chart = new ViolinChart(chartContainer.current, {
                data: {
                  labels: info.platforms,
                  datasets: [{
                    labels: 'Interest rating',
                    itemRadius: 0,
                    borderWidth: 1,
                    borderColor: "white",
                    
                    data: info.data
                  
                    }]
                },
                options:{
                    maintainAspectRatio: false,
                    scales: {
                        x: {
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
                            min: 1,
                            ticks: {
                                color: "white",
                                
                            },
                            grid: {
                                display: true,
                                drawBorder: true
                            },
                            
                        },
                        y1: {
                            position: "right",
                            min: 1,
                            max: 5,
                            ticks: {
                                color: "white",
                                
                            },
                        }
                        
                    },
                    plugins:{
                        legend: { display: false },
                        autocolors: {enabled: false}
                    }
                }
              })
            setChartInstance(chart);
        }
    // eslint-disable-next-line
    }, [info]); //The eslint disable next line is because chartInstance, it has to be updated inside the useEffect block and it's checked at the start




    return (
    <>
        <div style={{height: 250}}> 
        <canvas
            ref={chartContainer}
        />
        </div>
    </>
)


}

export default InterestsBoxPlot;