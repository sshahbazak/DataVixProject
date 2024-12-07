# COVID-19 Dashboard

This project is a COVID-19 Dashboard that visualizes various metrics related to COVID-19 cases, deaths, hospitalizations, and vaccinations. The dashboard uses D3.js and Chart.js for data visualization and Datamaps for geographical data representation.

## Usage

1. Open `index.html` in your browser to view the dashboard.

2. The dashboard includes various sections:
   - **World Cases and Deaths**: Visualizes total cumulative cases and deaths.
   - **Global Impact Visualization**: Displays a world map with COVID-19 data.
   - **Hospitalization Data**: Shows charts for adult and pediatric COVID-19 admissions.
   - **Vaccination Data**: Visualizes vaccination rates and booster dose rates.

## Data Processing

- The data is loaded and processed using D3.js.
- Charts are created using Chart.js.
- Geographical data is visualized using Datamaps.

## Key Functions

- `processData(data)`: Processes the CSV data and calculates various metrics.
- `createPieChart(chartId, data)`: Creates a pie chart.
- `createBarChart(chartId, data, label, color)`: Creates a bar chart.
- `createLineChart(chartId, data, label, color)`: Creates a line chart.
- `generateMap(casesByCountry, deathsByCountry)`: Generates a map with COVID-19 data.

## Key Files and Directories

- **DataVizProject/**: Contains the main project files.
  - **index.html**: Main HTML file for the DataVizProject.
  - **script.js**: Contains the main JavaScript code for the DataVizProject.
  - **styles.css**: Contains the CSS styles for the DataVizProject.
  - **package.json**: Contains the project dependencies.
  - **eslint.config.mjs**: Contains the ESLint configuration.
  - **.gitignore**: Specifies files to be ignored by Git.

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/sshahbazak/DataVizProject.git
   cd DataVizProject
   ```

2. Install the dependencies:
   ```
   npm install
   ```

## Running the Project

1. Open `index.html` in your browser to view the dashboard.

2. Alternatively, you can run the project with the following command to serve it locally:
   ```
   python -m http.server 8000
   ```
   This will start a local web server at \`http://localhost:8000\`, where you can access the project.