// Load the CSV data
d3.csv("Hospitalization_data.csv", function(data) {
    // Process data
    const weekEndingDates = data.map(function(d) { return new Date(d['Week Ending Date']); });
    weekEndingDates.sort((a, b) => a - b);  // Ensure proper date sorting

    const adultCovidAdmissions = data.map(function(d) { return +d['Weekly Total Adult COVID-19 Admissions']; });
    const pediatricCovidAdmissions = data.map(function(d) { return +d['Weekly Total Pediatric COVID-19 Admissions']; });
    const totalCovidAdmissions = data.map(function(d) { return +d['Weekly Total COVID-19 Admissions']; });
    const influenzaAdmissions = data.map(function(d) { return +d['Weekly Total Influenza Admissions']; });

    const totalAdultAdmissions = d3.sum(adultCovidAdmissions);
    const totalPediatricAdmissions = d3.sum(pediatricCovidAdmissions);

    const averageAdultAdmissions = (totalAdultAdmissions / adultCovidAdmissions.length).toFixed(2);
    const averagePediatricAdmissions = (totalPediatricAdmissions / pediatricCovidAdmissions.length).toFixed(2);

    const totalInpatientBedsOccupied = data.map(function(d) { return +d['Weekly Average Inpatient Beds Occupied']; });
    const totalInpatientBeds = data.map(function(d) { return +d['Weekly Average Inpatient Beds']; });

    const occupancyRate = ((d3.sum(totalInpatientBedsOccupied) / d3.sum(totalInpatientBeds)) * 100).toFixed(2);

    // Update KPIs
    document.getElementById('totalAdultAdmissions').innerText = totalAdultAdmissions.toLocaleString();
    document.getElementById('totalPediatricAdmissions').innerText = totalPediatricAdmissions.toLocaleString();
    document.getElementById('averageAdultAdmissions').innerText = averageAdultAdmissions.toLocaleString();
    document.getElementById('averagePediatricAdmissions').innerText = averagePediatricAdmissions.toLocaleString();
    document.getElementById('bedOccupancyRate').innerText = occupancyRate + '%';

    // Helper function to create charts
    const chartConfig = (data, label, color, elementId) => {
        const ctx = document.getElementById(elementId).getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: weekEndingDates,
                datasets: [{
                    label: label,
                    data: data,
                    borderColor: color.border,
                    backgroundColor: color.background,
                    borderWidth: 1,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        title: { display: true, text: 'Week Ending Date' }
                    },
                    y: {
                        title: { display: true, text: 'Number of Admissions' },
                        ticks: { beginAtZero: true }
                    }
                }
            }
        });
    };

    // Create charts for different types of admissions
    chartConfig(adultCovidAdmissions, 'Adult COVID-19 Admissions', { border: 'rgba(255, 99, 132, 1)', background: 'rgba(255, 99, 132, 0.2)' }, 'adultCovidAdmissionsChart');
    chartConfig(pediatricCovidAdmissions, 'Pediatric COVID-19 Admissions', { border: 'rgba(54, 162, 235, 1)', background: 'rgba(54, 162, 235, 0.2)' }, 'pediatricCovidAdmissionsChart');
    chartConfig(totalCovidAdmissions, 'Total COVID-19 Admissions', { border: 'rgba(255, 206, 86, 1)', background: 'rgba(255, 206, 86, 0.2)' }, 'totalAdmissionsChart');
    chartConfig(influenzaAdmissions, 'Influenza Admissions', { border: 'rgba(75, 192, 192, 1)', background: 'rgba(75, 192, 192, 0.2)' }, 'influenzaAdmissionsChart');
});


    // Load and aggregate CSV data using D3
d3.csv("WHO-COVID-19-global-daily-data.csv", function(data) {
    // Aggregate cumulative cases and cumulative deaths by country
    const countryData = d3.nest()
        .key(d => d.Country_code)
        .rollup(d => {
            const maxCases = d3.max(d, g => +g.Cumulative_cases || 0);
            const maxDeaths = d3.max(d, g => +g.Cumulative_deaths || 0);
            return { cumulativeCases: maxCases, cumulativeDeaths: maxDeaths, totalImpact: maxCases + maxDeaths };
        })
        .map(data);

    // Prepare bubbles data for visualization
    const bubblesData = Object.keys(countryData).map(countryCode => {
        const centroid = countryCentroids[countryCode] || { latitude: 0, longitude: 0 };
        return {
            centered: countryCode,
            radius: Math.sqrt(countryData[countryCode].totalImpact) / 300, // Adjusted scaling for bubbles
            fillKey: 'Trouble',
            cumulativeCases: countryData[countryCode].cumulativeCases,
            cumulativeDeaths: countryData[countryCode].cumulativeDeaths,
            totalImpact: countryData[countryCode].totalImpact,
            latitude: centroid.latitude,
            longitude: centroid.longitude
        };
    });

    // Initialize the map and add bubbles
    initializeMap('worldMap', bubblesData);
});

