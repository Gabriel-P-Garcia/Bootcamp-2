describe('Teste da Aplicação: Lista de Compras', () => {
    
    // O que estiver aqui dentro roda antes de cada teste começar
    beforeEach(() => {
        // Abre o seu arquivo HTML local
        cy.visit('docs/index.html');
        // Limpa o localStorage para garantir que um teste não interfira no outro
        cy.clearLocalStorage();
    });

    it('Deve conseguir adicionar um item novo na lista', () => {
        // Encontra o input pelo ID, digita 'Comprar pão' e aperta ENTER
        cy.get('#itemInput').type('Pão{enter}');

        // Verifica se a lista atual agora tem exatamente 1 item (a tag <li>)
        cy.get('#listaAtual li').should('have.length', 1);

        // Verifica se o texto do item é realmente o que digitamos
        cy.get('#listaAtual li').should('contain', 'Pão');
    });

    it('Deve manter o item salvo no localStorage ao recarregar a página', () => {
        // Adiciona um item
        cy.get('#itemInput').type('Café{enter}');

        // Recarrega a página (simulando o usuário fechando e abrindo o navegador)
        cy.reload();

        // Verifica se o café continua lá
        cy.get('#listaAtual li').should('contain', 'Café');
    });

    it('Deve conseguir marcar um item como concluído e enviá-lo ao histórico', () => {
        // Adiciona o item
        cy.get('#itemInput').type('Leite{enter}');

        // Clica no checkbox do item que acabou de ser criado
        cy.get('#listaAtual li input[type="checkbox"]').check();

        // Clica no botão de salvar histórico
        cy.get('#btn-historico').click();

        // Verifica se a lista de cima ficou vazia (o item sumiu)
        cy.get('#listaAtual li').should('not.exist');

        // Verifica se a lista de baixo (histórico) agora tem 1 item
        cy.get('#listaHistorico li').should('have.length', 1);
        cy.get('#listaHistorico li').should('contain', 'Leite');
    });

    it('Deve poder voltar um item do histórico para a lista atual', () => {
        // Adiciona, marca e manda pro histórico
        cy.get('#itemInput').type('Ovos{enter}');
        cy.get('#listaAtual li input[type="checkbox"]').check();
        cy.get('#btn-historico').click();

        // Clica no botão "Voltar p/ Lista" dentro do histórico
        cy.get('.history-btn').click();

        // Verifica se sumiu do histórico
        cy.get('#listaHistorico li').should('not.exist');

        // Verifica se voltou para a lista atual, desmarcado
        cy.get('#listaAtual li').should('contain', 'Ovos');
        cy.get('#listaAtual li input[type="checkbox"]').should('not.be.checked');
    });
});