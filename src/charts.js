// Chart.js owns creation AND teardown here. A view asks for a chart by spec
// and calls destroyAll() on unmount, so navigating never leaks an instance.

const GOLD  = '#c9a84c';
const GOLD2 = 'rgba(201,168,76,0.15)';
export const PALETTE = {
  gold: GOLD,
  green: '#2ec4a0',
  red:   '#e05c6a',
  amber: '#f0a040',
  blue:  '#4da8e8',
  muted: 'rgba(255,255,255,0.12)',
};

export const STATUS_COLOUR = {
  complete:    PALETTE.green,
  in_progress: PALETTE.blue,
  awaiting:    PALETTE.amber,
  overdue:     PALETTE.red,
  draft:       PALETTE.muted,
};

let configured = false;

function applyDefaults() {
  if (configured) return;
  Chart.defaults.color = '#9a9aac';
  Chart.defaults.borderColor = 'rgba(255,255,255,0.06)';
  Chart.defaults.font.family = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  Chart.defaults.font.size = 11;
  configured = true;
}

const tooltip = {
  backgroundColor: '#22223b',
  borderColor: 'rgba(201,168,76,0.3)',
  borderWidth: 1,
  titleColor: GOLD,
  bodyColor: '#e8e4da',
};

const grid = { color: 'rgba(255,255,255,0.04)' };

// Every chart made through this factory is tracked and destroyed together.
export function createChartRegistry() {
  const instances = [];

  function make(canvas, config) {
    applyDefaults();
    const chart = new Chart(canvas, config);
    instances.push(chart);
    return chart;
  }

  return {
    line(canvas, { labels, data, label = '', valueFormat = (v) => v }) {
      return make(canvas, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label,
            data,
            borderColor: GOLD,
            backgroundColor: GOLD2,
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: GOLD,
            pointRadius: 3,
            pointHoverRadius: 5,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { ...tooltip, callbacks: { label: (ctx) => ' ' + valueFormat(ctx.parsed.y) } },
          },
          scales: {
            x: { grid },
            y: { grid, ticks: { callback: (v) => valueFormat(v) } },
          },
        },
      });
    },

    bar(canvas, { labels, data, colours, horizontal = false, valueFormat = (v) => v }) {
      return make(canvas, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            data,
            backgroundColor: colours ?? GOLD,
            borderRadius: 5,
            borderSkipped: false,
          }],
        },
        options: {
          indexAxis: horizontal ? 'y' : 'x',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { ...tooltip, callbacks: { label: (ctx) => ' ' + valueFormat(ctx.parsed[horizontal ? 'x' : 'y']) } },
          },
          scales: {
            x: { grid: horizontal ? grid : { display: false },
                 ticks: horizontal ? { callback: (v) => valueFormat(v) } : {} },
            y: { grid: horizontal ? { display: false } : grid,
                 ticks: horizontal ? {} : { callback: (v) => valueFormat(v) } },
          },
        },
      });
    },

    doughnut(canvas, { labels, data, colours, valueFormat = (v) => v }) {
      return make(canvas, {
        type: 'doughnut',
        data: { labels, datasets: [{ data, backgroundColor: colours, borderWidth: 0 }] },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '62%',
          plugins: {
            legend: { position: 'right', labels: { boxWidth: 10, boxHeight: 10 } },
            tooltip: { ...tooltip, callbacks: { label: (ctx) => ' ' + valueFormat(ctx.parsed) } },
          },
        },
      });
    },

    destroyAll() {
      while (instances.length) instances.pop().destroy();
    },
  };
}
