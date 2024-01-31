(function() {
  // Set the dimensions and margins of the graph
  var margin = {top: 20, right: 25, bottom: 30, left: 40},
      width = 1200 - margin.left - margin.right,
      height = 600 - margin.top - margin.bottom;

  // Append SVG to the map div
  var svg = d3.select("#map").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Map and projection
  const projection = d3.geoMercator()
    .scale(130)
    .center([0,20])
    .translate([width / 2, height / 2]);
  const path = d3.geoPath().projection(projection);

  // Data and color scale
  var dataByYear = new Map();
  const colorScale = d3.scaleThreshold()
    .domain([40,45,50,55,60,65,70,75,80,85,90,95])
    .range(d3.schemeBlues[9]);
    var Tooltip = d3.select("#map")
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("background-color", "white") // Changed to white for visibility against black text
    .style("border-radius", "5px")
    .style("padding", "5px")
    .style("color", "black")
    .style("width", "150px") // Example width
    .style("height", "50px"); // Example height

    let mouseOver = function(d) {
      Tooltip.style("opacity", 1);
      d3.selectAll(".Country")
        .transition()
        .duration(200)
        .style("opacity", .5);
      d3.select(this)
        .transition()
        .duration(200)
        .style("opacity", 1)
        .style("stroke", "black");
    };

  // Mousemove event
  var mousemove = function(event, d) {
    Tooltip
      .html("Country: " + d.properties.name + "<br>Life Expectancy: " + (dataByYear.get(d3.select("#yearSlider").property("value")).get(d.id) || "N/A"))
      .style("left", (event.pageX + 10) + "px")
      .style("top", (event.pageY + 10) + "px");
  };

// Mouseleave event
let mouseLeave = function(d) {
  Tooltip.style("opacity", 0);
  d3.selectAll(".Country")
    .transition()
    .duration(200)
    .style("opacity", .8);
  d3.select(this)
    .transition()
    .duration(200)
    .style("stroke", "transparent");
};

  // Load external data
  Promise.all([
    d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"),
    d3.csv("https://raw.githubusercontent.com/behnoudshafizadeh/Perspolis/master/Country-LifeExpectency.csv")
  ]).then(function(loadData) {
    let topo = loadData[0];
    let lifeData = loadData[1];

    lifeData.forEach(function(d) {
      if (!dataByYear.has(d.year)) {
        dataByYear.set(d.year, new Map());
      }
      dataByYear.get(d.year).set(d.code, +d.pop);
    });

    // Set up slider interaction
    d3.select("#yearSlider").on("input", function() {
      updateMap(this.value);
      d3.select("#yearDisplay").text(this.value);
    });
  
    
    // Initial map update
    updateMap("2000");

    function updateMap(year) {
      var yearData = dataByYear.get(year) || new Map();

      svg.selectAll(".Country").remove();

      svg.append("g")
        .selectAll("path")
        .data(topo.features)
        .enter()
        .append("path")
          .attr("d", path)
          .attr("fill", function (d) {
            var value = yearData.get(d.id);
            return value ? colorScale(value) : "#ccc";
          })
          .style("stroke", "transparent")
          .attr("class", "Country")
          .style("opacity", 0.8)
          .on("mouseover", mouseOver)
          .on("mousemove", mousemove)
          .on("mouseleave", mouseLeave);
    }
  });
})();

//---------------------------3 comparision---------------------
(function() {
  const margin = {top: 10, right: 100, bottom: 30, left: 30},
    width = 800 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;

  // append the svg object to the body of the page
  const svg = d3.select("#Barchart")
    .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

  // Read the data
  d3.csv("https://raw.githubusercontent.com/behnoudshafizadeh/Perspolis/master/LifeDiabet.csv").then(function(data) {

      // List of groups (here I have one group per column)
      const allGroup = ["Life_Expectency", "Hepatitis", "Diphtheria"]

      // Reformat the data: we need an array of arrays of {x, y} tuples
      const dataReady = allGroup.map(function(grpName) {
        return {
          name: grpName,
          values: data.map(function(d) {
            return {time: d.time, value: +d[grpName]};
          })
        };
      });

      // A color scale: one color for each group
      const myColor = d3.scaleOrdinal()
        .domain(allGroup)
        .range(d3.schemeSet2);

      // Add X axis --> it is a date format
      const x = d3.scaleLinear()
        .domain([2000, 2015])
        .range([0, width]);
      svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x));
      svg.append("text")
        .attr("text-anchor", "end")
        .attr("x", width)
        .attr("y", height + margin.top + 20)
        .text("Year");
      // Add Y axis
      const y = d3.scaleLinear()
        .domain([60, 90]) // Adjust this domain to fit your data's range
        .range([height, 0]);
      svg.append("g")
        .call(d3.axisLeft(y));
      svg.append("text")
        .attr("text-anchor", "end")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left+10)
        .attr("x", -margin.top+5)
        .text("Value");
      // Add the lines
      const line = d3.line()
        .x(d => x(+d.time))
        .y(d => y(+d.value));
      svg.selectAll("myLines")
        .data(dataReady)
        .join("path")
          .attr("class", d => d.name)
          .attr("d", d => line(d.values))
          .attr("stroke", d => myColor(d.name))
          .style("stroke-width", 4)
          .style("fill", "none");

    // Add the points
    svg
      // First we need to enter in a group
      .selectAll("myDots")
      .data(dataReady)
      .join('g')
        .style("fill", d => myColor(d.name))
        .attr("class", d => d.name)
      // Second we need to enter in the 'values' part of this group
      .selectAll("myPoints")
      .data(d => d.values)
      .join("circle")
        .attr("cx", d => x(d.time))
        .attr("cy", d => y(d.value))
        .attr("r", 5)
        .attr("stroke", "white")

// Add a label at the beginning of each line
svg
  .selectAll("myLabels")
  .data(dataReady)
  .join('g')
    .append("text")
      .attr("class", d => d.name)
      .datum(d => { return {name: d.name, value: d.values[0]}; }) // Select the first value of each time series
      .attr("transform", d => `translate(${x(d.value.time)},${y(d.value.value)})`) // Position at the first point
      .attr("x", -10) // Adjust X offset to left of the point
      .attr("y", -5) // Adjust Y offset above the point
      .text(d => d.name)
      .style("fill", d => myColor(d.name))
      .style("font-size", 15);

    // Add a legend (interactive)
    svg
      .selectAll("myLegend")
      .data(dataReady)
      .join('g')
        .append("text")
          .attr('x', (d,i) => 10 + i*150)
          .attr('y', 30)
          .text(d => d.name)
          .style("fill", d => myColor(d.name))
          .style("font-size", 15)
        .on("click", function(event,d){
          // is the element currently visible ?
          currentOpacity = d3.selectAll("." + d.name).style("opacity")
          // Change the opacity: from 0 to 1 or from 1 to 0
          d3.selectAll("." + d.name).transition().style("opacity", currentOpacity == 1 ? 0:1)

        })
})
})();

