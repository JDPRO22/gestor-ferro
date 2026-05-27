// ===== STATE =====
let state = {
  saldo: 0,
  transacoes: [],
  obraAtiva: null,
  obrasHistorico: [],
  gastosPessoaisHoje: 0,
  ultimoDia: '',
};

function loadState() {
  try {
    const saved = localStorage.getItem('gestor_ferro_v2');
    if (saved) state = { ...state, ...JSON.parse(saved) };
  } catch(e) {}
  const hoje = new Date().toDateString();
  if (state.ultimoDia !== hoje) {
    state.gastosPessoaisHoje = 0;
    state.ultimoDia = hoje;
    saveState();
  }
}

function saveState() {
  localStorage.setItem('gestor_ferro_v2', JSON.stringify(state));
}

// ===== FORMAT =====
function fmt(v) {
  return 'R$ ' + parseFloat(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ===== TABS =====
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  const tabs = ['dashboard', 'orcamento', 'caixa', 'cobranca', 'relatorio'];
  const idx = tabs.indexOf(name);
  if (idx >= 0) document.querySelectorAll('.tab')[idx].classList.add('active');
  if (name === 'dashboard') renderDashboard();
  if (name === 'relatorio') renderRelatorio();
}

// ===== DASHBOARD =====
function renderDashboard() {
  const saldo = state.saldo;
  const el = document.getElementById('saldo-display');
  el.textContent = fmt(saldo);
  el.style.color = saldo >= 0 ? 'var(--green)' : 'var(--red)';

  const status = document.getElementById('saldo-status');
  if (saldo < 0) {
    status.innerHTML = `<div class="status-bar red"><div class="status-icon">❌</div><div><div class="status-text">Saldo negativo! Não gaste nada!</div><div class="status-sub">Você está no vermelho. Foque em cobrar.</div></div></div>`;
  } else if (saldo === 0) {
    status.innerHTML = `<div class="status-bar" style="border-color:var(--muted);background:transparent"><div class="status-icon">🔩</div><div><div class="status-text">Caixa zerado</div><div class="status-sub">Registre suas movimentações.</div></div></div>`;
  } else {
    status.innerHTML = `<div class="status-bar green"><div class="status-icon">✅</div><div><div class="status-text">Caixa no positivo</div><div class="status-sub">Mantenha o controle. Não gaste sem necessidade.</div></div></div>`;
  }

  const obraSection = document.getElementById('obra-ativa-section');
  if (state.obraAtiva) {
    obraSection.style.display = 'block';
    document.getElementById('obra-nome').textContent = '🔥 ' + state.obraAtiva.servico;
    const sinal = state.obraAtiva.sinal;
    const prazo = state.obraAtiva.prazo || 5;
    const teto = sinal / prazo;
    document.getElementById('teto-display').textContent = fmt(teto) + '/dia';
    document.getElementById('sinal-recebido-display').textContent = fmt(sinal);
    const gastos = state.gastosPessoaisHoje || 0;
    const pct = Math.min((gastos / teto) * 100, 100);
    const gauge = document.getElementById('limite-gauge');
    gauge.style.width = pct + '%';
    gauge.style.background = pct < 60 ? 'var(--green)' : pct < 85 ? 'var(--yellow)' : 'var(--red)';
    document.getElementById('limite-texto').textContent =
      gastos === 0
        ? '✅ Nada gasto pessoalmente hoje. Ótimo!'
        : `⚠️ Gastou ${fmt(gastos)} pessoal hoje (limite: ${fmt(teto)}/dia)`;
  } else {
    obraSection.style.display = 'none';
  }

  const txEl = document.getElementById('ultimas-tx');
  const tx = [...state.transacoes].reverse().slice(0, 6);
  if (tx.length === 0) {
    txEl.innerHTML = '<div class="empty-state"><div class="empty-icon">🔩</div>Nenhuma movimentação ainda</div>';
  } else {
    txEl.innerHTML = tx.map(t => `
      <div class="tx-item ${t.tipo}">
        <div>
          <div class="tx-desc">${t.desc || t.subtipo}</div>
          <div class="tx-date">${t.data}</div>
        </div>
        <div class="tx-value ${t.tipo}">${t.tipo === 'entrada' ? '+' : '-'}${fmt(t.valor)}</div>
      </div>
    `).join('');
  }
}

// ===== ORÇAMENTO =====
function calcularSplit() {
  const val = parseFloat(document.getElementById('orc-valor').value) || 0;
  document.getElementById('split-sinal').textContent = fmt(val / 2);
  document.getElementById('split-entrega').textContent = fmt(val / 2);
}

function gerarWhatsApp() {
  const cliente = document.getElementById('orc-cliente').value.trim();
  const servico = document.getElementById('orc-servico').value.trim();
  const valor = parseFloat(document.getElementById('orc-valor').value) || 0;
  const prazo = document.getElementById('orc-prazo').value.trim();

  if (!servico || valor <= 0) { showToast('❌ Preenche o serviço e o valor!', 'red'); return; }

  const sinal = valor / 2;
  const entrega = valor / 2;
  const dest = cliente ? `Olá ${cliente}!\n\n` : '';
  const texto = `${dest}🛠️ *ORÇAMENTO - ${servico}*\n\n${prazo ? `⏱️ *Prazo:* ${prazo} dias\n` : ''}💳 *Total:* ${fmt(valor)}\n\n💰 *Sinal (50% pra iniciar):* ${fmt(sinal)}\n🔒 *Saldo Final (50% na Entrega):* ${fmt(entrega)}\n\n*Obs: A liberação do serviço está vinculada à quitação na entrega.*\n\nQualquer dúvida, só falar! 👍`;

  document.getElementById('whatsapp-text').textContent = texto;
  document.getElementById('whatsapp-preview').style.display = 'block';
  document.getElementById('whatsapp-preview').scrollIntoView({ behavior: 'smooth' });
}

function copiarTexto() {
  const txt = document.getElementById('whatsapp-text').textContent;
  navigator.clipboard.writeText(txt).then(() => showToast('✅ Texto copiado! Cola no WhatsApp.'));
}

function salvarObra() {
  const servico = document.getElementById('orc-servico').value.trim();
  const cliente = document.getElementById('orc-cliente').value.trim();
  const valor = parseFloat(document.getElementById('orc-valor').value) || 0;
  const prazo = parseInt(document.getElementById('orc-prazo').value) || 5;

  if (!servico || valor <= 0) { showToast('❌ Preenche o serviço e o valor primeiro!', 'red'); return; }

  state.obraAtiva = {
    id: Date.now(),
    servico,
    cliente,
    valor,
    sinal: valor / 2,
    prazo,
    dataInicio: new Date().toLocaleDateString('pt-BR'),
    gastosMaterial: 0,
    entradasRecebidas: 0,
    status: 'em_andamento'
  };
  saveState();
  showToast('✅ Obra salva! Registra o sinal quando receber.');
  showPage('dashboard');
}

// ===== LANÇAR =====
function lancarMovimentacao(tipo) {
  const valorEl = document.getElementById(tipo + '-valor');
  const tipoEl = document.getElementById(tipo + '-tipo');
  const descEl = document.getElementById(tipo + '-desc');

  const valor = parseFloat(valorEl.value) || 0;
  if (valor <= 0) { showToast('❌ Coloca o valor antes!', 'red'); return; }

  const subtipo = tipoEl.value;
  const desc = descEl.value.trim() || subtipo;
  const data = new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const tx = { tipo, subtipo, valor, desc, data, obraId: state.obraAtiva ? state.obraAtiva.id : null };
  state.transacoes.push(tx);

  if (tipo === 'entrada') {
    state.saldo += valor;
    if (state.obraAtiva) {
      state.obraAtiva.entradasRecebidas = (state.obraAtiva.entradasRecebidas || 0) + valor;
    }
    showToast('✅ Entrada de ' + fmt(valor) + ' registrada!');
  } else {
    state.saldo -= valor;
    if (subtipo === 'material' && state.obraAtiva) {
      state.obraAtiva.gastosMaterial = (state.obraAtiva.gastosMaterial || 0) + valor;
    }
    if (subtipo === 'pessoal') {
      state.gastosPessoaisHoje = (state.gastosPessoaisHoje || 0) + valor;
      if (state.obraAtiva) {
        const teto = state.obraAtiva.sinal / (state.obraAtiva.prazo || 5);
        if (state.gastosPessoaisHoje > teto) {
          document.getElementById('modal-msg').textContent =
            `Teto diário: ${fmt(teto)} — Você já gastou: ${fmt(state.gastosPessoaisHoje)} pessoal hoje.`;
          document.getElementById('modal-alerta').classList.add('active');
        }
      }
    }
    if (!document.getElementById('modal-alerta').classList.contains('active')) {
      showToast('➖ Saída de ' + fmt(valor) + ' registrada.');
    }
  }

  saveState();
  valorEl.value = '';
  descEl.value = '';
  renderDashboard();
}

// ===== ENCERRAR OBRA =====
function abrirModalEncerrar() {
  document.getElementById('modal-encerrar').classList.add('active');
}

function fecharModalEncerrar() {
  document.getElementById('modal-encerrar').classList.remove('active');
}

function encerrarObra() {
  if (!state.obraAtiva) return;
  const obra = { ...state.obraAtiva, status: 'concluida', dataFim: new Date().toLocaleDateString('pt-BR') };
  obra.margemBruta = obra.entradasRecebidas - obra.gastosMaterial;
  obra.margemPct = obra.valor > 0 ? Math.round((obra.margemBruta / obra.valor) * 100) : 0;
  state.obrasHistorico = state.obrasHistorico || [];
  state.obrasHistorico.push(obra);
  state.obraAtiva = null;
  fecharModalEncerrar();
  saveState();
  showToast('🏁 Obra encerrada e salva no histórico!');
  renderDashboard();
}

// ===== RELATÓRIO =====
function renderRelatorio() {
  const obras = state.obrasHistorico || [];
  const obraAtiva = state.obraAtiva;
  const todas = obraAtiva ? [...obras, { ...obraAtiva, status: 'em_andamento' }] : obras;

  // Geral
  const totalFaturado = obras.reduce((s, o) => s + (o.entradasRecebidas || 0), 0);
  const totalMaterial = obras.reduce((s, o) => s + (o.gastosMaterial || 0), 0);
  const totalMargem = totalFaturado - totalMaterial;
  const mediaMargem = obras.length > 0 ? Math.round(obras.reduce((s, o) => s + (o.margemPct || 0), 0) / obras.length) : 0;

  document.getElementById('relatorio-geral').innerHTML = `
    <div class="relatorio-summary">
      <div class="rel-box">
        <div class="rel-box-label">💵 Total Faturado</div>
        <div class="rel-box-value green">${fmt(totalFaturado)}</div>
      </div>
      <div class="rel-box">
        <div class="rel-box-label">🔩 Gasto Material</div>
        <div class="rel-box-value red">${fmt(totalMaterial)}</div>
      </div>
      <div class="rel-box">
        <div class="rel-box-label">📈 Margem Total</div>
        <div class="rel-box-value ${totalMargem >= 0 ? 'green' : 'red'}">${fmt(totalMargem)}</div>
      </div>
      <div class="rel-box">
        <div class="rel-box-label">% Média Margem</div>
        <div class="rel-box-value ${mediaMargem >= 30 ? 'green' : mediaMargem >= 15 ? 'yellow' : 'red'}">${mediaMargem}%</div>
      </div>
    </div>
    ${obras.length > 0
      ? `<div style="font-size:12px;color:var(--muted);text-align:center;font-weight:600">${obras.length} obra(s) concluída(s) no histórico</div>`
      : '<div class="empty-state"><div class="empty-icon">🔩</div>Nenhuma obra concluída ainda.<br>Salve uma obra e encerre para ver a margem.</div>'
    }
  `;

  // Obras
  const historEl = document.getElementById('obras-historico');
  if (todas.length === 0) {
    historEl.innerHTML = '';
    return;
  }

  historEl.innerHTML = todas.slice().reverse().map(obra => {
    const faturado = obra.entradasRecebidas || 0;
    const material = obra.gastosMaterial || 0;
    const margem = faturado - material;
    const margemPct = obra.valor > 0 ? Math.round((margem / obra.valor) * 100) : 0;
    const isAtiva = obra.status === 'em_andamento';
    const cardClass = isAtiva ? 'em-andamento' : margem >= 0 ? 'lucro' : 'prejuizo';
    const barColor = isAtiva ? 'var(--accent)' : margem >= 0 ? 'var(--green)' : 'var(--red)';
    const barPct = Math.min(Math.max(Math.abs(margemPct), 0), 100);

    return `
      <div class="card obra-card ${cardClass}">
        <div class="obra-card-header">
          <div>
            <div class="obra-card-nome">${obra.servico}${obra.cliente ? ` — ${obra.cliente}` : ''}</div>
            <div class="obra-card-data">${isAtiva ? '🔥 Em andamento' : `✅ ${obra.dataFim || obra.dataInicio}`}</div>
          </div>
        </div>
        <div class="obra-card-stats">
          <div class="obra-stat">
            <div class="obra-stat-label">Recebido</div>
            <div class="obra-stat-value green">${fmt(faturado)}</div>
          </div>
          <div class="obra-stat">
            <div class="obra-stat-label">Material</div>
            <div class="obra-stat-value red">${fmt(material)}</div>
          </div>
          <div class="obra-stat">
            <div class="obra-stat-label">Sobrou</div>
            <div class="obra-stat-value" style="color:${barColor}">${fmt(margem)}</div>
          </div>
        </div>
        <div class="margem-bar"><div class="margem-fill" style="width:${barPct}%;background:${barColor}"></div></div>
        <div style="display:flex;justify-content:space-between;margin-top:4px;font-size:11px;color:var(--muted);font-weight:600">
          <span>Margem: <span style="color:${barColor}">${margemPct}%</span></span>
          <span>Orçado: ${fmt(obra.valor)}</span>
        </div>
        ${isAtiva ? `<button class="btn-encerrar" onclick="abrirModalEncerrar()">🏁 ENCERRAR OBRA</button>` : ''}
      </div>
    `;
  }).join('');

  // Zona de risco
  const riskEl = document.getElementById('risk-section');
  const riscos = [];
  const mediaMaterialPct = obras.length > 0
    ? obras.reduce((s, o) => s + ((o.gastosMaterial || 0) / (o.valor || 1) * 100), 0) / obras.length
    : 0;

  if (mediaMargem < 20 && obras.length > 0) {
    riscos.push({
      icon: '📉',
      text: `Margem média de ${mediaMargem}% está baixa`,
      sub: 'Margem saudável para serralheiro é acima de 30%. Revise seus orçamentos.'
    });
  }
  if (mediaMaterialPct > 50 && obras.length > 0) {
    riscos.push({
      icon: '🔩',
      text: `Material consumindo ${Math.round(mediaMaterialPct)}% do preço cobrado`,
      sub: 'Você está orçando material barato demais. Adicione 15% de reserva sempre.'
    });
  }
  if (state.saldo < 0) {
    riscos.push({
      icon: '🚨',
      text: 'Saldo atual negativo',
      sub: 'Você gastou mais do que entrou. Pare gastos pessoais até cobrar o próximo saldo.'
    });
  }
  if (obras.length === 0 && !obraAtiva) {
    riscos.push({
      icon: '📊',
      text: 'Nenhum histórico ainda',
      sub: 'Registre suas obras para ver onde está perdendo dinheiro.'
    });
  }

  if (riscos.length === 0) {
    riskEl.innerHTML = '<div class="empty-state"><div class="empty-icon">✅</div>Sem alertas no momento. Continue assim!</div>';
  } else {
    riskEl.innerHTML = riscos.map(r => `
      <div class="risk-item">
        <div class="risk-icon">${r.icon}</div>
        <div><div class="risk-text">${r.text}</div><div class="risk-sub">${r.sub}</div></div>
      </div>
    `).join('');
  }
}

// ===== SCRIPTS =====
const scripts = {
  terminar: `Chefe, finalizo em uns 40 minutos. Estou terminando os ajustes finais pra você vistoriar a peça e a gente fechar o acerto do saldo. Fica de prontidão que logo aviso! 🛠️\n\nAcertamos no Pix ou dinheiro?`,
  sinal: `Olá! Tudo certo com o orçamento que passei.\n\nPra eu começar a separar o material e encaixar na minha agenda, preciso do sinal de 50%.\n\nMe manda o Pix e já coloco na fila! 💰`,
  atraso: `Olá! Tudo bem?\n\nPassando pra confirmar o acerto do saldo final da obra. Combinamos que seria na entrega, e a peça já foi entregue.\n\nO valor restante é de R$ ___.\n\nMe avisa quando puder resolver pra eu dar baixa aqui. Valeu! 🤝`,
  aprovado: `Ótimo! Orçamento aprovado. ✅\n\nConfirmo então:\n📋 Serviço: ___\n💰 Total: R$ ___\n⚡ Sinal (50%): R$ ___ (pra hoje)\n🔒 Saldo final na entrega\n\nAssim que confirmar o sinal aqui, começo a separar o material. Pode mandar!`,
  orcamento_verbal: `Só pra deixar registrado aqui no chat mesmo:\n\n✅ Você confirma o orçamento de R$ ___ para [descrição do serviço]?\n\nPreciso dessa confirmação escrita antes de comprar material. Assim fica seguro pra nós dois! 😊`,
};

function copiarScript(tipo) {
  navigator.clipboard.writeText(scripts[tipo]).then(() => showToast('✅ Script copiado! Cola no WhatsApp.'));
}

// ===== MODALS =====
function fecharModal() {
  document.getElementById('modal-alerta').classList.remove('active');
}

// ===== TOAST =====
function showToast(msg, color) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.background = color === 'red' ? 'var(--red)' : color === 'yellow' ? 'var(--yellow)' : 'var(--green)';
  t.style.color = color === 'red' ? '#fff' : '#000';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

// ===== PWA INSTALL =====
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  document.getElementById('install-btn-wrap').style.display = 'block';
});

function installPWA() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(() => {
    deferredPrompt = null;
    document.getElementById('install-btn-wrap').style.display = 'none';
  });
}

window.addEventListener('appinstalled', () => {
  document.getElementById('install-btn-wrap').style.display = 'none';
  showToast('✅ App instalado na tela inicial!');
});

// ===== INIT =====
loadState();
renderDashboard();

// Register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
