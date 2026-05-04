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
    const ctx = document.getElementById('certChart')?.getContext('2d');
    if (ctx) {
      if (grafico) grafico.destroy();

      // Agrupar por mês
      const meses = {};
      certificados.forEach(c => {
        if (!c.criadoEm) return;
        const mes = new Date(c.criadoEm).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
        meses[mes] = (meses[mes] || 0) + 1;
      });
      const labels = Object.keys(meses).slice(-6);
      const valores = labels.map(m => meses[m]);

      grafico = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Certificados enviados',
            data: valores,
            backgroundColor: '#6c83e6',
            borderRadius: 6,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
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

    // Atividades Recentes
    const activityList = document.getElementById('activityList');
    if (activityList) {
      const recentes = [...certificados]
        .sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm))
        .slice(0, 6);

      const itens = recentes.map(c => {
        const status = c.status === 'APROVADO' ? 'aprovado' : c.status === 'REJEITADO' ? 'rejeitado' : 'pendente';
        const cor = status === 'aprovado' ? '#22c55e' : status === 'rejeitado' ? '#ef4444' : '#f59e0b';
        const data = c.criadoEm ? new Date(c.criadoEm).toLocaleDateString('pt-BR') : '—';
        return `<div class="activity-item" style="border-left:3px solid ${cor};padding:6px 10px;margin-bottom:8px;border-radius:4px;background:#f8f9ff;">
          <div style="font-size:.82rem;font-weight:600;">${c.alunoId?.nome || '—'}</div>
          <div style="font-size:.75rem;color:#6c757d;">${c.categoriaId?.nome || '—'} — ${data}</div>
        </div>`;
      }).join('');

      activityList.innerHTML = `<h6><strong><i class="bi bi-clock-history"></i> Atividades Recentes</strong></h6>${itens || '<p class="text-muted small">Nenhuma atividade.</p>'}`;
    }

  } catch (err) {
    console.error('Erro ao carregar dashboard:', err);
  }
}

carregarDashboard();