(function() {
// set the dimensions and margins of the graph
const margin = {top: 10, right: 70, bottom: 20, left: 50},
    width = 800 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

// append the svg object to the body of the page
const svg = d3.select("#Barplot")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform",`translate(${margin.left},${margin.top})`);
    // Create a tooltip

  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0.9)
    .style("position", "absolute")
    .style("text-align", "center")
    .style("width", "120px")
    .style("height", "50px")
    .style("padding", "2px")
    .style("font", "12px sans-serif")
    .style("color", "white")  // Setting the font color to black
    .style("background", "black")
    .style("border", "0px")
    .style("border-radius", "8px")
    .style("pointer-events", "none");
// Parse the Data
d3.csv("https://raw.githubusercontent.com/behnoudshafizadeh/Perspolis/master/Life%20Expectency-BMI-Meals.csv").then( function(data) {

  // List of subgroups = header of the csv files = soil condition here
  const subgroups = data.columns.slice(1)

  // List of groups = species here = value of the first column called group -> I show them on the X axis
  const groups = data.map(d => d.Continent)

  console.log(groups)

  // Add X axis
  const x = d3.scaleBand()
      .domain(groups)
      .range([0, width])
      .padding([0.2])
  svg.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x).tickSize(0));

  // Add Y axis
  const y = d3.scaleLinear()
    .domain([0, 80])
    .range([ height, 0 ]);
  svg.append("g")
    .call(d3.axisLeft(y));

  // Another scale for subgroup position?
  const xSubgroup = d3.scaleBand()
    .domain(subgroups)
    .range([0, x.bandwidth()])
    .padding([0.05])

  // color palette = one color per subgroup
  const color = d3.scaleOrdinal()
    .domain(subgroups)
    .range(['#e41a1c','#377eb8','#4daf4a'])

  // Show the bars
  svg.append("g")
    .selectAll("g")
    // Enter in data = loop group per group
    .data(data)
    .join("g")
      .attr("transform", d => `translate(${x(d.Continent)}, 0)`)
    .selectAll("rect")
    .data(function(d) { return subgroups.map(function(key) { return {key: key, value: d[key]}; }); })
    .join("rect")
      .attr("x", d => xSubgroup(d.key))
      .attr("y", d => y(d.value))
      .attr("width", xSubgroup.bandwidth())
      .attr("height", d => height - y(d.value))
      .attr("fill", d => color(d.key))
      .join("rect")
        .on("mouseover", function(event, d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(d.key + " is: " + d.value)
                .style("left", (event.pageX) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function(d) {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });
// Legend
const legend = svg.append("g")
  .attr("font-family", "sans-serif")
  .attr("font-size", 10)
  .attr("text-anchor", "end")
  .selectAll("g")
  .data(subgroups.slice().reverse())
  .join("g")
  .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

legend.append("rect")
  .attr("x", width+50)
  .attr("width", 19)
  .attr("height", 19)
  .attr("fill", color);

legend.append("text")
  .attr("x", width+40)
  .attr("y", 9.5)
  .attr("dy", "0.32em")
  .text(function(d) { return d; });
})
})();

//-----------------------------------Lolipop-------------------------------------

