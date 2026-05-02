const API_BASE = 'https://backendhoursync-1.onrender.com/api';

async function apiFetch(endpoint) {
  const token = localStorage.getItem('hoursync_token');
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (res.status === 401) { window.location.href = '../login/login.html'; return; }
  return res.json();
}

let grafico = null;

async function carregarDashboard() {
  try {
    const [cursos, usuarios, certificados] = await Promise.all([
      apiFetch('/cursos'),
      apiFetch('/usuarios'),
      apiFetch('/certificados'),
    ]);

    const coordenadores = usuarios.filter(u => u.role === 'COORDENADOR');
    const alunos        = usuarios.filter(u => u.role === 'ALUNO');
    const pendentes     = certificados.filter(c => c.status === 'PENDENTE');
    const aprovados     = certificados.filter(c => c.status === 'APROVADO');
    const rejeitados    = certificados.filter(c => c.status === 'REJEITADO');

    // Cards
    document.getElementById('statCursos').innerText        = cursos.length;
    document.getElementById('statCoordenadores').innerText = coordenadores.length;
    document.getElementById('statAlunos').innerText        = alunos.length;
    document.getElementById('statPendentes').innerText     = pendentes.length;

    // Resumo
    const totalHorasAprovadas = aprovados.reduce((s, c) => s + (c.horasAprovadas || 0), 0);
    const mediaHoras = alunos.length
      ? Math.round(alunos.reduce((s, a) => s + (a.horasCursadas || 0), 0) / alunos.length)
      : 0;

    const resumoEl = document.getElementById('resumoContent');
    if (resumoEl) resumoEl.innerHTML = `
      <div class="resumo-item"><span>Total de certificados</span><strong>${certificados.length}</strong></div>
      <div class="resumo-item"><span>Aprovados</span><strong style="color:#22c55e;">${aprovados.length}</strong></div>
      <div class="resumo-item"><span>Pendentes</span><strong style="color:#f59e0b;">${pendentes.length}</strong></div>
      <div class="resumo-item"><span>Rejeitados</span><strong style="color:#ef4444;">${rejeitados.length}</strong></div>
      <div class="resumo-item"><span>Total horas aprovadas</span><strong>${totalHorasAprovadas}h</strong></div>
      <div class="resumo-item"><span>Média horas por aluno</span><strong>${mediaHoras}h</strong></div>`;

    // Top cursos por certificados
    const certsPorCurso = {};
    certificados.forEach(c => {
      const nome = c.cursoId?.nome || '—';
      certsPorCurso[nome] = (certsPorCurso[nome] || 0) + 1;
    });
    const topCursos = Object.entries(certsPorCurso).sort((a, b) => b[1] - a[1]).slice(0, 4);
    const topEl = document.getElementById('topCursosContent');
    if (topEl) topEl.innerHTML = topCursos.length
      ? topCursos.map(([nome, qtd], i) => `
          <div class="top-item">
            <span class="top-rank">#${i + 1}</span>
            <span class="top-nome">${nome}</span>
            <span class="top-qtd">${qtd} cert.</span>
          </div>`).join('')
      : '<p class="text-muted small">Nenhum certificado ainda.</p>';

    // Gráfico por status (doughnut)
    const ctx = document.getElementById('atividadesChart')?.getContext('2d');
    if (ctx) {
      if (grafico) grafico.destroy();
      grafico = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Pendentes', 'Aprovados', 'Rejeitados'],
          datasets: [{
            data: [pendentes.length, aprovados.length, rejeitados.length],
            backgroundColor: ['#f59e0b', '#22c55e', '#ef4444'],
            borderWidth: 2,
            borderColor: '#fff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { position: 'bottom' },
            tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw}` } }
          }
        }
      });
    }

    // Tabela últimos certificados
    const tbody = document.getElementById('ultimosCertificadosBody');
    if (tbody) {
      const ultimos = [...certificados]
        .sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm))
        .slice(0, 8);

      tbody.innerHTML = ultimos.map(c => {
        const status = c.status.charAt(0) + c.status.slice(1).toLowerCase();
        const sClass = status === 'Aprovado' ? 'status-aprovado' : status === 'Pendente' ? 'status-pendente' : 'status-rejeitado';
        const data = c.criadoEm ? new Date(c.criadoEm).toLocaleDateString('pt-BR') : '—';
        return `
          <tr>
            <td><strong>${c.alunoId?.nome || '—'}</strong></td>
            <td>${c.cursoId?.nome || '—'}</td>
            <td>${c.categoriaId?.nome || '—'}</td>
            <td>${c.horas || 0}h</td>
            <td>${data}</td>
            <td><span class="${sClass}">${status}</span></td>
          </tr>`;
      }).join('');
    }

  } catch (err) {
    console.error('Erro ao carregar dashboard:', err);
  }
}

document.getElementById('searchInput')?.addEventListener('input', e => {
  const term = e.target.value.toLowerCase();
  document.querySelectorAll('#ultimosCertificadosBody tr').forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(term) ? '' : 'none';
  });
});

carregarDashboard();