// Function to initialize the map
function initializeMap(containerId, bubblesData) {
    // Clear the map container before creating a new map
    document.getElementById(containerId).innerHTML = '';

    var map = new Datamap({
        scope: 'world',
        element: document.getElementById(containerId),
        geographyConfig: {
            popupOnHover: false,
            highlightOnHover: false,
            borderColor: '#007bff',
            borderWidth: 0.5
        },
        bubblesConfig: {
            popupTemplate: function(geography, data) {
                return `<div class="hoverinfo">Country: ${data.centered}<br>
                        Cumulative Cases: ${data.cumulativeCases.toLocaleString()}<br>
                        Cumulative Deaths: ${data.cumulativeDeaths.toLocaleString()}<br>
                        Total Impact: ${data.totalImpact.toLocaleString()}</div>`;
            },
            fillOpacity: 0.5
        },
        fills: {
            'Visited': '#4caf50',
            'neato': '#2196f3',
            'Trouble': '#ff9800',
            defaultFill: '#f0f0f0'
        },
        height: document.getElementById(containerId).clientHeight,
        width: document.getElementById(containerId).clientWidth,
        responsive: true,
        svg: {
            viewBox: `0 0 ${document.getElementById(containerId).clientWidth} ${document.getElementById(containerId).clientHeight}`
        }
    });

    // Add bubbles for cumulative cases and deaths data
    map.bubbles(bubblesData, {
        popupTemplate: function(geo, data) {
            return `<div class="hoverinfo">${data.centered}<br>
                    Cumulative Cases: ${data.cumulativeCases.toLocaleString()}<br>
                    Cumulative Deaths: ${data.cumulativeDeaths.toLocaleString()}<br>
                    Total Impact: ${data.totalImpact.toLocaleString()}</div>`;
        }
    });

    map.fit();
}


    // Adjust map size on window resize
    window.addEventListener('resize', function() {
        initializeMap('worldMap', []);
    });

    // Function to show selected tab
    function showTab(tabId) {
        // Hide all tab content
        d3.selectAll('.tab-content').style('display', 'none');

        // Remove 'active' class from all buttons
        d3.selectAll('.tab-button').classed('active', false);

        // Show the selected tab content
        d3.select('#' + tabId).style('display', 'block');

        // Add 'active' class to the selected button
        d3.select(event.currentTarget).classed('active', true);
    }



    // Set default tab to display on load
    document.addEventListener('DOMContentLoaded', function() {
        showTab('world-tab'); // Show World Cases and Deaths by default
    });

    // Function to process data
    function processData(data) {
        var casesByCountry = {};
        var deathsByCountry = {};
        var cumulativeCasesOverTime = {};
        var cumulativeDeathsOverTime = {};
        var newCasesOverTime = {};
        var newDeathsOverTime = {};

        var totalCases = 0;
        var totalDeaths = 0;
        var lastDate = '';
        var lastDayCases = 0;
        var lastDayDeaths = 0;
        var percentChangeCases = 0;
        var percentChangeDeaths = 0;
        var previousDayCases = 0;
        var previousDayDeaths = 0;

        data.forEach(function(row, index) {
            var date = row.Date_reported;
            var country = row.Country;
            var newCases = +row.New_cases || 0;
            var cumulativeCases = +row.Cumulative_cases || 0;
            var newDeaths = +row.New_deaths || 0;
            var cumulativeDeaths = +row.Cumulative_deaths || 0;

            // Set total cases and deaths using the last row data
            totalCases = cumulativeCases;
            totalDeaths = cumulativeDeaths;
            lastDate = date;

            // Calculate cases and deaths for the last reported day
            if (index === data.length - 1) {
                lastDayCases = newCases;
                lastDayDeaths = newDeaths;
            }

            // Get previous day cases and deaths
            if (index === data.length - 2) {
                previousDayCases = newCases;
                previousDayDeaths = newDeaths;
            }

            // Calculate percentage change (new vs previous day)
            if (previousDayCases > 0) {
                percentChangeCases = ((lastDayCases - previousDayCases) / previousDayCases) * 100;
            }
            if (previousDayDeaths > 0) {
                percentChangeDeaths = ((lastDayDeaths - previousDayDeaths) / previousDayDeaths) * 100;
            }

            casesByCountry[country] = (casesByCountry[country] || 0) + cumulativeCases;
            deathsByCountry[country] = (deathsByCountry[country] || 0) + cumulativeDeaths;

            cumulativeCasesOverTime[date] = (cumulativeCasesOverTime[date] || 0) + cumulativeCases;
            cumulativeDeathsOverTime[date] = (cumulativeDeathsOverTime[date] || 0) + cumulativeDeaths;

            newCasesOverTime[date] = (newCasesOverTime[date] || 0) + newCases;
            newDeathsOverTime[date] = (newDeathsOverTime[date] || 0) + newDeaths;
        });

        return {
            totalCases,
            totalDeaths,
            lastDate,
            lastDayCases,
            lastDayDeaths,
            percentChangeCases,
            percentChangeDeaths,
            casesByCountry,
            deathsByCountry,
            cumulativeCasesOverTime,
            cumulativeDeathsOverTime,
            newCasesOverTime,
            newDeathsOverTime
        };
    }

    // Load CSV data and update KPI values
    d3.csv("WHO-COVID-19-global-daily-data.csv", function(error, data) {
        if (error) {
            console.error('Error loading or processing the CSV data:', error);
            return;
        }

        var processedData = processData(data);

        // Update KPI values
        d3.select("#total-cases").text(processedData.totalCases.toLocaleString());
        d3.select("#total-deaths").text(processedData.totalDeaths.toLocaleString());
        d3.select("#last-date").text(processedData.lastDate);
        d3.select("#last-day-cases").text(processedData.lastDayCases.toLocaleString());
        d3.select("#last-day-deaths").text(processedData.lastDayDeaths.toLocaleString());
        d3.select("#percent-change-cases").text(`Cases: ${processedData.percentChangeCases.toFixed(2)}%`);
        d3.select("#percent-change-deaths").text(`Deaths: ${processedData.percentChangeDeaths.toFixed(2)}%`);

        // Create the charts
        createPieChart('cases-pie-chart', processedData.casesByCountry);
        createPieChart('deaths-pie-chart', processedData.deathsByCountry);
        createBarChart('cumulative-cases-bar-chart', processedData.cumulativeCasesOverTime, 'Cumulative Cases', '#36A2EB');
        createBarChart('cumulative-deaths-bar-chart', processedData.cumulativeDeathsOverTime, 'Cumulative Deaths', '#FF6384');
        createLineChart('new-cases-line-chart', processedData.newCasesOverTime, 'New Cases', '#36A2EB');
        createLineChart('new-deaths-line-chart', processedData.newDeathsOverTime, 'New Deaths', '#FF6384');

        // Generate the map
        generateMap(processedData.casesByCountry, processedData.deathsByCountry);
    });

    // Chart creation functions (pie, bar, and line charts)
    function createPieChart(chartId, data) {
        var ctx = document.getElementById(chartId).getContext('2d');
        new Chart(ctx, {
            type: 'pie',
            data: {
                datasets: [{
                    data: Object.values(data),
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56']
                }],
                labels: Object.keys(data)
            },
            options: {
                responsive: true
            }
        });
    }

    function createBarChart(chartId, data, label, color) {
        var ctx = document.getElementById(chartId).getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(data),
                datasets: [{
                    label: label,
                    data: Object.values(data),
                    backgroundColor: color
                }]
            },
            options: {
                responsive: true
            }
        });
    }

    function createLineChart(chartId, data, label, color) {
        var ctx = document.getElementById(chartId).getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: Object.keys(data),
                datasets: [{
                    label: label,
                    data: Object.values(data),
                    borderColor: color,
                    fill: false
                }]
            },
            options: {
                responsive: true
            }
        });
    }

        // Load the CSV data