(function() {
// set the dimensions and margins of the graph
const margin = {top: 10, right: 200, bottom: 50, left: 50},
    width = 700 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

// append the svg object to the body of the page
var svg = d3.select("#Lolipop")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");

// Parse the Data
d3.csv("https://raw.githubusercontent.com/behnoudshafizadeh/Perspolis/master/loliii.csv").then(function(data) {


  // Add X axis
  var x = d3.scaleLinear()
    .domain([45, 90])
    .range([ 0, width]);
  svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x))
    svg.append("text")
    .attr("text-anchor", "end")
    .attr("x", width)
    .attr("y", height + margin.top + 20)
    .text("Life Expectancy");
  // Y axis
  var y = d3.scaleBand()
    .range([ 0, height ])
    .domain(data.map(function(d) { return d.group; }))
    .padding(1);
  svg.append("g")
    .call(d3.axisLeft(y))
    svg.append("text")
    .attr("text-anchor", "end")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left+20 )
    .attr("x", -margin.top)
    .text("Alcohol consumption");
  // Lines
  svg.selectAll("myline")
    .data(data)
    .enter()
    .append("line")
      .attr("x1", function(d) { return x(d.value1); })
      .attr("x2", function(d) { return x(d.value2); })
      .attr("y1", function(d) { return y(d.group); })
      .attr("y2", function(d) { return y(d.group); })
      .attr("stroke", "grey")
      .attr("stroke-width", "1px")

  // Circles of variable 1
  svg.selectAll("mycircle")
    .data(data)
    .enter()
    .append("circle")
      .attr("cx", function(d) { return x(d.value1); })
      .attr("cy", function(d) { return y(d.group); })
      .attr("r", "6")
      .style("fill", "#69b3a2")

  // Circles of variable 2
  svg.selectAll("mycircle")
    .data(data)
    .enter()
    .append("circle")
      .attr("cx", function(d) { return x(d.value2); })
      .attr("cy", function(d) { return y(d.group); })
      .attr("r", "6")
      .style("fill", "#4C4082")
})

})();

(function() {
  // set the dimensions and margins of the graph
  var margin = {top: 10, right: 20, bottom: 30, left: 50},
      width = 400 - margin.left - margin.right,
      height = 350 - margin.top - margin.bottom;

  // append the svg object to the body of the page
  var svg = d3.select("#brushScatterlow")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var tooltip = d3.select("body").append("div")
.attr("class", "tooltip")
.style("opacity", 0)
.style("position", "absolute")
.style("text-align", "center")
.style("width", "120px")
.style("height", "28px")
.style("padding", "2px")
.style("font", "12px sans-serif")
.style("background", "lightsteelblue")
.style("border", "0px")
.style("border-radius", "8px")
.style("pointer-events", "none");
  // Define a color scale
  var colorScale = d3.scaleOrdinal(d3.schemeCategory10);

  // Read the data
  d3.csv("https://raw.githubusercontent.com/behnoudshafizadeh/Perspolis/master/Alcol_LifeExpectencyLow.csv").then(function(data) {

      // Add X axis
      var x = d3.scaleLinear()
          .domain([0, 5])
          .range([0, width]);
      svg.append("g")
          .attr("transform", "translate(0," + height + ")")
          .call(d3.axisBottom(x));
      svg.append("text")
          .attr("text-anchor", "middle")
          .attr("x", (width / 2))
          .attr("y", height + margin.bottom)
          .style("fill", "black") // Set the text color to black
          .text("Low Alcohol Consumption");
      // Add Y axis
      var y = d3.scaleLinear()
          .domain([40, 85])
          .range([height, 0]);
      svg.append("g")
          .call(d3.axisLeft(y));
      svg.append("text")
          .attr("text-anchor", "end")
          .attr("transform", "rotate(-90)")
          .attr("y", -margin.left + 20)
          .attr("x", (-height / 2) + 40)
          .style("fill", "black") // Set the text color to black
          .text("Life Expectancy");
      // Add dots
          // Add dots with tooltip
    var myCircle = svg.append('g')
    .selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", function(d) { return x(d.Alcol); })
    .attr("cy", function(d) { return y(d.Life_Expectency); })
    .attr("r", 8)
    .style("fill", function(d) { return colorScale(d.Country); })
    .style("opacity", 0.5)
    .on("mouseover", function(event, d) {
        tooltip.transition()
            .duration(200)
            .style("opacity", .9);
        tooltip.html(d.Country)
            .style("left", (event.pageX) + "px")
            .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function(d) {
        tooltip.transition()
            .duration(500)
            .style("opacity", 0);
    });

      // Add brushing
      var brush = d3.brush()
          .extent([[0, 0], [width, height]])
          .on("start brush", updateChart);

      svg.call(brush);

      // Function that is triggered when brushing is performed
      function updateChart(event) {
          var extent = event.selection;
          myCircle.classed("selected", function(d) {
              return isBrushed(extent, x(d.d.Alcol), y(d.Life_Expectency));
          });
      }

      // A function that return TRUE or FALSE according if a dot is in the selection or not
      function isBrushed(brush_coords, cx, cy) {
          if (!brush_coords) return false; // If there is no selection, return false
          var x0 = brush_coords[0][0],
              x1 = brush_coords[1][0],
              y0 = brush_coords[0][1],
              y1 = brush_coords[1][1];
          return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1; // This return TRUE or FALSE depending on if the points is in the selected area
      }
  });
})();
//-----------------------------------HEATMAP-------------------------------------
(function() {
  // set the dimensions and margins of the graph
  var margin = {top: 60, right: 80, bottom: 180, left: 110},
    width = 800 - margin.left - margin.right,
    height = 800 - margin.top - margin.bottom;

  // append the svg object to the body of the page
  var svg = d3.select("#heatmap").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Build color scale
  var myColor = d3.scaleSequential()
    .interpolator(d3.interpolateInferno)
    .domain([-1,1]);

  // Legend
  var legendWidth = width * 0.6, legendHeight = 10;

  // Append a defs (for definition) element to your SVG
  var defs = svg.append("defs");

  // Append a linearGradient element to the defs and give it a unique id
  var linearGradient = defs.append("linearGradient")
    .attr("id", "linear-gradient");

  // Horizontal gradient
  linearGradient
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "100%")
    .attr("y2", "0%");

  // Set the color for the start (0%)
  linearGradient.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", myColor(-1)); // light blue

  // Set the color for the middle (50%)
  linearGradient.append("stop")
    .attr("offset", "50%")
    .attr("stop-color", myColor(0)); // medium blue

  // Set the color for the end (100%)
  linearGradient.append("stop")
    .attr("offset", "100%")
    .attr("stop-color", myColor(1)); // dark blue

  // Draw the rectangle and fill with gradient
  svg.append("rect")
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#linear-gradient)")
    .attr("transform", "translate(" + (width - legendWidth) / 2 + "," + (height + margin.top - legendHeight +80) + ")");

  // Append title
  svg.append("text")
    .attr("class", "legendTitle")
    .attr("x", (width - legendWidth) / 2)
    .attr("y", height + margin.top + 110)
    .style("text-anchor", "start")
    .text("Correlation");

  // Create the ticks for the legend
  var xLegendScale = d3.scaleLinear()
    .domain([-1, 1])
    .range([0, legendWidth]);

  var legendAxis = d3.axisBottom(xLegendScale)
    .ticks(5)
    .tickFormat(d3.format(".1f"));

  svg.append("g")
    .attr("class", "legend axis")
    .attr("transform", "translate(" + (width - legendWidth) / 2 + "," + (height + margin.top+75) + ")")
    .call(legendAxis);

  d3.csv("https://raw.githubusercontent.com/behnoudshafizadeh/Perspolis/master/Expend.csv").then(function(data) {
    var myGroups = Array.from(new Set(data.map(d => d.group)));
    var myVars = Array.from(new Set(data.map(d => d.variable)));

    var x = d3.scaleBand()
      .range([0, width])
      .domain(myGroups)
      .padding(0.05);
    svg.append("g")
      .style("font-size", 12)
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x).tickSize(0))
      .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-65)");

    var y = d3.scaleBand()
      .range([height, 0])
      .domain(myVars)
      .padding(0.05);
    svg.append("g")
      .style("font-size", 12)
      .call(d3.axisLeft(y).tickSize(0));

    var myColor = d3.scaleSequential()
      .interpolator(d3.interpolateInferno)
      .domain([-1,1]); // Adjust domain to fit the range of your data

    var Tooltip = d3.select("#heatmap")
      .append("div")
      .style("opacity", 0)
      .attr("class", "tooltip")
      .style("background-color", "white")
      .style("border", "solid")
      .style("border-width", "2px")
      .style("border-radius", "5px")
      .style("color", "black")

      .style("padding", "5px");


    var mouseover = function(d) {
      Tooltip.style("opacity", 1);
      d3.select(this)
        .style("stroke", "black")
        .style("opacity", 1);
    };

    var mousemove = function(event, d) {
      Tooltip
        .html("The exact value of<br>this cell is: " + d.value)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY + 10) + "px");
    };

    var mouseleave = function(d) {
      Tooltip.style("opacity", 0);
      d3.select(this)
        .style("stroke", "none")
        .style("opacity", 0.8);
    };

    svg.selectAll()
      .data(data, function(d) { return d.group + ':' + d.variable; })
      .enter()
      .append("rect")
        .attr("x", function(d) { return x(d.group); })
        .attr("y", function(d) { return y(d.variable); })
        .attr("rx", 4)
        .attr("ry", 4)
        .attr("width", x.bandwidth())
        .attr("height", y.bandwidth())
        .style("fill", function(d) { return myColor(d.value); })
        .style("stroke-width", 2)
        .style("stroke", "none")
        .style("opacity", 0.8)
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave);

  })
})();

