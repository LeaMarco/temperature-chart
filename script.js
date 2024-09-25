const margin = {top: 20, right: 30, bottom: 40, left: 90},
      pointSpacing = 10,
      height = 800 - margin.top - margin.bottom,
      width = window.innerWidth * 0.8 - margin.left - margin.right;

function getColor(temp) {
  switch(temp) {
    case -2: return "darkblue";
    case -1: return "aqua";
    case 0: return "gray";
    case 1: return "orange";
    case 2: return "red";
    default: return "black";
  }
}

function convertSubmodo(submodo) {
  switch(submodo) {
    case 'Frio --': return -2;
    case 'Frio -': return -1;
    case 'Calor +': return 1;
    case 'Calor ++': return 2;
    default: return 0;
  }
}

d3.csv("archivo_completo.csv").then(data => {
  console.log(data);
  
  const svgContainer = d3.select("#chart")
    .append("div")
    .style("overflow-x", "scroll")
    .style("background", "linear-gradient(170deg, grey , white)")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  data.forEach(d => {
    d["TempControl"] = +d["TempControl"];
    d["TempPollitos"] = +d["TempPollitos"];
    d["TempAmbiente"] = +d["TempAmbiente"];
    
    d["TempControl"] = convertSubmodo(d.Submodo);
    
    d.ventiladoresEncendidos = ["Rec1", "Rec2", "Renov1", "Renov2", "Renov3"]
      .map(key => d[key] === 'Encendido')
      .filter(v => v).length;
  });

  const x = d3.scaleLinear()
    .domain([0, data.length - 1])
    .range([0, width]);

  const yTemp = d3.scaleLinear().domain([10, 35]).range([height, 0]);

  const yVent = d3.scaleLinear().domain([0, 5]).range([height, height / 1.3]);

  const xAxis = svgContainer.append("g").attr("transform", `translate(0, ${height})`).call(d3.axisBottom(x));
  const yAxis = svgContainer.append("g").call(d3.axisLeft(yTemp));

  const bars = svgContainer.selectAll(".bar")
    .data(data)
    .enter()
    .append("rect")
    .attr("x", (d, i) => x(i))
    .attr("y", d => yVent(d.ventiladoresEncendidos))
    .attr("width", 8)
    .attr("height", d => height - yVent(d.ventiladoresEncendidos))
    .attr("fill", d => getColor(d["TempControl"]))
    .attr("opacity", 0.7);

  const lineExterior = d3.line()
    .x((d, i) => x(i))
    .y(d => yTemp(d["TempAmbiente"]) || 0);

  const lineExteriorPath = svgContainer.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "blue")
    .attr("stroke-width", 3)
    .attr("d", lineExterior);

  const linePollito = d3.line()
    .x((d, i) => x(i))
    .y(d => yTemp(d["TempPollitos"]) || null);

  const linePollitoPath = svgContainer.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "green")
    .attr("stroke-width", 3)
    .attr("d", linePollito);

  const brush = d3.brushX()
    .extent([[0, 0], [width, height]])
    .on("end", updateChart);

  svgContainer.append("g")
    .attr("class", "brush")
    .call(brush);

  function updateChart(event) {
    const extent = event.selection;
    if (!extent) return;

    const [x0, x1] = extent.map(x.invert);

    x.domain([x0, x1]);

    svgContainer.select(".brush").call(brush.move, null);

    xAxis.transition().duration(1000).call(d3.axisBottom(x));

    bars
      .transition().duration(1000)
      .attr("x", (d, i) => x(i) - 10);

    lineExteriorPath
      .transition().duration(1000)
      .attr("d", lineExterior);

    linePollitoPath
      .transition().duration(1000)
      .attr("d", linePollito);
  }

  svgContainer.on("dblclick", function() {
    x.domain([0, data.length - 1]);
    xAxis.transition().duration(1000).call(d3.axisBottom(x));

    bars
      .transition().duration(1000)
      .attr("x", (d, i) => x(i) - 10);

    lineExteriorPath
      .transition().duration(1000)
      .attr("d", lineExterior);

    linePollitoPath
      .transition().duration(1000)
      .attr("d", linePollito);
  });

  const lineObjetivo = d3.line()
  .x((d, i) => x(i))
  .y(d => yTemp(24));

  const lineObjetivoSup = d3.line()
  .x((d, i) => x(i))
  .y(d => yTemp(25));

  const lineSup = d3.line()
  .x((d, i) => x(i))
  .y(d => yTemp(26));

  const lineObjetivoInf = d3.line()
  .x((d, i) => x(i))
  .y(d => yTemp(23));

  const lineInf = d3.line()
  .x((d, i) => x(i))
  .y(d => yTemp(22));

  svgContainer.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-width", 0.7)
    .attr("d", lineObjetivo);

  svgContainer.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "green")
    .attr("stroke-width", 0.5)
    .attr("d", lineObjetivoInf);

  svgContainer.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "green")
    .attr("stroke-width", 0.5)
    .attr("d", lineObjetivoSup);

  svgContainer.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "yellow")
    .attr("stroke-width", 0.5)
    .attr("d", lineSup);

  svgContainer.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "yellow")
    .attr("stroke-width", 0.5)
    .attr("d", lineInf);

  svgContainer.append("text")
    .attr("text-anchor", "middle")
    .attr("transform", `translate(${-margin.left + 40},${height / 2})rotate(-90)`)
    .text("Temp [°C]");
});
