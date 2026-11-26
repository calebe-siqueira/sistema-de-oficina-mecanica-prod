/* ============================================================
   Migração V2: Unificação de email/nome em tb_pessoa
   Objetivo: Eliminar a duplicidade do campo 'email' entre
   tb_cliente e tb_usuario, criando uma única fonte de verdade
   para dados de identificação (nome + email).

   Estratégia:
   1. Criar tb_pessoa com email UNIQUE global
   2. Popular tb_pessoa a partir dos dados existentes:
      - Prioridade 1: Usuários vinculados a clientes (compartilham 1 pessoa)
      - Prioridade 2: Clientes sem usuário
      - Prioridade 3: Usuários sem cliente (admin, mecânico)
   3. Adicionar FK fk_cod_pessoa em tb_cliente e tb_usuario
   4. Remover colunas redundantes nome_cliente, email de tb_cliente
      e nome_usuario, email de tb_usuario
   ============================================================ */

-- --------------------------------------------------------
-- 1. Criar tabela tb_pessoa (fonte única de verdade)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS tb_pessoa (
    cod_pessoa BIGINT PRIMARY KEY AUTO_INCREMENT,
    nome       VARCHAR(255) NOT NULL,
    email      VARCHAR(255) UNIQUE,
    deleted_at TIMESTAMP NULL DEFAULT NULL
);

-- --------------------------------------------------------
-- 2. Popular tb_pessoa a partir dos registros existentes
-- --------------------------------------------------------

-- 2a. Usuários que já possuem fk_cod_cliente: cria tb_pessoa
--     usando os dados do usuário (email canônico de login)
INSERT INTO tb_pessoa (nome, email, deleted_at)
SELECT u.nome_usuario, u.email, u.deleted_at
FROM tb_usuario u
WHERE u.fk_cod_cliente IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM tb_pessoa p WHERE LOWER(p.email) = LOWER(u.email)
  );

-- 2b. Clientes sem usuário vinculado (e com email preenchido):
--     cria tb_pessoa usando os dados do cliente
INSERT INTO tb_pessoa (nome, email, deleted_at)
SELECT c.nome_cliente, c.email, c.deleted_at
FROM tb_cliente c
WHERE c.email IS NOT NULL
  AND c.email != ''
  AND NOT EXISTS (
      SELECT 1 FROM tb_usuario u
      WHERE u.fk_cod_cliente = c.cod_cliente
  )
  AND NOT EXISTS (
      SELECT 1 FROM tb_pessoa p WHERE LOWER(p.email) = LOWER(c.email)
  );

-- 2c. Usuários sem cliente (ADMIN, MECANICO etc.): cria tb_pessoa
INSERT INTO tb_pessoa (nome, email, deleted_at)
SELECT u.nome_usuario, u.email, u.deleted_at
FROM tb_usuario u
WHERE u.fk_cod_cliente IS NULL
  AND NOT EXISTS (
      SELECT 1 FROM tb_pessoa p WHERE LOWER(p.email) = LOWER(u.email)
  );

-- --------------------------------------------------------
-- 3. Adicionar FK fk_cod_pessoa em tb_cliente
-- --------------------------------------------------------
ALTER TABLE tb_cliente
    ADD COLUMN fk_cod_pessoa BIGINT NULL,
    ADD CONSTRAINT fk_cliente_pessoa
        FOREIGN KEY (fk_cod_pessoa) REFERENCES tb_pessoa (cod_pessoa)
        ON DELETE RESTRICT
        ON UPDATE CASCADE;

-- Vincular tb_cliente → tb_pessoa via email
UPDATE tb_cliente c
    INNER JOIN tb_pessoa p ON LOWER(p.email) = LOWER(c.email)
SET c.fk_cod_pessoa = p.cod_pessoa
WHERE c.email IS NOT NULL AND c.email != '';

-- --------------------------------------------------------
-- 4. Adicionar FK fk_cod_pessoa em tb_usuario
-- --------------------------------------------------------
ALTER TABLE tb_usuario
    ADD COLUMN fk_cod_pessoa BIGINT NULL,
    ADD CONSTRAINT fk_usuario_pessoa
        FOREIGN KEY (fk_cod_pessoa) REFERENCES tb_pessoa (cod_pessoa)
        ON DELETE RESTRICT
        ON UPDATE CASCADE;

-- Vincular tb_usuario → tb_pessoa via email
UPDATE tb_usuario u
    INNER JOIN tb_pessoa p ON LOWER(p.email) = LOWER(u.email)
SET u.fk_cod_pessoa = p.cod_pessoa;

-- Garantir que fk_cod_pessoa não seja nulo em tb_usuario (todo usuário tem pessoa)
ALTER TABLE tb_usuario
    MODIFY COLUMN fk_cod_pessoa BIGINT NOT NULL;

-- --------------------------------------------------------
-- 5. Remover colunas redundantes de tb_cliente
--    (nome_cliente e email agora vêm de tb_pessoa)
-- --------------------------------------------------------
ALTER TABLE tb_cliente
    DROP COLUMN nome_cliente,
    DROP COLUMN email;

-- --------------------------------------------------------
-- 6. Remover colunas redundantes de tb_usuario
--    (nome_usuario e email agora vêm de tb_pessoa)
-- --------------------------------------------------------
ALTER TABLE tb_usuario
    DROP COLUMN nome_usuario,
    DROP COLUMN email;

-- --------------------------------------------------------
-- 7. Atualizar índices de performance
-- --------------------------------------------------------

-- Remover índice antigo baseado em email de tb_usuario (coluna removida)
DROP INDEX IF EXISTS idx_usuario_email_funcao ON tb_usuario;

-- Novo índice em tb_pessoa para buscas rápidas por email (login / busca)
CREATE INDEX idx_pessoa_email ON tb_pessoa(email);

-- Novo índice em tb_usuario para navegação fk_cod_pessoa → funcao
CREATE INDEX idx_usuario_pessoa_funcao ON tb_usuario(fk_cod_pessoa, funcao);

-- Novo índice em tb_cliente para navegação fk_cod_pessoa
CREATE INDEX idx_cliente_pessoa ON tb_cliente(fk_cod_pessoa);

-- --------------------------------------------------------
-- 8. Busca por nome em tb_cliente migra para tb_pessoa
-- --------------------------------------------------------
DROP INDEX IF EXISTS idx_busca_nome_cliente ON tb_cliente;
CREATE INDEX idx_busca_nome_pessoa ON tb_pessoa(nome);