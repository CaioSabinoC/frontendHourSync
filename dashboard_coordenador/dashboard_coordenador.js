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
    const [certificados, alunos] = await Promise.all([
      apiFetch('/certificados'),
      apiFetch('/usuarios/alunos'),
    ]);

    const pendentes  = certificados.filter(c => c.status === 'PENDENTE');
    const aprovados  = certificados.filter(c => c.status === 'APROVADO');
    const rejeitados = certificados.filter(c => c.status === 'REJEITADO');
    const horasValidadas = aprovados.reduce((s, c) => s + (c.horasAprovadas || 0), 0);

    // Cards
    document.getElementById('pendentesCount').innerText    = pendentes.length;
    document.getElementById('aprovadosCount').innerText    = aprovados.length;
    document.getElementById('rejeitadosCount').innerText   = rejeitados.length;
    document.getElementById('horasValidadasCount').innerHTML = `${horasValidadas}<span class="stat-unit">h</span>`;

    // Gráfico
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
          plugins: {
            legend: { position: 'bottom' }
          }
        }
      });
    }

    // Tabela — certificados pendentes
    const tbody = document.getElementById('certificadosTableBody');
    if (tbody) {
      if (pendentes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">Nenhum certificado pendente.</td></tr>';
      } else {
        tbody.innerHTML = pendentes
          .sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm))
          .slice(0, 15)
          .map(c => {
            const data = c.criadoEm ? new Date(c.criadoEm).toLocaleDateString('pt-BR') : '—';
            return `
              <tr>
                <td><strong>${c.alunoId?.nome || '—'}</strong></td>
                <td>${c.cursoId?.nome || '—'}</td>
                <td>${c.turma || '—'}</td>
                <td>${c.categoriaId?.nome || '—'}</td>
                <td>${c.horas || 0}h</td>
                <td>${data}</td>
                <td><span class="status-pendente"><i class="bi bi-hourglass-split me-1"></i>Pendente</span></td>
                <td><a href="../certificados_coordenador/certificados_coordenador.html" class="btn-analisar">Analisar</a></td>
              </tr>`;
          }).join('');
      }
    }

  } catch (err) {
    console.error('Erro ao carregar dashboard:', err);
  }
}

carregarDashboard();
