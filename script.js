document.addEventListener('DOMContentLoaded', function() {
    // Elementos DOM
    const elementos = {
        cpfs: document.getElementById('cpfs'),
        nomes: document.getElementById('nomes'),
        data: document.getElementById('data'),
        resultado: document.getElementById('resultado'),
        operacao: document.querySelectorAll('input[name="operacao"]'),
        processarBtn: document.getElementById('btn-processar'),
        limparBtn: document.getElementById('btn-limpar'),
        exemploBtn: document.getElementById('btn-exemplo'),
        hojeBtn: document.getElementById('btn-hoje'),
        downloadBtn: document.getElementById('btn-download'),
        copiarBtn: document.getElementById('btn-copiar'),
        imprimirBtn: document.getElementById('btn-imprimir'),
        cpfCounter: document.getElementById('cpf-counter'),
        nomeCounter: document.getElementById('nome-counter'),
        validationStatus: document.getElementById('validation-status'),
        resultCount: document.getElementById('result-count'),
        resultType: document.getElementById('result-type'),
        processTime: document.getElementById('process-time'),
        systemStatus: document.getElementById('system-status'),
        lastUpdate: document.getElementById('last-update'),
        dataGroup: document.getElementById('data-group')
    };

    // Menu
    const menuItems = document.querySelectorAll('.nav-menu a');
    const sections = document.querySelectorAll('.content-section');
    const modal = document.getElementById('confirm-modal');
    const toastContainer = document.getElementById('toast-container');

    // Configuração inicial
    function inicializar() {
        // Definir data de hoje
        setTodayDate();
        
        // Atualizar contadores
        elementos.cpfs.addEventListener('input', atualizarContadores);
        elementos.nomes.addEventListener('input', atualizarContadores);
        
        // Configurar eventos
        configurarEventos();
        
        // Atualizar status do sistema
        atualizarStatusSistema();
        
        // Inicializar histórico
        inicializarHistorico();
    }

    function setTodayDate() {
        const hoje = new Date();
        const dia = hoje.getDate().toString().padStart(2, '0');
        const mes = (hoje.getMonth() + 1).toString().padStart(2, '0');
        const ano = hoje.getFullYear();
        elementos.data.value = `${dia}/${mes}/${ano}`;
    }

    function atualizarContadores() {
        const cpfsCount = elementos.cpfs.value.split('\n').filter(cpf => cpf.trim()).length;
        const nomesCount = elementos.nomes.value.split('\n').filter(nome => nome.trim()).length;
        
        elementos.cpfCounter.textContent = `${cpfsCount} ${cpfsCount === 1 ? 'registro' : 'registros'}`;
        elementos.nomeCounter.textContent = `${nomesCount} ${nomesCount === 1 ? 'registro' : 'registros'}`;
        
        atualizarStatusValidacao(cpfsCount, nomesCount);
    }

    function atualizarStatusValidacao(cpfsCount, nomesCount) {
        const statusEl = elementos.validationStatus;
        const icon = statusEl.querySelector('i');
        const text = statusEl.querySelector('span');
        
        if (cpfsCount === 0 && nomesCount === 0) {
            statusEl.className = 'validation-status';
            icon.className = 'fas fa-exclamation-circle';
            text.textContent = 'Aguardando entrada de dados...';
        } else if (cpfsCount === nomesCount) {
            statusEl.className = 'validation-status success';
            icon.className = 'fas fa-check-circle';
            text.textContent = `✅ Validação OK: ${cpfsCount} registros em ambos os campos`;
        } else {
            statusEl.className = 'validation-status error';
            icon.className = 'fas fa-exclamation-triangle';
            text.textContent = `⚠️ Desigualdade: ${cpfsCount} CPFs vs ${nomesCount} nomes`;
        }
    }

    function configurarEventos() {
        // Menu
        menuItems.forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.id.replace('menu-', '') + '-section';
                
                menuItems.forEach(i => i.parentElement.classList.remove('active'));
                this.parentElement.classList.add('active');
                
                sections.forEach(section => section.classList.remove('active'));
                document.getElementById(targetId).classList.add('active');
            });
        });

        // Botão Sair
        document.getElementById('btn-logout').addEventListener('click', () => {
            showToast('Saindo do sistema...', 'info');
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        });

        // Tipo de operação
        elementos.operacao.forEach(radio => {
            radio.addEventListener('change', function() {
                elementos.dataGroup.style.display = this.value === 'bloqueio' ? 'block' : 'none';
                elementos.resultType.textContent = this.value === 'bloqueio' ? 'BLOQUEIO' : 'DESBLOQUEIO';
            });
        });

        // Botão Hoje
        elementos.hojeBtn.addEventListener('click', setTodayDate);

        // Botão Limpar
        elementos.limparBtn.addEventListener('click', function() {
            showConfirmModal('Deseja limpar todos os campos?', () => {
                elementos.cpfs.value = '';
                elementos.nomes.value = '';
                elementos.resultado.value = '';
                setTodayDate();
                atualizarContadores();
                showToast('Campos limpos com sucesso!', 'success');
            });
        });

        // Botão Exemplo
        elementos.exemploBtn.addEventListener('click', function() {
            elementos.cpfs.value = `12345678901\n98765432109\n45678901234\n78901234567\n23456789012\n20231001\n20231002\n20231003\n20231004\n20231005`;
            elementos.nomes.value = `João Silva Santos\nMaria Oliveira Costa\nPedro Almeida Souza\nAna Pereira Lima\nCarlos Rodrigues Gomes\nJames Wilson Smith\nEmma Johnson Brown\nMichael Davis Miller\nSophia Garcia Taylor\nDavid Martinez Clark`;
            atualizarContadores();
            showToast('Exemplo carregado com sucesso!', 'success');
        });

        // Botão Processar
        elementos.processarBtn.addEventListener('click', processarDados);

        // Botão Baixar
        elementos.downloadBtn.addEventListener('click', baixarResultado);

        // Botão Copiar
        elementos.copiarBtn.addEventListener('click', copiarResultado);

        // Botão Imprimir
        elementos.imprimirBtn.addEventListener('click', () => {
            if (elementos.resultado.value) {
                window.print();
            } else {
                showToast('Não há resultado para imprimir!', 'error');
            }
        });

        // Modal
        document.querySelector('.close-modal').addEventListener('click', () => {
            modal.style.display = 'none';
        });

        document.getElementById('modal-cancel').addEventListener('click', () => {
            modal.style.display = 'none';
        });

        // Fechar modal ao clicar fora
        window.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    function processarDados() {
        try {
            const cpfs = elementos.cpfs.value.split('\n')
                .map(cpf => cpf.trim())
                .filter(cpf => cpf);
            
            const nomes = elementos.nomes.value.split('\n')
                .map(nome => nome.trim())
                .filter(nome => nome);
            
            // Validações
            if (cpfs.length === 0) {
                showToast('Informe pelo menos um CPF/Matrícula!', 'error');
                return;
            }
            
            if (cpfs.length !== nomes.length) {
                showToast(`Número de CPFs (${cpfs.length}) diferente de nomes (${nomes.length})!`, 'error');
                return;
            }
            
            const isBloqueio = document.querySelector('input[name="operacao"]:checked').value === 'bloqueio';
            const data = elementos.data.value.trim();
            
            if (isBloqueio) {
                if (!data) {
                    showToast('Informe a data para bloqueio!', 'error');
                    return;
                }
                
                if (!/^\d{2}\/\d{2}\/\d{4}$/.test(data)) {
                    showToast('Formato de data inválido! Use DD/MM/AAAA', 'error');
                    return;
                }
            }
            
            // Processar
            let resultado = '';
            
            if (isBloqueio) {
                cpfs.forEach((cpf, i) => {
                    resultado += `${cpf};${nomes[i]};${data};;\n`;
                });
            } else {
                cpfs.forEach((cpf, i) => {
                    resultado += `${cpf};${nomes[i]};;\n`;
                });
            }
            
            elementos.resultado.value = resultado;
            
            // Atualizar estatísticas
            elementos.resultCount.textContent = `${cpfs.length} registros processados`;
            elementos.resultType.textContent = isBloqueio ? 'BLOQUEIO' : 'DESBLOQUEIO';
            
            const agora = new Date();
            elementos.processTime.textContent = `${agora.getHours().toString().padStart(2, '0')}:${agora.getMinutes().toString().padStart(2, '0')}:${agora.getSeconds().toString().padStart(2, '0')}`;
            
            // Salvar no histórico
            salvarNoHistorico(cpfs.length, isBloqueio);
            
            showToast(`${cpfs.length} registros processados com sucesso!`, 'success');
            
        } catch (error) {
            console.error('Erro ao processar:', error);
            showToast(`Erro ao processar: ${error.message}`, 'error');
        }
    }

    function baixarResultado() {
        if (!elementos.resultado.value) {
            showToast('Não há resultado para baixar!', 'error');
            return;
        }
        
        const isBloqueio = document.querySelector('input[name="operacao"]:checked').value === 'bloqueio';
        const tipo = isBloqueio ? 'bloqueio' : 'desbloqueio';
        const dataAtual = new Date().toISOString().split('T')[0];
        const nomeArquivo = `resultado_${tipo}_${dataAtual}.txt`;
        
        const blob = new Blob([elementos.resultado.value], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = nomeArquivo;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast(`Arquivo "${nomeArquivo}" baixado com sucesso!`, 'success');
    }

    function copiarResultado() {
        if (!elementos.resultado.value) {
            showToast('Não há resultado para copiar!', 'error');
            return;
        }
        
        elementos.resultado.select();
        elementos.resultado.setSelectionRange(0, 99999);
        
        try {
            navigator.clipboard.writeText(elementos.resultado.value)
                .then(() => {
                    showToast('Resultado copiado para a área de transferência!', 'success');
                })
                .catch(err => {
                    console.error('Erro ao copiar:', err);
                    showToast('Erro ao copiar!', 'error');
                });
        } catch (err) {
            console.error('Erro ao copiar:', err);
            showToast('Erro ao copiar!', 'error');
        }
    }

    function showConfirmModal(message, onConfirm) {
        document.getElementById('modal-message').textContent = message;
        modal.style.display = 'block';
        
        document.getElementById('modal-confirm').onclick = function() {
            modal.style.display = 'none';
            onConfirm();
        };
    }

    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        toastContainer.appendChild(toast);
        
        // Remover após 5 segundos
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                toastContainer.removeChild(toast);
            }, 300);
        }, 5000);
    }

    function atualizarStatusSistema() {
        elementos.systemStatus.textContent = 'Online';
        elementos.systemStatus.className = 'status-active';
        
        const agora = new Date();
        elementos.lastUpdate.textContent = `${agora.getDate().toString().padStart(2, '0')}/${(agora.getMonth() + 1).toString().padStart(2, '0')}/${agora.getFullYear()} ${agora.getHours().toString().padStart(2, '0')}:${agora.getMinutes().toString().padStart(2, '0')}`;
    }

    function inicializarHistorico() {
        const historico = JSON.parse(localStorage.getItem('historico_processamentos')) || [];
        const historicoContent = document.getElementById('historico-content');
        
        if (historico.length === 0) {
            historicoContent.innerHTML = '<p class="no-history">Nenhum histórico disponível</p>';
            return;
        }
        
        let html = '<div class="history-list">';
        historico.forEach((item, index) => {
            html += `
                <div class="history-item">
                    <div class="history-icon">
                        <i class="fas fa-${item.tipo === 'bloqueio' ? 'lock' : 'unlock'}"></i>
                    </div>
                    <div class="history-info">
                        <h4>${item.tipo === 'bloqueio' ? 'Bloqueio' : 'Desbloqueio'}</h4>
                        <p>${item.registros} registros - ${item.data}</p>
                        <small>${item.hora}</small>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        
        historicoContent.innerHTML = html;
        
        // Adicionar estilos para o histórico
        const style = document.createElement('style');
        style.textContent = `
            .history-list {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            .history-item {
                display: flex;
                align-items: center;
                gap: 15px;
                padding: 15px;
                background: #f8f9fa;
                border-radius: 8px;
                border-left: 4px solid #4CAF50;
            }
            .history-icon {
                font-size: 24px;
                color: #4CAF50;
            }
            .history-info h4 {
                margin: 0 0 5px 0;
                color: #2c3e50;
            }
            .history-info p {
                margin: 0;
                color: #666;
                font-size: 14px;
            }
            .history-info small {
                color: #999;
                font-size: 12px;
            }
            .no-history {
                text-align: center;
                color: #999;
                font-style: italic;
                padding: 40px 0;
            }
        `;
        document.head.appendChild(style);
    }

    function salvarNoHistorico(registros, isBloqueio) {
        const historico = JSON.parse(localStorage.getItem('historico_processamentos')) || [];
        const agora = new Date();
        
        const novoRegistro = {
            tipo: isBloqueio ? 'bloqueio' : 'desbloqueio',
            registros: registros,
            data: `${agora.getDate().toString().padStart(2, '0')}/${(agora.getMonth() + 1).toString().padStart(2, '0')}/${agora.getFullYear()}`,
            hora: `${agora.getHours().toString().padStart(2, '0')}:${agora.getMinutes().toString().padStart(2, '0')}:${agora.getSeconds().toString().padStart(2, '0')}`
        };
        
        historico.unshift(novoRegistro);
        
        // Manter apenas os últimos 50 registros
        if (historico.length > 50) {
            historico.pop();
        }
        
        localStorage.setItem('historico_processamentos', JSON.stringify(historico));
        
        // Atualizar visualização se estiver na seção de histórico
        if (document.getElementById('historico-section').classList.contains('active')) {
            inicializarHistorico();
        }
    }

    // Inicializar o sistema
    inicializar();
    
    // Adicionar animação de entrada
    document.body.style.opacity = 0;
    document.body.style.transition = 'opacity 0.5s ease';
    
    setTimeout(() => {
        document.body.style.opacity = 1;
    }, 100);
});