// URL base da versão 3 da API do JSONBin
const JSONBIN_URL = 'https://api.jsonbin.io/v3/b';


// Arrays para armazenar os dados na memória enquanto a página está aberta
let itensAtuais = [];
let itensHistorico = [];

// Função que roda assim quando a página carregar para buscar os cookies do usuário
document.addEventListener('DOMContentLoaded', () => {
    const dadosAtuais = localStorage.getItem('compras_atuais');
    const dadosHistorico = localStorage.getItem('compras_historico');

    // Se houver dados salvos, converte de JSON para Array novamente
    if (dadosAtuais) itensAtuais = JSON.parse(dadosAtuais);
    if (dadosHistorico) itensHistorico = JSON.parse(dadosHistorico);

    renderizarLista();
});

// Função para salvar os arrays no armazenamento do navegador
function atualizarLocalStorage() {
    localStorage.setItem('compras_atuais', JSON.stringify(itensAtuais));
    localStorage.setItem('compras_historico', JSON.stringify(itensHistorico));
    renderizarLista();
}

// Função para adicionar um novo item na lista atual
function adicionarItem() {
    const input = document.getElementById('itemInput');
    const texto = input.value.trim();

    if (texto !== '') {
        const novoItem = {
            id: Date.now(), // Gera um ID único baseado no tempo atual
            texto: texto,
            concluido: false
        };
        itensAtuais.push(novoItem);
        input.value = ''; // Limpa o campo de texto
        atualizarLocalStorage();
    }
}

// Função para alternar o status de "concluído" (riscado) do item
function alternarConcluido(id) {
    itensAtuais = itensAtuais.map(item => {
        if (item.id === id) {
            return { ...item, concluido: !item.concluido };
        }
        return item;
    });
    atualizarLocalStorage();
}

// Função para deletar um item da lista atual
function deletarItemAtual(id) {
    itensAtuais = itensAtuais.filter(item => item.id !== id);
    atualizarLocalStorage();
}

// Função para deletar um item do histórico definitivamente
function deletarItemHistorico(id) {
    itensHistorico = itensHistorico.filter(item => item.id !== id);
    atualizarLocalStorage();
}

// Função para mover itens marcados como concluídos para o histórico
function salvarHistorico() {
    const itensConcluidos = itensAtuais.filter(item => item.concluido);
    const itensPendentes = itensAtuais.filter(item => !item.concluido);

    // Adiciona os concluídos no histórico (garantindo que voltem desmarcados para o futuro)
    itensConcluidos.forEach(item => {
        item.concluido = false; 
        // Verifica se o item já existe no histórico para não duplicar
        const existente = itensHistorico.find(h => h.texto.toLowerCase() === item.texto.toLowerCase());
        if (!existente) {
            itensHistorico.push(item);
        }
    });

    // A lista atual passa a ser apenas os que ainda não foram comprados
    itensAtuais = itensPendentes;
    atualizarLocalStorage();
}

// Função para pegar um item do histórico e colocar de volta na lista de compras
function voltarParaLista(id) {
    const item = itensHistorico.find(item => item.id === id);
    if (item) {
        // Remove do histórico
        itensHistorico = itensHistorico.filter(i => i.id !== id);
        // Adiciona na lista atual
        itensAtuais.push(item);
        atualizarLocalStorage();
    }
}

// Função para desenhar o HTML na tela baseado nos arrays 
function renderizarLista() {
    const ulAtual = document.getElementById('listaAtual');
    const ulHistorico = document.getElementById('listaHistorico');

    ulAtual.innerHTML = '';
    ulHistorico.innerHTML = '';

    // Renderiza a Lista Atual
    itensAtuais.forEach(item => {
        const li = document.createElement('li');
        if (item.concluido) li.classList.add('completed');

        li.innerHTML = `
            <input type="checkbox" ${item.concluido ? 'checked' : ''} onchange="alternarConcluido(${item.id})">
            <span class="item-text" onclick="alternarConcluido(${item.id})">${item.texto}</span>
            <button class="delete-btn" onclick="deletarItemAtual(${item.id})">Deletar</button>
        `;
        ulAtual.appendChild(li);
    });

    // Renderiza o Histórico
    itensHistorico.forEach(item => {
        const li = document.createElement('li');
        li.style.borderLeftColor = "#2196F3"; // Marcação azul para o histórico
        li.innerHTML = `
            <span class="item-text">${item.texto}</span>
            <div>
                <button class="history-btn" onclick="voltarParaLista(${item.id})">Voltar p/ Lista</button>
                <button class="delete-btn" onclick="deletarItemHistorico(${item.id})">Deletar</button>
            </div>
        `;
        ulHistorico.appendChild(li);
    });
}

// Permite adicionar o item apertando a tecla "Enter" no teclado
document.getElementById('itemInput').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        adicionarItem();
    }
});

// Função para enviar dados atuais para a nuvem
async function salvarNaNuvem() {
    // Objeto contendo as duas listas
    const dadosParaNuvem = {
        compras_atuais: itensAtuais,
        compras_historico: itensHistorico
    };

    try {
        // Avisa o usuário que o processo começou (depende da internet)
        alert('Salvando na nuvem, aguarde um momento...');

        // 'fetch' para a requisição POST
        const resposta = await fetch(JSONBIN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Access-Key': '$2a$10$Kr7yqK8FdntCOX9yGjMLsOIeJ8cagcazjEsL7a5CC2bb4PWhWQdUG'
            },
            body: JSON.stringify(dadosParaNuvem) // Transforma os dados em texto JSON
        });

        // Converte a resposta do servidor de volta para um objeto JavaScript
        const resultado = await resposta.json();
        
        // O JSONBin devolve um ID único chamado "metadata.id"
        const idGerado = resultado.metadata.id;

        // Mostrar o código para o usuário copiar
        prompt('Salvo com sucesso! Copie o código abaixo para carregar esta lista em outro dispositivo:', idGerado);

    } catch (erro) {
        console.error('Erro ao salvar:', erro);
        alert('Ocorreu um erro ao tentar salvar na nuvem. Verifique sua conexão.');
    }
}

// Função para BUSCAR (Fazer Download) dos dados da nuvem
async function carregarDaNuvem() {
    const inputId = document.getElementById('inputNuvem');
    const codigoLoadout = inputId.value.trim();

    // Trava de segurança: impede de buscar se o campo estiver vazio
    if (codigoLoadout === '') {
        alert('Por favor, cole um código válido antes de buscar.');
        return;
    }

    try {
        alert('Buscando dados na nuvem, aguarde...');

        // Requisição GET 
        const resposta = await fetch(`${JSONBIN_URL}/${codigoLoadout}`, {
            method: 'GET',
            headers: {
                'X-Access-Key': '$2a$10$Kr7yqK8FdntCOX9yGjMLsOIeJ8cagcazjEsL7a5CC2bb4PWhWQdUG'
            }
        });

        if (!resposta.ok) {
            throw new Error('Código não encontrado ou inválido.');
        }

        const resultado = await resposta.json();

        // O JSONBin guarda o JSON original dentro de "record"
        const dadosBaixados = resultado.record;

        // Substitui as listas atuais pelas listas que vieram da nuvem
        itensAtuais = dadosBaixados.compras_atuais || [];
        itensHistorico = dadosBaixados.compras_historico || [];

        // Salva as novas listas no localStorage 
        atualizarLocalStorage();
        
        inputId.value = ''; // Limpa o campo
        alert('Lista carregada com sucesso!');

    } catch (erro) {
        console.error('Erro ao carregar:', erro);
        alert('Erro ao buscar a lista. Verifique se o código está correto.');
    }
}