(function() {
  // set the dimensions and margins of the graph
  const width = 1000,
      height = 500, // Height adjusted to accommodate the legend
      margin = 40;

  // The radius of the pieplot is half the width or half the height (smallest one). I subtract a bit of margin.
  const radius = Math.min(width, height) / 2 - margin

  // append the svg object to the div called 'my_dataviz'
  const svg = d3.select("#donut")
    .append("svg")
      .attr("width", width)
      .attr("height", height)
    .append("g")
      .attr("transform", `translate(${width/2},${height/2 - margin})`);

  // Create dummy data
  const data = {
    "Higher Income": 80, 
    "Good Income": 71, 
    "Moderate Income": 62, 
    "Not Good Income": 57, 
    "Lower Income": 60
  }

  // set the color scale
  const color = d3.scaleOrdinal()
    .domain(Object.keys(data))
    .range(d3.schemeDark2);

  // Compute the position of each group on the pie:
  const pie = d3.pie()
    .sort(null) // Do not sort group by size
    .value(d => d[1])
  const data_ready = pie(Object.entries(data))

  // The arc generator
  const arc = d3.arc()
    .innerRadius(radius * 0.5)         // This is the size of the donut hole
    .outerRadius(radius * 0.8)

  // Another arc that won't be drawn. Just for labels positioning
  const outerArc = d3.arc()
    .innerRadius(radius * 0.9)
    .outerRadius(radius * 0.9)

  // Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
  svg
    .selectAll('allSlices')
    .data(data_ready)
    .join('path')
    .attr('d', arc)
    .attr('fill', d => color(d.data[0])) // Use the first data element for color
    .attr("stroke", "white")
    .style("stroke-width", "2px")
    .style("opacity", 0.7)

  // Add the polylines between chart and labels:
  svg
    .selectAll('allPolylines')
    .data(data_ready)
    .join('polyline')
      .attr("stroke", "black")
      .style("fill", "none")
      .attr("stroke-width", 1)
      .attr('points', function(d) {
        const posA = arc.centroid(d) // line insertion in the slice
        const posB = outerArc.centroid(d) // line break: we use the other arc generator that has been built only for that
        const posC = outerArc.centroid(d); // Label position = almost the same as posB
        const midangle = d.startAngle + (d.endAngle - d.startAngle) / 2 // we need the angle to see if the X position will be at the extreme right or extreme left
        posC[0] = radius * 0.95 * (midangle < Math.PI ? 1 : -1); // multiply by 1 or -1 to put it on the right or on the left
        return [posA, posB, posC]
      })

  // Add the polylines between chart and labels:
  svg.selectAll('allLabels')
    .data(data_ready)
    .join('text')
      .text(d => `${d.data[0]} life expectancy is ${d.data[1]}`) // Include the descriptive text and value
      .attr('transform', function(d) {
          const pos = outerArc.centroid(d);
          const midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
          pos[0] = radius * 0.99 * (midangle < Math.PI ? 1 : -1);
          return `translate(${pos})`;
      })
      .style('text-anchor', function(d) {
          const midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
          return (midangle < Math.PI ? 'start' : 'end')
      });
})();