d3.csv("Hospitalization_data.csv", function(data) {
    // Convert 'Week Ending Date' to Date object and sort the data by this date
    data.forEach(function(d) {
        d['Week Ending Date'] = new Date(d['Week Ending Date']);
    });

    // Sort the data by 'Week Ending Date'
    data.sort(function(a, b) {
        return a['Week Ending Date'] - b['Week Ending Date']; // Ascending order
    });

    // After sorting, extract the necessary columns
    const weekEndingDates = data.map(function(d) { return d['Week Ending Date'].toLocaleDateString(); });
    const adultCovidAdmissions = data.map(function(d) { return +d['Weekly Total Adult COVID-19 Admissions']; });
    const pediatricCovidAdmissions = data.map(function(d) { return +d['Weekly Total Pediatric COVID-19 Admissions']; });
    const totalCovidAdmissions = data.map(function(d) { return +d['Weekly Total COVID-19 Admissions']; });
    const influenzaAdmissions = data.map(function(d) { return +d['Weekly Total Influenza Admissions']; });
    const totalAdultAdmissions = d3.sum(adultCovidAdmissions);
    const totalPediatricAdmissions = d3.sum(pediatricCovidAdmissions);
    const averageAdultAdmissions = (totalAdultAdmissions / adultCovidAdmissions.length).toFixed(2);
    const averagePediatricAdmissions = (totalPediatricAdmissions / pediatricCovidAdmissions.length).toFixed(2);
    const totalInpatientBedsOccupied = data.map(function(d) { return +d['Weekly Average Inpatient Beds Occupied']; });
    const totalInpatientBeds = data.map(function(d) { return +d['Weekly Average Inpatient Beds']; });
    const occupancyRate = ((d3.sum(totalInpatientBedsOccupied) / d3.sum(totalInpatientBeds)) * 100).toFixed(2);

    // Update KPIs
    document.getElementById('totalAdultAdmissions').innerText = totalAdultAdmissions.toLocaleString();
    document.getElementById('totalPediatricAdmissions').innerText = totalPediatricAdmissions.toLocaleString();
    document.getElementById('averageAdultAdmissions').innerText = averageAdultAdmissions.toLocaleString();
    document.getElementById('averagePediatricAdmissions').innerText = averagePediatricAdmissions.toLocaleString();
    document.getElementById('bedOccupancyRate').innerText = occupancyRate + '%';

    // Create Adult COVID-19 Admissions Chart
    const ctxAdult = document.getElementById('adultCovidAdmissionsChart').getContext('2d');
    new Chart(ctxAdult, {
        type: 'line',
        data: {
            labels: weekEndingDates,
            datasets: [{
                label: 'Adult COVID-19 Admissions',
                data: adultCovidAdmissions,
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderWidth: 1,
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: {
                xAxes: [{
                    scaleLabel: { display: true, labelString: 'Week Ending Date' }
                }],
                yAxes: [{
                    scaleLabel: { display: true, labelString: 'Number of Admissions' },
                    ticks: { beginAtZero: true }
                }]
            }
        }
    });

    // Create Pediatric COVID-19 Admissions Chart
    const ctxPediatric = document.getElementById('pediatricCovidAdmissionsChart').getContext('2d');
    new Chart(ctxPediatric, {
        type: 'line',
        data: {
            labels: weekEndingDates,
            datasets: [{
                label: 'Pediatric COVID-19 Admissions',
                data: pediatricCovidAdmissions,
                borderColor: 'rgba(54, 162, 235, 1)',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderWidth: 1,
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: {
                xAxes: [{
                    scaleLabel: { display: true, labelString: 'Week Ending Date' }
                }],
                yAxes: [{
                    scaleLabel: { display: true, labelString: 'Number of Admissions' },
                    ticks: { beginAtZero: true }
                }]
            }
        }
    });

    // Create Total COVID-19 Admissions Chart
    const ctxTotal = document.getElementById('totalAdmissionsChart').getContext('2d');
    new Chart(ctxTotal, {
        type: 'line',
        data: {
            labels: weekEndingDates,
            datasets: [{
                label: 'Total COVID-19 Admissions',
                data: totalCovidAdmissions,
                borderColor: 'rgba(255, 206, 86, 1)',
                backgroundColor: 'rgba(255, 206, 86, 0.2)',
                borderWidth: 1,
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: {
                xAxes: [{
                    scaleLabel: { display: true, labelString: 'Week Ending Date' }
                }],
                yAxes: [{
                    scaleLabel: { display: true, labelString: 'Number of Admissions' },
                    ticks: { beginAtZero: true }
                }]
            }
        }
    });

    // Create Influenza Admissions Chart
    const ctxInfluenza = document.getElementById('influenzaAdmissionsChart').getContext('2d');
    new Chart(ctxInfluenza, {
        type: 'line',
        data: {
            labels: weekEndingDates,
            datasets: [{
                label: 'Influenza Admissions',
                data: influenzaAdmissions,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderWidth: 1,
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: {
                xAxes: [{
                    scaleLabel: { display: true, labelString: 'Week Ending Date' }
                }],
                yAxes: [{
                    scaleLabel: { display: true, labelString: 'Number of Admissions' },
                    ticks: { beginAtZero: true }
                }]
            }
        }
    });
});




