/*
  script.js
  Controla:
  - carga de datos
  - nodos radiales
  - gráficos
  - panel de detalle
*/

const fmt = new Intl.NumberFormat("es-PE");
let DATA = null;
let populationChart = null;
let coverageChart = null;

async function init(){
  const response = await fetch("data.json");
  DATA = await response.json();

  renderHeader();
  renderRadialNodes();
  renderDetail(DATA.cursos[0]);
  renderCharts();
  renderRanking();
}

function percent(value,total){
  if(!total) return 0;
  return (value/total*100);
}

function coverage(item){
  if(!item.poblacion) return 0;
  return item.atendidos / item.poblacion * 100;
}

function intensity(item){
  if(!item.atendidos) return 0;
  return item.atenciones / item.atendidos;
}

function renderHeader(){
  const totalAtendidos = DATA.cursos.reduce((a,b)=>a+(b.atendidos||0),0);
  const totalAtenciones = DATA.cursos.reduce((a,b)=>a+(b.atenciones||0),0);
  const cobertura = percent(totalAtendidos, DATA.metadata.poblacion_total);

  document.getElementById("totalPopulation").textContent = fmt.format(DATA.metadata.poblacion_total);
  document.getElementById("kpiIpress").textContent = DATA.metadata.ipress;
  document.getElementById("kpiAtendidos").textContent = fmt.format(totalAtendidos);
  document.getElementById("kpiAtenciones").textContent = fmt.format(totalAtenciones);
  document.getElementById("kpiCobertura").textContent = cobertura.toFixed(1) + "%";
}

function renderRadialNodes(){
  const positions = {
    prenatal:"pos-prenatal",
    nino:"pos-nino",
    adolescente:"pos-adolescente",
    joven:"pos-joven",
    adulto:"pos-adulto",
    mayor:"pos-mayor"
  };

  const box = document.getElementById("radialNodes");

  box.innerHTML = DATA.cursos.map(item=>{
    const pobPct = percent(item.poblacion, DATA.metadata.poblacion_total).toFixed(1);
    const cov = coverage(item).toFixed(1);

    return `
      <article class="course-node ${positions[item.id]}" style="--node-color:${item.color}" data-id="${item.id}">
        <div class="course-icon"><i class="fa-solid ${item.icono}"></i></div>
        <h3>${item.nombre}</h3>
        <small>${item.rango}</small>
        <div class="node-metrics">
          <span><b>${fmt.format(item.poblacion)}</b>Población</span>
          <span><b>${pobPct}%</b>Part.</span>
          <span><b>${cov}%</b>Cobertura</span>
        </div>
      </article>
    `;
  }).join("");

  document.querySelectorAll(".course-node").forEach(node=>{
    node.addEventListener("click",()=>{
      const item = DATA.cursos.find(x=>x.id === node.dataset.id);
      document.querySelectorAll(".course-node").forEach(n=>n.classList.remove("active"));
      node.classList.add("active");
      renderDetail(item);
    });
  });

  document.querySelector(".course-node").classList.add("active");
}

function renderDetail(item){
  const pobPct = percent(item.poblacion, DATA.metadata.poblacion_total);
  const cov = coverage(item);
  const inten = intensity(item);

  const semaforo = cov >= 40 ? "🟢 Adecuado" : cov >= 20 ? "🟡 En seguimiento" : "🔴 Brecha alta";

  document.getElementById("detailPanel").innerHTML = `
    <h3><i class="fa-solid ${item.icono}" style="color:${item.color}"></i> ${item.nombre}</h3>
    <p><strong>Rango:</strong> ${item.rango}</p>
    <p><strong>Lectura gerencial:</strong> este curso de vida representa el ${pobPct.toFixed(1)}% de la población asignada RIS Ate.</p>

    <div class="detail-kpis">
      <div><small>Población</small><strong>${fmt.format(item.poblacion)}</strong></div>
      <div><small>Atendidos</small><strong>${fmt.format(item.atendidos)}</strong></div>
      <div><small>Atenciones</small><strong>${fmt.format(item.atenciones)}</strong></div>
      <div><small>Cobertura</small><strong>${cov.toFixed(1)}%</strong></div>
      <div><small>Intensidad</small><strong>${inten.toFixed(2)}</strong></div>
      <div><small>Semáforo</small><strong>${semaforo}</strong></div>
    </div>
  `;
}

function renderCharts(){
  const labels = DATA.cursos.map(x=>x.nombre);
  const pop = DATA.cursos.map(x=>x.poblacion);
  const cov = DATA.cursos.map(x=>Number(coverage(x).toFixed(1)));
  const colors = DATA.cursos.map(x=>x.color);

  populationChart = new Chart(document.getElementById("populationChart"),{
    type:"doughnut",
    data:{
      labels,
      datasets:[{
        data:pop,
        backgroundColor:colors
      }]
    },
    options:{
      responsive:true,
      maintainAspectRatio:false,
      plugins:{
        legend:{position:"bottom"}
      }
    }
  });

  coverageChart = new Chart(document.getElementById("coverageChart"),{
    type:"bar",
    data:{
      labels,
      datasets:[{
        label:"Cobertura %",
        data:cov,
        backgroundColor:colors,
        borderRadius:10
      }]
    },
    options:{
      responsive:true,
      maintainAspectRatio:false,
      plugins:{
        legend:{display:false}
      },
      scales:{
        y:{beginAtZero:true}
      }
    }
  });
}

function renderRanking(){
  const max = Math.max(...DATA.ipress_ranking.map(x=>x.poblacion));
  const box = document.getElementById("ipressRanking");

  box.innerHTML = DATA.ipress_ranking.map((x,i)=>{
    const pct = max ? x.poblacion/max*100 : 0;
    return `
      <div class="rank-item">
        <strong>${i+1}. ${x.ipress}</strong>
        <small>${fmt.format(x.poblacion)} habitantes</small>
        <div class="rank-bar"><span style="width:${pct}%"></span></div>
      </div>
    `;
  }).join("");
}

init();