(function() {
  // Set the dimensions and margins of the graph
  const margin = {top: 10, right: 30, bottom: 50, left: 70}, // Adjusted for axis labels
      width = 800 - margin.left - margin.right,
      height = 550 - margin.top - margin.bottom;

  // Append the svg object to the body of the page
  const svg = d3.select("#ScatterThinness")
    .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

  // Read the data
  d3.csv("https://raw.githubusercontent.com/behnoudshafizadeh/Perspolis/master/thinness.csv").then(function(data) {

    // Add X axis
    const x = d3.scaleLinear()
      .domain([0, 30])
      .range([0, width]);
    svg.append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(x));

    // X axis label
    svg.append("text")
      .attr("text-anchor", "end")
      .attr("x", width)
      .attr("y", height + margin.top + 20)
      .text("Thinness 5-9 years");

    // Add Y axis
    const y = d3.scaleLinear()
      .domain([45, 85])
      .range([height, 0]);
    svg.append("g")
      .call(d3.axisLeft(y));

    // Y axis label
    svg.append("text")
      .attr("text-anchor", "end")
      .attr("transform", "rotate(-90)")
      .attr("y", -margin.left + 30)
      .attr("x", -margin.top)
      .text("Life expectancy");

    // Add a tooltip div
    const tooltip = d3.select("#ScatterThinness")
      .append("div")
      .style("opacity", 0)
      .attr("class", "tooltip")
      .style("background-color", "white")
      .style("border", "solid")
      .style("border-width", "1px")
      .style("border-radius", "5px")
      .style("color", "black")
      .style("padding", "10px");

      const mouseover = function(event, d) {
        tooltip
          .style("opacity", 1);
      }
      
      const mousemove = function(event, d) {
        tooltip
          .html(`Country: ${d.Country}<br>Thinness 5-9 years: ${d.GrLivArea}<br>Life expectancy: ${d.SalePrice}`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY + 10) + "px");
      }
      
      const mouseleave = function(event, d) {
        tooltip
          .transition()
          .duration(200)
          .style("opacity", 0);
      }

    // Add dots
    svg.append('g')
      .selectAll("dot")
      .data(data.filter(function(d,i){return i<193}))
      .enter()
      .append("circle")
        .attr("cx", function (d) { return x(d.GrLivArea); })
        .attr("cy", function (d) { return y(d.SalePrice); })
        .attr("r", 7)
        .style("fill", "#69b3a2")
        .style("opacity", 0.3)
        .style("stroke", "black")
      .on("mouseover", mouseover)
      .on("mousemove", mousemove)
      .on("mouseleave", mouseleave);

  });
})();

(function() {

  const margin = {top: 10, right: 200, bottom: 50, left: 50},
  width = 800 - margin.left - margin.right,
  height = 600 - margin.top - margin.bottom;

// append the svg object to the body of the page
const svg = d3.select("#bubblechart")
.append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
.append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

    // Add a tooltip div
    const tooltip = d3.select("#bubblechart")
      .append("div")
      .style("opacity", 0)
      .attr("class", "tooltip")
      .style("background-color", "white")
      .style("border", "solid")
      .style("border-width", "1px")
      .style("border-radius", "5px")
      .style("color", "black")
      .style("padding", "10px");

      const mouseover = function(event, d) {
        tooltip
          .style("opacity", 1);
      }
      
      const mousemove = function(event, d) {
        tooltip
        .html(`Country: ${d.country}<br>Continent: ${d.continent}<br>Life Expectancy: ${d.lifeExp}<br>Population: ${d.pop}<br>BMI: ${d.gdpPercap}`)
        .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY + 10) + "px");
      }
      
      const mouseleave = function(event, d) {
        tooltip
          .transition()
          .duration(200)
          .style("opacity", 0);
      }
