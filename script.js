// Load the CSV data
d3.csv("Hospitalization_data.csv", processHospitalizationData);

// Process hospitalization data
function processHospitalizationData(data) {
    const processedData = extractHospitalizationData(data);
    updateKPIs(processedData);
    createCharts(processedData);
}

// Extract hospitalization data
function extractHospitalizationData(data) {
    const weekEndingDates = data.map(d => d['Week Ending Date']);
    const adultCovidAdmissions = data.map(d => +d['Weekly Total Adult COVID-19 Admissions']);
    const pediatricCovidAdmissions = data.map(d => +d['Weekly Total Pediatric COVID-19 Admissions']);
    const totalCovidAdmissions = data.map(d => +d['Weekly Total COVID-19 Admissions']);
    const influenzaAdmissions = data.map(d => +d['Weekly Total Influenza Admissions']);
    const totalAdultAdmissions = d3.sum(adultCovidAdmissions);
    const totalPediatricAdmissions = d3.sum(pediatricCovidAdmissions);
    const averageAdultAdmissions = (totalAdultAdmissions / adultCovidAdmissions.length).toFixed(2);
    const averagePediatricAdmissions = (totalPediatricAdmissions / pediatricCovidAdmissions.length).toFixed(2);
    const totalInpatientBedsOccupied = data.map(d => +d['Weekly Average Inpatient Beds Occupied']);
    const totalInpatientBeds = data.map(d => +d['Weekly Average Inpatient Beds']);
    const occupancyRate = ((d3.sum(totalInpatientBedsOccupied) / d3.sum(totalInpatientBeds)) * 100).toFixed(2);

    return {
        weekEndingDates,
        adultCovidAdmissions,
        pediatricCovidAdmissions,
        totalCovidAdmissions,
        influenzaAdmissions,
        totalAdultAdmissions,
        totalPediatricAdmissions,
        averageAdultAdmissions,
        averagePediatricAdmissions,
        occupancyRate
    };
}

// Update KPIs
function updateKPIs(data) {
    document.getElementById('totalAdultAdmissions').innerText = data.totalAdultAdmissions.toLocaleString();
    document.getElementById('totalPediatricAdmissions').innerText = data.totalPediatricAdmissions.toLocaleString();
    document.getElementById('averageAdultAdmissions').innerText = data.averageAdultAdmissions.toLocaleString();
    document.getElementById('averagePediatricAdmissions').innerText = data.averagePediatricAdmissions.toLocaleString();
    document.getElementById('bedOccupancyRate').innerText = data.occupancyRate + '%';
}

// Create charts
function createCharts(data) {
    createLineChart('adultCovidAdmissionsChart', 'Adult COVID-19 Admissions', data.weekEndingDates, data.adultCovidAdmissions, 'rgba(255, 99, 132, 1)', 'rgba(255, 99, 132, 0.2)');
    createLineChart('pediatricCovidAdmissionsChart', 'Pediatric COVID-19 Admissions', data.weekEndingDates, data.pediatricCovidAdmissions, 'rgba(54, 162, 235, 1)', 'rgba(54, 162, 235, 0.2)');
    createLineChart('totalAdmissionsChart', 'Total COVID-19 Admissions', data.weekEndingDates, data.totalCovidAdmissions, 'rgba(255, 206, 86, 1)', 'rgba(255, 206, 86, 0.2)');
    createLineChart('influenzaAdmissionsChart', 'Influenza Admissions', data.weekEndingDates, data.influenzaAdmissions, 'rgba(75, 192, 192, 1)', 'rgba(75, 192, 192, 0.2)');
}

// Create a line chart
function createLineChart(chartId, label, labels, data, borderColor, backgroundColor) {
    const ctx = document.getElementById(chartId).getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                borderColor: borderColor,
                backgroundColor: backgroundColor,
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
}

// Load and aggregate CSV data using D3
d3.csv("WHO-COVID-19-global-daily-data.csv", processGlobalCovidData);

// Process global COVID-19 data
function processGlobalCovidData(data) {
    const processedData = aggregateGlobalCovidData(data);
    updateGlobalKPIs(processedData);
    createGlobalCharts(processedData);
    generateMap(processedData.casesByCountry, processedData.deathsByCountry);
}

// Aggregate global COVID-19 data
function aggregateGlobalCovidData(data) {
    const countryData = d3.nest()
        .key(d => d.Country_code)
        .rollup(d => {
            const maxCases = d3.max(d, g => +g.Cumulative_cases || 0);
            const maxDeaths = d3.max(d, g => +g.Cumulative_deaths || 0);
            return { cumulativeCases: maxCases, cumulativeDeaths: maxDeaths, totalImpact: maxCases + maxDeaths };
        })
        .map(data);

    const bubblesData = Object.keys(countryData).map(countryCode => {
        const centroid = countryCentroids[countryCode] || { latitude: 0, longitude: 0 };
        return {
            centered: countryCode,
            radius: Math.sqrt(countryData[countryCode].totalImpact) / 300,
            fillKey: 'Trouble',
            cumulativeCases: countryData[countryCode].cumulativeCases,
            cumulativeDeaths: countryData[countryCode].cumulativeDeaths,
            totalImpact: countryData[countryCode].totalImpact,
            latitude: centroid.latitude,
            longitude: centroid.longitude
        };
    });

    return { countryData, bubblesData };
}

