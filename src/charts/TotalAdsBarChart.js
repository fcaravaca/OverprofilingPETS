
// React
import React from 'react'
import {useState, useRef, useEffect} from 'react';

// Chart-JS
import { CategoryScale, Chart, Tooltip, Legend, BarController, LinearScale, BarElement } from "chart.js";
Chart.register(CategoryScale, Tooltip, Legend, BarController, LinearScale, BarElement );

const TotalAdsBarChart = ({info}) =>  {
    const chartContainer = useRef(null);
    const [chartInstance, setChartInstance] = useState(undefined);
    useEffect(() => {
        if(chartInstance !== undefined) {
            chartInstance.destroy()
        }
        if (chartContainer && chartContainer.current) {
            
            let chart = new Chart(chartContainer.current, {
                type: "bar",
                data: {
                    labels: Object.keys(info),
                    datasets: [{
                        label: 'Number of ads',
                        borderWidth: 1,
                        borderColor: "black",
                        backgroundColor: "#3f50b5",
                        data: Object.values(info)
                    }]
                },
                options:{
                    maintainAspectRatio: false,
                    indexAxis: 'y',
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
                            ticks: {
                                color: "white",
                                
                            },
                            grid: {
                                display: true,
                                drawBorder: true
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            onClick: function (e) {
                                e.stopPropagation();
                            }
                        }
                    }
                }
              })
            setChartInstance(chart);
        }
    // eslint-disable-next-line
    }, [info]); //The eslint disable next line is because chartInstance, it has to be updated inside the useEffect block and it's checked at the start




    return (
        <div style={{height: "250px"}}> 
            <canvas
                ref={chartContainer}
            />
        </div>
    )


}

export default TotalAdsBarChart;