//Read the data
d3.csv("https://raw.githubusercontent.com/behnoudshafizadeh/Perspolis/master/BubbleLife.csv").then( function(data) {

// Add X axis
const x = d3.scaleLinear()
  .domain([0, 60000])
  .range([ 0, width ]);
svg.append("g")
  .attr("transform", `translate(0, ${height})`)
  .call(d3.axisBottom(x));
    // X axis label
svg.append("text")
    .attr("text-anchor", "end")
    .attr("x", width)
    .attr("y", height + margin.top + 20)
    .text("GDP");

// Add Y axis
const y = d3.scaleLinear()
  .domain([45, 85])
  .range([ height, 0]);
svg.append("g")
  .call(d3.axisLeft(y));
  // Y axis label
  svg.append("text")
    .attr("text-anchor", "end")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left + 20)
    .attr("x", -margin.top)
    .text("Life Expectancy");
// Add a scale for bubble size
const z = d3.scaleLinear()
  .domain([200000, 1310000000])
  .range([ 4, 40]);

// Add a scale for bubble color
const myColor = d3.scaleOrdinal()
  .domain(["Asia", "Europe", "North America","South America", "Africa", "Oceania"])
  .range(d3.schemeSet2);

// Function to show the tooltip on mouseover

// Add dots
    svg.append('g')
      .selectAll("dot")
      .data(data)
      .join("circle")
      .attr("cx", d => x(d.gdpPercap))
      .attr("cy", d => y(d.lifeExp))
      .attr("r", d => z(d.pop))
      .style("fill", d => myColor(d.continent))
      .style("opacity", "0.7")
      .attr("stroke", "black")
      .style("stroke-width", "1px")
      .on("mouseover", mouseover)
      .on("mousemove", mousemove)
      .on("mouseleave", mouseleave);


// Add legend
const legend = svg.append("g")
.attr("transform", `translate(${width}, ${20})`);

myColor.domain().forEach((continent, i) => {
const legendRow = legend.append("g")
  .attr("transform", `translate(0, ${i * 20})`);

legendRow.append("rect")
  .attr("width", 10)
  .attr("height", 10)
  .attr("fill", myColor(continent));

legendRow.append("text")
  .attr("x", 20)
  .attr("y", 10)
  .attr("text-anchor", "start")
  .style("alignment-baseline", "middle")
  .text(continent);
});
});  
})();



