/* Modelo Lógico (10): */

CREATE DATABASE IF NOT EXISTS db_teste_flyway
DEFAULT CHARACTER SET utf8mb4
DEFAULT COLLATE utf8mb4_general_ci;

USE db_carbulab;

CREATE TABLE IF NOT EXISTS tb_cep (
	cod_cep INT PRIMARY KEY AUTO_INCREMENT,
    cep CHAR(8) NOT NULL UNIQUE,
    uf CHAR(2) NOT NULL,
    cidade VARCHAR(60) NOT NULL,
    bairro VARCHAR(60) NOT NULL,
    logradouro VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS tb_endereco (
    cod_endereco BIGINT PRIMARY KEY AUTO_INCREMENT,
    fk_cod_cep INT NOT NULL,
    numero MEDIUMINT NOT NULL,
    complemento VARCHAR(30),
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (fk_cod_cep)
    REFERENCES tb_cep (cod_cep)
    ON DELETE RESTRICT -- Impede excluir um CEP se ele estiver em uso por um endereço
    ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS tb_cliente (
    cod_cliente BIGINT PRIMARY KEY AUTO_INCREMENT,
    nome_cliente VARCHAR(255) not null,
    email VARCHAR(255) UNIQUE,
    celular VARCHAR(20),  -- Obrigatório ter celular OU telefone (Validado no backend/frontend)
    telefone VARCHAR(20), -- Obrigatório ter celular OU telefone (Validado no backend/frontend)
    cpf_cnpj VARCHAR(14) UNIQUE,
    rg VARCHAR(20) UNIQUE,
    data_nascimento DATE,
    tipo CHAR(1) NOT NULL DEFAULT 'F',
    fk_cod_endereco BIGINT, -- Endereço obrigatório (Validado no backend/frontend se CEP for informado)
    deleted_at TIMESTAMP NULL DEFAULT NULL, -- Campo de Soft Delete
    CONSTRAINT check_tipo_cliente CHECK (tipo IN ('F', 'J')),
    FOREIGN KEY (fk_cod_endereco) REFERENCES tb_endereco (cod_endereco)
    ON DELETE RESTRICT -- Um endereço não pode ser excluído se já houverem clientes cadastrados com ele
    ON UPDATE CASCADE
    -- Índice funcional composto (Transforma temporariamente o NULL em data fixa para validar a unicidade)
    -- UNIQUE KEY uk_cliente_email_soft_delete (email, (COALESCE(deleted_at, '1970-01-01 00:00:01'))),
    -- UNIQUE KEY uk_cliente_cpf_cnpj_soft_delete (cpf_cnpj, (COALESCE(deleted_at, '1970-01-01 00:00:01'))),
    -- UNIQUE KEY uk_cliente_rg_soft_delete (rg, (COALESCE(deleted_at, '1970-01-01 00:00:01')))
);

CREATE TABLE IF NOT EXISTS tb_usuario (
    cod_usuario BIGINT PRIMARY KEY AUTO_INCREMENT,
    funcao VARCHAR(30) NOT NULL DEFAULT 'Funcionário',
    fk_cod_cliente BIGINT DEFAULT NULL,
    nome_usuario VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    login VARCHAR(30) UNIQUE,
    senha VARCHAR(60) NOT NULL,
    ultimo_acesso TIMESTAMP NULL DEFAULT NULL,
    ultima_alteracao_senha TIMESTAMP NULL DEFAULT NULL,
    deleted_at TIMESTAMP NULL DEFAULT NULL, -- Campo de Soft Delete
    FOREIGN KEY (fk_cod_cliente) REFERENCES tb_cliente (cod_cliente)
    ON DELETE RESTRICT -- Um cliente não pode ser excluído se houver um usuário cadastrado para ele
    ON UPDATE CASCADE
    -- Índice funcional composto (Transforma temporariamente o NULL em data fixa para validar a unicidade)
    -- UNIQUE KEY uk_usuario_email_soft_delete (email, (COALESCE(deleted_at, '1970-01-01 00:00:01'))),
    -- UNIQUE KEY uk_usuario_login_soft_delete (login, (COALESCE(deleted_at, '1970-01-01 00:00:01')))
);

CREATE TABLE IF NOT EXISTS tb_termos_de_uso (
    cod_termo BIGINT PRIMARY KEY AUTO_INCREMENT,
    versao_termo VARCHAR(20) NOT NULL UNIQUE,
    conteudo_termo TEXT NOT NULL, -- armazenado em markdown
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tb_aceitacao_termos_de_uso (
    cod_aceitacao BIGINT PRIMARY KEY AUTO_INCREMENT,
    fk_cod_usuario BIGINT NOT NULL,
    fk_cod_termo BIGINT NOT NULL,
    aceito_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    endereco_ip VARCHAR(45) NOT NULL,
    user_agent VARCHAR(500),
    aceito BOOLEAN NOT NULL,
    FOREIGN KEY (fk_cod_usuario) REFERENCES tb_usuario (cod_usuario)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
    FOREIGN KEY (fk_cod_termo) REFERENCES tb_termos_de_uso (cod_termo)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS tb_montadora (
    cod_montadora INT PRIMARY KEY AUTO_INCREMENT,
    nome_montadora VARCHAR(30) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS tb_modelo (
    cod_modelo INT PRIMARY KEY AUTO_INCREMENT,
    fk_cod_montadora INT NOT NULL,
    nome_modelo VARCHAR(30) NOT NULL UNIQUE,
    FOREIGN KEY (fk_cod_montadora) REFERENCES tb_montadora (cod_montadora) ON DELETE RESTRICT ON UPDATE CASCADE -- Uma montadora não pode ser excluída se já houverem modelos cadastrados com ele
);

CREATE TABLE IF NOT EXISTS tb_veiculo (
    cod_veiculo BIGINT PRIMARY KEY AUTO_INCREMENT,
    fk_cod_modelo INT NOT NULL,
    placa CHAR(7) NOT NULL, -- devido a backup pode ser null [alterar na hora fazer carga no BD e depois voltar para 'not null']
    cor VARCHAR(20) ,
    ano YEAR NOT NULL,
    combustivel VARCHAR(30) ,
    tipo CHAR(1) NOT NULL DEFAULT 'C',
    fk_cod_cliente BIGINT NOT NULL,
    deleted_at TIMESTAMP NULL DEFAULT NULL, -- Campo de Soft Delete
    CONSTRAINT check_tipo_veiculo CHECK (tipo = 'C'), -- Assume apenas Carro ('C'), por enquanto
    FOREIGN KEY (fk_cod_modelo) REFERENCES tb_modelo (cod_modelo) ON DELETE RESTRICT ON UPDATE CASCADE, -- Um modelo não pode ser excluido se já existirem veiculos cadastrados com ele
    FOREIGN KEY (fk_cod_cliente) REFERENCES tb_cliente (cod_cliente) ON DELETE RESTRICT ON UPDATE CASCADE,
	UNIQUE KEY uk_veiculo_placa_fk_cod_cliente (placa, fk_cod_cliente) -- Impede de salvar um veículo com uma mesma placa para o mesmo cliente
);

CREATE TABLE IF NOT EXISTS tb_ordem_servico (
    cod_os BIGINT PRIMARY KEY AUTO_INCREMENT,
    data_os DATE NOT NULL,
    quilometragem INT,
    descricao VARCHAR(400),
    tipo_desconto CHAR(1) DEFAULT 'N' CHECK (tipo_desconto IN ('N', 'P', 'V')), -- N = Nenhum, P = Porcentagem, V = Valor,
    desconto DECIMAL(10,2) DEFAULT 0.00,
    fk_cod_veiculo BIGINT NOT NULL, -- Um veículo pode pertencer a uma ou várias OSs
    
    -- Status:
    status_servico TINYINT NOT NULL DEFAULT 1, -- 1 = Orçamento, 2 = Ordem de Serviço Aberta, 3 = Serviço em Andamento, 4 = Finalizado, 5 = Cancelado
    valor_pago DECIMAL(10,2) DEFAULT 0.00, -- A partir do valor pago (comparando ao valor total da OS) será calculado o status do pagamento, pelo backend, que pode ser: 1. Não pago, 2. Parcialmente pago, 3. Pago integralmente
    deleted_at TIMESTAMP NULL DEFAULT NULL, -- Campo de Soft Delete
    FOREIGN KEY (fk_cod_veiculo) REFERENCES tb_veiculo (cod_veiculo) ON DELETE RESTRICT ON UPDATE CASCADE -- Um veículo não pode ser excluído se possuir OSs
);

CREATE TABLE IF NOT EXISTS tb_peca (
    cod_peca BIGINT PRIMARY KEY AUTO_INCREMENT,
    nome_peca VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS tb_servico (
    cod_servico BIGINT PRIMARY KEY AUTO_INCREMENT,
    nome_servico VARCHAR(100) NOT NULL UNIQUE
);

-- Tabela Associativa: Vínculo entre OS e Peças Utilizadas
CREATE TABLE IF NOT EXISTS tb_os_peca (
    cod_os_peca BIGINT PRIMARY KEY AUTO_INCREMENT,
    fk_cod_os BIGINT NOT NULL,
    fk_cod_peca BIGINT NOT NULL,
    quantidade SMALLINT NOT NULL DEFAULT 1 CHECK (quantidade > 0),
    valor_unitario DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    deleted_at TIMESTAMP NULL DEFAULT NULL, -- Campo de Soft Delete
    FOREIGN KEY (fk_cod_os) REFERENCES tb_ordem_servico (cod_os) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (fk_cod_peca) REFERENCES tb_peca (cod_peca) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Tabela Associativa: Vínculo entre OS e Serviços Prestados
CREATE TABLE IF NOT EXISTS tb_os_servico (
    cod_os_servico BIGINT PRIMARY KEY AUTO_INCREMENT,
    fk_cod_os BIGINT NOT NULL,
    fk_cod_servico BIGINT NOT NULL,
    quantidade SMALLINT NOT NULL DEFAULT 1 CHECK (quantidade > 0),
    valor_unitario DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    deleted_at TIMESTAMP NULL DEFAULT NULL, -- Campo de Soft Delete
    FOREIGN KEY (fk_cod_os) REFERENCES tb_ordem_servico (cod_os) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (fk_cod_servico) REFERENCES tb_servico (cod_servico) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Índices de Performance (otimização de queries com JOIN)
CREATE INDEX idx_os_veiculo ON tb_ordem_servico(fk_cod_veiculo);
CREATE INDEX idx_os_peca_os ON tb_os_peca(fk_cod_os);
CREATE INDEX idx_os_servico_os ON tb_os_servico(fk_cod_os);

CREATE INDEX idx_cliente_ativo ON tb_cliente(deleted_at);
CREATE INDEX idx_os_ativa ON tb_ordem_servico(deleted_at);

CREATE INDEX idx_busca_nome_cliente ON tb_cliente(nome_cliente);

CREATE INDEX idx_os_status ON tb_ordem_servico(status_servico);
CREATE INDEX idx_os_data ON tb_ordem_servico(data_os);

-- Novo index para agilizar busca de clientes_usuários
CREATE INDEX idx_usuario_email_funcao ON tb_usuario(email, funcao);

-- Índice para buscas rápidas (e garantir que 1 cliente tenha no máximo 1 usuário ativo)
CREATE INDEX idx_usuario_fk_cod_cliente ON tb_usuario(fk_cod_cliente);

-- Índice para buscas e validação rápida do status de aceitação de termos de uso pelos usuários
CREATE INDEX idx_aceitacao_termo_usuario ON tb_aceitacao_termos_de_uso(fk_cod_usuario, fk_cod_termo);