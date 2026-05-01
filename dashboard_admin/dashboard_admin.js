/* =====================================================
   HourSync — dashboard_admin.js
   ===================================================== */

// Gráfico de barras
const ctx = document.getElementById('atividadesChart').getContext('2d');
new Chart(ctx, {
  type: 'bar',
  data: {
    labels: ['Cursos', 'Gestão de Cursos', 'Gestão de Coord.', 'Certificados', 'Configurações'],
    datasets: [{
      label: 'Atividades',
      data: [12, 8, 5, 3, 2],
      backgroundColor: ['#6c83e6','#f4a261','#2a9d8f','#e76f51','#9b59b6'],
      borderRadius: 8,
      borderSkipped: false
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: ctx => `Atividades: ${ctx.raw}` } }
    },
    scales: {
      y: { beginAtZero: true, max: 100, grid: { color: '#e9ecef' }, title: { display: true, text: 'Quantidade', color: '#6c757d' } },
      x: { grid: { display: false }, ticks: { maxRotation: 45, minRotation: 45 } }
    }
  }
});

// Pesquisa na tabela
document.getElementById("searchInput")?.addEventListener("input", e => {
  const term = e.target.value.toLowerCase();
  document.querySelectorAll(".table-custom tbody tr").forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(term) ? "" : "none";
  });
});