(function() {
// set the dimensions and margins of the graph
const margin = {top: 40, right: 150, bottom: 60, left: 30},
    width = 600 - margin.left - margin.right,
    height = 520 - margin.top - margin.bottom;

// append the svg object to the body of the page
const svg = d3.select("#bubbleSt3")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

//Read the data
d3.csv("https://raw.githubusercontent.com/behnoudshafizadeh/Perspolis/master/Bubble.csv").then( function(data) {

  // ---------------------------//
  //       AXIS  AND SCALE      //
  // ---------------------------//

  // Add X axis
  const x = d3.scaleLinear()
    .domain([0, 100])
    .range([ 0, width ]);
  svg.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x).ticks(3));

  // Add X axis label:
  svg.append("text")
      .attr("text-anchor", "end")
      .attr("x", width)
      .attr("y", height+50 )
      .text("BMI");

  // Add Y axis
  const y = d3.scaleLinear()
    .domain([35, 90])
    .range([ height, 0]);
  svg.append("g")
    .call(d3.axisLeft(y));

  // Add Y axis label:
  svg.append("text")
      .attr("text-anchor", "end")
      .attr("x", 0)
      .attr("y", -20 )
      .text("Life expectancy")
      .attr("text-anchor", "start")

  // Add a scale for bubble size
  const z = d3.scaleSqrt()
    .domain([200000, 1310000000])
    .range([ 2, 30]);

  // Add a scale for bubble color
  const myColor = d3.scaleOrdinal()
    .domain(["Asia", "Europe", "North-America","South-America", "Africa", "Oceania"])
    .range(d3.schemeSet1);


  // ---------------------------//
  //      TOOLTIP               //
  // ---------------------------//

  // -1- Create a tooltip div that is hidden by default:
  const tooltip = d3.select("#bubbleSt3")
    .append("div")
      .style("opacity", 0)
      .attr("class", "tooltip")
      .style("background-color", "black")
      .style("border-radius", "5px")
      .style("padding", "10px")
      .style("color", "white")

  // -2- Create 3 functions to show / update (when mouse move but stay on same circle) / hide the tooltip
  const showTooltip = function(event, d) {
    tooltip
      .transition()
      .duration(200)
    tooltip
      .style("opacity", 1)
      .html("Country: " + d.country + "<br>Life Expectancy: " + d.lifeExp + "<br>Population: " + d.pop + "<br>GDP Per Capita: " + d.gdpPercap)
      .style("left", (event.pageX + 15) + "px") // Adjust position to prevent overlap
      .style("top", (event.pageY + 15) + "px")
  }
  const moveTooltip = function(event, d) {
    tooltip
      .style("left", (event.x)/2 + "px")
      .style("top", (event.y)/2-50 + "px")
  }
  const hideTooltip = function(event, d) {
    tooltip
      .transition()
      .duration(200)
      .style("opacity", 0)
  }


  // ---------------------------//
  //       HIGHLIGHT GROUP      //
  // ---------------------------//

  // What to do when one group is hovered
  const highlight = function(event, d){
    // reduce opacity of all groups
    d3.selectAll(".bubbles").style("opacity", .05)
    // expect the one that is hovered
    d3.selectAll("."+d).style("opacity", 1)
  }

  // And when it is not hovered anymore
  const noHighlight = function(event, d){
    d3.selectAll(".bubbles").style("opacity", 1)
  }


  // ---------------------------//
  //       CIRCLES              //
  // ---------------------------//

  // Add dots
  svg.append('g')
    .selectAll("dot")
    .data(data)
    .join("circle")
      .attr("class", function(d) { return "bubbles " + d.continent })
      .attr("cx", d => x(d.gdpPercap))
      .attr("cy", d => y(d.lifeExp))
      .attr("r", d => z(d.pop))
      .style("fill", d => myColor(d.continent))
    // -3- Trigger the functions for hover
    .on("mouseover", showTooltip )
    .on("mousemove", moveTooltip )
    .on("mouseleave", hideTooltip )



    // ---------------------------//
    //       LEGEND              //
    // ---------------------------//

    // Add legend: circles
    const valuesToShow = [10000000, 100000000, 1000000000]
    const xCircle = 390
    const xLabel = 440
    svg
      .selectAll("legend")
      .data(valuesToShow)
      .join("circle")
        .attr("cx", xCircle)
        .attr("cy", d => height - 100 - z(d))
        .attr("r", d => z(d))
        .style("fill", "none")
        .attr("stroke", "black")

    // Add legend: segments
    svg
      .selectAll("legend")
      .data(valuesToShow)
      .join("line")
        .attr('x1', d => xCircle + z(d))
        .attr('x2', xLabel)
        .attr('y1', d => height - 100 - z(d))
        .attr('y2', d => height - 100 - z(d))
        .attr('stroke', 'black')
        .style('stroke-dasharray', ('2,2'))

    // Add legend: labels
    svg
      .selectAll("legend")
      .data(valuesToShow)
      .join("text")
        .attr('x', xLabel)
        .attr('y', d => height - 100 - z(d))
        .text( d => d/1000000)
        .style("font-size", 10)
        .attr('alignment-baseline', 'middle')

    // Legend title
    svg.append("text")
      .attr('x', xCircle)
      .attr("y", height - 100 +30)
      .text("Population (M)")
      .attr("text-anchor", "middle")

    // Add one dot in the legend for each name.
    const size = 20
    const allgroups = ["Asia", "Europe", "North-America","South-America", "Africa", "Oceania"]
    svg.selectAll("myrect")
      .data(allgroups)
      .join("circle")
        .attr("cx", 390)
        .attr("cy", (d,i) => 10 + i*(size+5)) // 100 is where the first dot appears. 25 is the distance between dots
        .attr("r", 7)
        .style("fill", d =>  myColor(d))
        .on("mouseover", highlight)
        .on("mouseleave", noHighlight)

    // Add labels beside legend dots
    svg.selectAll("mylabels")
      .data(allgroups)
      .enter()
      .append("text")
        .attr("x", 390 + size*.8)
        .attr("y", (d,i) =>  i * (size + 5) + (size/2)) // 100 is where the first dot appears. 25 is the distance between dots
        .style("fill", d => myColor(d))
        .text(d => d)
        .attr("text-anchor", "left")
        .style("alignment-baseline", "middle")
        .on("mouseover", highlight)
        .on("mouseleave", noHighlight)
  })
})();