// Update global KPIs
function updateGlobalKPIs(data) {
    d3.select("#total-cases").text(data.totalCases.toLocaleString());
    d3.select("#total-deaths").text(data.totalDeaths.toLocaleString());
    d3.select("#last-date").text(data.lastDate);
    d3.select("#last-day-cases").text(data.lastDayCases.toLocaleString());
    d3.select("#last-day-deaths").text(data.lastDayDeaths.toLocaleString());
    d3.select("#percent-change-cases").text(`Cases: ${data.percentChangeCases.toFixed(2)}%`);
    d3.select("#percent-change-deaths").text(`Deaths: ${data.percentChangeDeaths.toFixed(2)}%`);
}

// Create global charts
function createGlobalCharts(data) {
    createPieChart('cases-pie-chart', data.casesByCountry);
    createPieChart('deaths-pie-chart', data.deathsByCountry);
    createBarChart('cumulative-cases-bar-chart', data.cumulativeCasesOverTime, 'Cumulative Cases', '#36A2EB');
    createBarChart('cumulative-deaths-bar-chart', data.cumulativeDeathsOverTime, 'Cumulative Deaths', '#FF6384');
    createLineChart('new-cases-line-chart', 'New Cases', data.newCasesOverTime, '#36A2EB');
    createLineChart('new-deaths-line-chart', 'New Deaths', data.newDeathsOverTime, '#FF6384');
}

// Create a pie chart
function createPieChart(chartId, data) {
    const ctx = document.getElementById(chartId).getContext('2d');
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

// Create a bar chart
function createBarChart(chartId, data, label, color) {
    const ctx = document.getElementById(chartId).getContext('2d');
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

// Initialize the map
function initializeMap(containerId, bubblesData) {
    document.getElementById(containerId).innerHTML = '';

    const map = new Datamap({
        scope: 'world',
        element: document.getElementById(containerId),
        geographyConfig: {
            popupOnHover: false,
            highlightOnHover: false,
            borderColor: '#007bff',
            borderWidth: 0.5
        },
        bubblesConfig: {
            popupTemplate: (geography, data) => `
                <div class="hoverinfo">
                    Country: ${data.centered}<br>
                    Cumulative Cases: ${data.cumulativeCases.toLocaleString()}<br>
                    Cumulative Deaths: ${data.cumulativeDeaths.toLocaleString()}<br>
                    Total Impact: ${data.totalImpact.toLocaleString()}
                </div>`
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

    map.bubbles(bubblesData, {
        popupTemplate: (geo, data) => `
            <div class="hoverinfo">
                ${data.centered}<br>
                Cumulative Cases: ${data.cumulativeCases.toLocaleString()}<br>
                Cumulative Deaths: ${data.cumulativeDeaths.toLocaleString()}<br>
                Total Impact: ${data.totalImpact.toLocaleString()}
            </div>`
    });

    map.fit();
}

// Adjust map size on window resize
window.addEventListener('resize', () => initializeMap('worldMap', []));

// Show selected tab
function showTab(tabId) {
    d3.selectAll('.tab-content').style('display', 'none');
    d3.selectAll('.tab-button').classed('active', false);
    d3.select('#' + tabId).style('display', 'block');
    d3.select(event.currentTarget).classed('active', true);
}

// Set default tab to display on load
document.addEventListener('DOMContentLoaded', () => showTab('world-tab'));

// Process data
function processData(data) {
    const casesByCountry = {};
    const deathsByCountry = {};
    const cumulativeCasesOverTime = {};
    const cumulativeDeathsOverTime = {};
    const newCasesOverTime = {};
    const newDeathsOverTime = {};

    let totalCases = 0;
    let totalDeaths = 0;
    let lastDate = '';
    let lastDayCases = 0;
    let lastDayDeaths = 0;
    let percentChangeCases = 0;
    let percentChangeDeaths = 0;
    let previousDayCases = 0;
    let previousDayDeaths = 0;

    data.forEach((row, index) => {
        const date = row.Date_reported;
        const country = row.Country;
        const newCases = +row.New_cases || 0;
        const cumulativeCases = +row.Cumulative_cases || 0;
        const newDeaths = +row.New_deaths || 0;
        const cumulativeDeaths = +row.Cumulative_deaths || 0;

        totalCases = cumulativeCases;
        totalDeaths = cumulativeDeaths;
        lastDate = date;

        if (index === data.length - 1) {
            lastDayCases = newCases;
            lastDayDeaths = newDeaths;
        }

        if (index === data.length - 2) {
            previousDayCases = newCases;
            previousDayDeaths = newDeaths;
        }

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
d3.csv("WHO-COVID-19-global-daily-data.csv", (error, data) => {
    if (error) {
        console.error('Error loading or processing the CSV data:', error);
        return;
    }

    const processedData = processData(data);
    updateGlobalKPIs(processedData);
    createGlobalCharts(processedData);
    generateMap(processedData.casesByCountry, processedData.deathsByCountry);
});