//--------------boxplot-------------------//
(function() {
  const margin = {top: 30, right: 20, bottom: 30, left: 120},
  width = 600 - margin.left - margin.right,
  height = 500 - margin.top - margin.bottom;
 
       var tooltip = null;
 
       // Append the svg object to the div of the chart
       var svg = d3.select("#boxplot")
          .append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
          .append("g")
          .attr("transform",
             "translate(" + margin.left + "," + margin.top + ")");
 
       // Read the data and compute summary statistics for each country
       d3.csv("https://raw.githubusercontent.com/behnoudshafizadeh/Perspolis/master/boxplot.csv").then(function (data) {
 
          var sumstat = d3.group(data, d => d.country);
          sumstat = Array.from(sumstat, ([key, values]) => {
             q1 = d3.quantile(values.map(g => g.value).sort(d3.ascending), 0.25);
             median = d3.quantile(values.map(g => g.value).sort(d3.ascending), 0.5);
             q3 = d3.quantile(values.map(g => g.value).sort(d3.ascending), 0.75);
             interQuantileRange = q3 - q1;
 
             // Find the minimum and maximum values in the dataset
             var datasetMin = d3.min(values, d => d.value);
             var datasetMax = d3.max(values, d => d.value);
 
             // Calculate min and max while considering the dataset boundaries
             min = Math.max(q1 - 1.5 * interQuantileRange, datasetMin);
             max = Math.min(q3 + 1.5 * interQuantileRange, datasetMax);
 
             mean = d3.mean(values, d => d.value); // Calculate mean for each country
 
             return {
                key: key,
                points: values,
                n_values: values.length,
                value: {
                   q1: q1,
                   median: median,
                   q3: q3,
                   interQuantileRange: interQuantileRange,
                   min: min,
                   max: max,
                   mean: mean
                }
             }
          });
 
          // Show the Y scale
          var y = d3.scaleBand()
             .range([0, height])
             .domain(data.map(d => d.country).filter((value, index, self) => self.indexOf(value) === index))
             .paddingInner(1)
             .paddingOuter(.5)
          svg.append("g")
             .attr("class", "axis")
             .call(d3.axisLeft(y))
             .selectAll("text")
             .attr("fill", "black")
             .style("text-anchor", "end");
 
          // Show the X scale
          var x = d3.scaleLinear()
             .domain([35, 100])
             .range([0, width])
          svg.append("g").attr("class", "axis").attr("transform", "translate(0," + height + ")")
             .call(d3.axisBottom(x).tickFormat((d) => (d === 0 ? d : d + " ")))
             .selectAll("text")
             .attr("fill", "black");
               
          // Add X axis label
          svg.append("text")
            .attr("class", "axis-label")
            .attr("x", width - 20)
            .attr("y", height + margin.bottom) // Adjusted the y-coordinate
            .style("text-anchor", "middle")
            .style("fill", "black")
            .style("font-size", 10)
            .text("Life Expectancy");
 
          // Add a second X-axis at the top
          svg.append("g")
             .attr("class", "axis")
             .attr("transform", "translate(0, 0)")
             .call(d3.axisTop(x).tickFormat((d) => (d === 0 ? d : d + " ")))
             .selectAll("text")
             .attr("fill", "black");
                    
          // Add second X axis label
          svg.append("text")
            .attr("class", "axis-label")
            .attr("x", width - 30)
            .attr("y", margin.top - 75) // Adjusted the y-coordinate
            .style("text-anchor", "middle")
            .style("fill", "black")
            .style("font-size", 10)
            .text("AROPE people");
 
          // Select lines of X,Y axes
          svg.selectAll(".axis")
             .selectAll("line")
             .attr("stroke", "black");
 
          svg.selectAll("line.grid-line")
             .data(y.domain()) // Use y.domain() to get the unique values for the band scale
             .enter()
             .append("line")
             .attr("class", "grid-line")
             .attr("x1", 0)
             .attr("x2", width)
             .attr("y1", d => y(d) + y.bandwidth() / 2)
             .attr("y2", d => y(d) + y.bandwidth() / 2)
             .attr("stroke", "rgba(0, 0, 0, 0.1)");
 
          svg.selectAll("line.grid-line-x")
             .data(x.ticks())
             .enter()
             .append("line")
             .attr("class", "grid-line-x")
             .attr("x1", d => x(d))
             .attr("x2", d => x(d))
             .attr("y1", 0)
             .attr("y2", height)
             .attr("stroke", "rgba(0, 0, 0, 0.1)");
 
          // Show the main horizontal line
          svg
             .selectAll("horizLines")
             .data(sumstat)
             .enter()
             .append("line")
             .attr("x1", function (d) {
                return (x(d.value.min))
             })
             .attr("x2", function (d) {
                return (x(d.value.max))
             })
             .attr("y1", function (d) {
                return (y(d.key) + y.bandwidth() / 2)
             })
             .attr("y2", function (d) {
                return (y(d.key) + y.bandwidth() / 2)
             })
             .attr("stroke", "black")
             .style("width", 40)
 
          // Rectangle for the main box
          var boxHeight = 15
          svg
             .selectAll("boxes")
             .data(sumstat)
             .enter()
             .append("rect")
             .attr("x", function (d) {
                return (x(d.value.q1))
             })
             .attr("y", function (d) {
                return (y(d.key) - boxHeight / 2)
             })
             .attr("width", function (d) {
                return (x(d.value.q3) - x(d.value.q1))
             })
             .attr("height", boxHeight)
             .attr("stroke", "black")
             .attr("stroke-width", 1)
             .style("fill", "#69b3a2")
             .on("mouseover", function (event, d) {
                d3.select(this).attr("stroke-width", 2);
 
                if (!tooltip) {
                   tooltip = d3.select("body").append("div")
                      .attr("class", "tooltip")
                      .style("opacity", 0);
                }
 
                // Show the tooltip
                tooltip.transition()
                   .duration(200)
                   .style("opacity", 1);
 
                tooltip.html(`Computed on ${d.n_values} points<br>
                                   <i>Mean</i>: ${d.value.mean.toFixed(1)}<br><br>
                                   <b>Lower bound</b>: ${d.value.min.toFixed(1)}<br>
                                   <b>Median</b>: ${d.value.median.toFixed(1)}<br>
                                   <b>Upper bound</b>: ${d.value.max.toFixed(1)}`)
                   .style("left", (event.pageX + 10) + "px")
                   .style("top", (event.pageY - 20) + "px");
             })
             .on("mousemove", function (event, d) {
                   // Move the tooltip with the mouse pointer
                   tooltip.style("left", (event.pageX + 10) + "px")
                      .style("top", (event.pageY + 10) + "px");
             })
             .on("mouseout", function (d) {
                d3.select(this).attr("stroke-width", 1);
 
                if (tooltip) {
                   tooltip.transition()
                      .duration(500)
                      .style("opacity", 0)
                      .remove();
                   tooltip = null; // Reset tooltip variable
                }
             });
 
          // Show the median
          svg
             .selectAll("medianLines")
             .data(sumstat)
             .enter()
             .append("line")
             .attr("x1", function (d) {
                return (x(d.value.median))
             })
             .attr("x2", function (d) {
                return (x(d.value.median))
             })
             .attr("y1", function (d) {
                return (y(d.key) - boxHeight / 2)
             })
             .attr("y2", function (d) {
                return (y(d.key) + boxHeight / 2)
             })
             .attr("stroke", "red")
             .style("width", 80)
       });


 
})();
