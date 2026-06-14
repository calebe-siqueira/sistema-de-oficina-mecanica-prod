package com.carbulab.controller;

import com.carbulab.service.PdfOsService;
import com.carbulab.service.PdfRelVeiculoService;
import com.carbulab.utils.ConsultaPorPlaca;
import com.carbulab.exception.PlacaConflictException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.CallableStatementCallback;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

import java.sql.CallableStatement;
import java.sql.Types;
import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.nio.charset.StandardCharsets;
import java.security.Key;

@RestController
@RequestMapping("/api")
public class ApiController {

    @Autowired
    private JdbcTemplate db;

    @Autowired
    private PdfOsService pdfOsService;

    @Autowired
    private PdfRelVeiculoService pdfRelVeiculoService;
    
    private final Key key = Keys.secretKeyFor(SignatureAlgorithm.HS256);

    // --- AUTENTICAÇÃO ---
    @PostMapping("/auth/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credenciais) {
        String login = credenciais.get("login");
        String senha = credenciais.get("senha");
        try {
            Map<String, Object> user = db.queryForMap("SELECT * FROM tb_usuario WHERE login = ? OR email = ?", login, login);
            String hashSenha = (String) user.get("senha");
            BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

            if (encoder.matches(senha, hashSenha)) {
                String token = Jwts.builder()
                    .setSubject(user.get("login").toString())
                    .claim("cod_usuario", user.get("cod_usuario"))
                    .claim("nome", user.get("nome_usuario"))
                    .setIssuedAt(new Date())
                    .setExpiration(new Date(System.currentTimeMillis() + 28800000)) 
                    .signWith(key)
                    .compact();

                Map<String, Object> userResponse = new HashMap<>(user);
                userResponse.remove("senha");
                Map<String, Object> response = new HashMap<>();
                response.put("message", "Login sucesso");
                response.put("token", token);
                response.put("user", userResponse);
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(401).body(Collections.singletonMap("message", "Senha incorreta"));
            }
        } catch (EmptyResultDataAccessException e) {
            return ResponseEntity.status(401).body(Collections.singletonMap("message", "Usuário não encontrado"));
        }
    }
    
    @GetMapping("/auth/me")
    public ResponseEntity<?> me(@RequestHeader("Authorization") String tokenHeader) {
        if (tokenHeader == null || !tokenHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(Collections.singletonMap("message", "Validado")); 
    }

    // --- DASHBOARD ---
    @GetMapping("/dashboard/stats")
    public Map<String, Object> getStats() {
        Integer clientes = db.queryForObject("SELECT COUNT(*) FROM tb_cliente", Integer.class);
        Integer veiculos = db.queryForObject("SELECT COUNT(*) FROM tb_veiculo", Integer.class);
        Integer emAndamento = db.queryForObject("SELECT COUNT(*) FROM tb_ordem_servico WHERE status_servico = 3", Integer.class); // status_servico = 3 para "Em Andamento" 
        Integer concluidas = db.queryForObject("SELECT COUNT(cod_OS) FROM tb_ordem_servico WHERE status_servico = 4 AND MONTH(data_OS) = MONTH(CURDATE()) AND YEAR(data_OS) = YEAR(CURDATE());", Integer.class); // status_servico = 4 para "Concluídas" e filtra pelo mês atual (CURDATE())

        Map<String, Object> response = new HashMap<>();
        response.put("clientesAtivos", clientes != null ? clientes : 0);
        response.put("veiculosCadastrados", veiculos != null ? veiculos : 0);
        response.put("osEmAndamento", emAndamento != null ? emAndamento : 0);
        response.put("osConcluidasMes", concluidas != null ? concluidas : 0);
        return response;
    }

    @GetMapping("/clientes/{clientId}/os")
    public List<Map<String, Object>> listarOsDoCliente(@PathVariable int clientId) {
        String sql = "SELECT os.cod_OS, os.data_OS, os.fk_cod_veiculo, v.placa, v.modelo, v.montadora, v.cor, v.ano, c.nome_cliente, os.status_servico, os.valor_pago, " +
                     "(SELECT SUM(i.quantidade * i.valor) FROM tb_item_os i WHERE i.fk_cod_OS = os.cod_OS) as valor_total " +
                     "FROM tb_ordem_servico os " +
                     "JOIN tb_veiculo v ON os.fk_cod_veiculo = v.cod_veiculo " +
                     "JOIN tb_cliente c ON v.fk_cod_cliente = c.cod_cliente " +
                     "WHERE v.fk_cod_cliente = ? " +
                     "ORDER BY os.data_OS DESC, os.cod_OS DESC";
        return db.queryForList(sql, clientId);
    }

    // --- VEÍCULOS ---
    @GetMapping("/veiculos")
    public List<Map<String, Object>> listarVeiculos() {
        return db.queryForList("SELECT v.*, c.nome_cliente, (SELECT MAX(data_OS) FROM tb_ordem_servico WHERE fk_cod_veiculo = v.cod_veiculo) as ultima_os FROM tb_veiculo v JOIN tb_cliente c ON v.fk_cod_cliente = c.cod_cliente ORDER BY ultima_os IS NULL, ultima_os DESC, v.cod_veiculo DESC");
    }

    @GetMapping("/veiculos/{id}/details")
    public ResponseEntity<?> getVeiculoDetails(@PathVariable int id) {
        try {
            Map<String, Object> row = db.queryForMap("SELECT v.*, c.cod_cliente, c.nome_cliente, c.celular FROM tb_veiculo v JOIN tb_cliente c ON v.fk_cod_cliente = c.cod_cliente WHERE v.cod_veiculo = ?", id);
            Map<String, Object> cliente = new HashMap<>();
            cliente.put("cod_cliente", row.get("cod_cliente")); cliente.put("nome_cliente", row.get("nome_cliente")); cliente.put("celular", row.get("celular"));
            Map<String, Object> response = new HashMap<>();
            response.put("veiculo", row); response.put("cliente", cliente);
            return ResponseEntity.ok(response);
        } catch (EmptyResultDataAccessException e) { return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Collections.singletonMap("message", "Veículo não encontrado")); }
    }

    @PostMapping("/clientes/{clienteId}/veiculos")
    public ResponseEntity<?> adicionarVeiculo(
            @PathVariable int clienteId,
            @RequestBody Map<String, Object> veiculo,
            @RequestParam(defaultValue = "false") boolean force) {
        try {
            String placa = veiculo.get("placa").toString().replaceAll("[^a-zA-Z0-9]", "").toUpperCase();

            // Valida a placa: lança exceção em caso de erro definitivo ou conflito
            // (apenas pula a verificação de conflito com outros clientes se force=true)
            validarPlaca(placa, clienteId, force);

            Integer veiculoId = db.execute(
                connection -> {
                    CallableStatement cs = connection.prepareCall("{call InserirVeiculo(?, ?, ?, ?, ?, ?, ?, ?, ?)}");
                    cs.setString(1, (String) veiculo.get("montadora")); cs.setString(2, (String) veiculo.get("modelo")); cs.setString(3, veiculo.get("ano").toString());
                    cs.setString(4, placa); cs.setString(5, (String) veiculo.get("cor")); cs.setString(6, (String) veiculo.get("combustivel"));
                    cs.setString(7, (String) veiculo.getOrDefault("tipo", "C")); cs.setInt(8, clienteId); cs.registerOutParameter(9, Types.INTEGER); return cs;
                },
                (CallableStatementCallback<Integer>) cs -> { cs.execute(); return cs.getInt(9); }
            );
            Map<String, Object> response = new HashMap<>(veiculo); response.put("cod_veiculo", veiculoId); response.put("fk_cod_cliente", clienteId); response.put("placa", placa);
            return ResponseEntity.status(201).body(response);
        } catch (PlacaConflictException e) {
            // Relança para ser tratado pelo GlobalExceptionHandler (409 com body rico)
            throw e;
        } catch (Exception e) {
            if (e.getMessage() != null && e.getMessage().contains("Ano de fabricação futuro")) return ResponseEntity.status(400).body(Collections.singletonMap("message", "Erro: Ano de fabricação futuro."));
            if (e.getMessage() != null && e.getMessage().contains("Já existe um veículo")) return ResponseEntity.badRequest().body(Collections.singletonMap("message", e.getMessage()));
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Collections.singletonMap("message", "Erro ao criar veículo: " + e.getMessage()));
        }
    }
    
    @PutMapping("/veiculos/{id}")
    public ResponseEntity<?> atualizarVeiculo(
            @PathVariable int id,
            @RequestBody Map<String, Object> veiculo,
            @RequestParam int clienteId,
            @RequestParam(defaultValue = "false") boolean force) {
        try {
            String placa = veiculo.get("placa").toString().replaceAll("[^a-zA-Z0-9]", "").toUpperCase();

            // Busca a placa atual do veículo para detectar se houve mudança
            String placaAtual = db.queryForObject(
                "SELECT UPPER(REPLACE(REPLACE(placa, '-', ''), ' ', '')) FROM tb_veiculo WHERE cod_veiculo = ?",
                String.class, id);

            // Só executa a validação se a placa realmente mudou
            // (evita falso positivo ao salvar sem alterar a placa)
            // Considera também placa no formato Mercosul para teste, de forma que caso tenha mudado apenas o formato, seja aceito o mesmo veiculo.
            if (!placa.equals(placaAtual != null ? placaAtual : "") && !ConsultaPorPlaca.adaptaPlacaParaFormatoMercosul(placa).equals(placaAtual != null ? placaAtual : "")) {
                validarPlaca(placa, clienteId, force);
            }

            db.update("call AtualizarVeiculo(?, ?, ?, ?, ?, ?, ?, ?)", id, veiculo.get("montadora"), veiculo.get("modelo"), veiculo.get("ano"), placa, veiculo.get("cor"), veiculo.get("combustivel"), veiculo.getOrDefault("tipo", "C"));
            Map<String, Object> response = new HashMap<>(veiculo); response.put("cod_veiculo", id); response.put("placa", placa);
            return ResponseEntity.ok(response);
        } catch (PlacaConflictException e) {
            // Relança para ser tratado pelo GlobalExceptionHandler (409 com body rico)
            throw e;
        } catch (Exception e) {
            if (e.getMessage() != null && e.getMessage().contains("Já existe um veículo"))
                return ResponseEntity.badRequest().body(Collections.singletonMap("message", e.getMessage()));
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Collections.singletonMap("message", "Erro ao atualizar veículo: " + e.getMessage()));
        }
    }

    // ======================== MÉTODOS PRIVADOS ========================

    /**
     * Valida a placa no contexto de um cliente específico.
     * Cobre equivalência Mercosul (ex: HIK9536 == HIK9F36).
     *
     * - Lança IllegalArgumentException (400) se a placa já está cadastrada para este cliente.
     * - Lança PlacaConflictException (409) se está cadastrada para outros clientes e force=false.
     * - Retorna normalmente se a placa está livre ou se force=true (conflito ignorado pelo usuário).
     *
     * @param placa     Placa já limpa e em maiúsculas (somente alfanuméricos)
     * @param clienteId ID do cliente que está tentando cadastrar
     * @param force     Se true, ignora conflito com outros clientes (usuário confirmou)
     */
    private void validarPlaca(String placa, int clienteId, boolean force) {
        // Obtém a placa equivalente no outro formato (Mercosul <-> antigo)
        String placaAlternativa = ConsultaPorPlaca.adaptaPlacaParaFormatoMercosul(placa);

        // Monta as condições de comparação considerando ambos os formatos
        String condicaoPlaca = placaAlternativa != null
            ? "(REPLACE(REPLACE(v.placa, '-', ''), ' ', '') = ? OR REPLACE(REPLACE(v.placa, '-', ''), ' ', '') = ?)"
            : "REPLACE(REPLACE(v.placa, '-', ''), ' ', '') = ?";

        // 1. Erro definitivo: mesma placa (ou equivalente Mercosul) para o mesmo cliente
        String sqlMesmoCliente = "SELECT COUNT(*) FROM tb_veiculo v WHERE " + condicaoPlaca + " AND v.fk_cod_cliente = ?";
        Integer countMesmoCliente;
        if (placaAlternativa != null) {
            countMesmoCliente = db.queryForObject(sqlMesmoCliente, Integer.class, placa, placaAlternativa, clienteId);
        } else {
            countMesmoCliente = db.queryForObject(sqlMesmoCliente, Integer.class, placa, clienteId);
        }
        if (countMesmoCliente != null && countMesmoCliente > 0) {
            throw new IllegalArgumentException(
                "Já existe um veículo cadastrado com essa placa (" + placa + ") para o cliente atual. Veículo não salvo."
            );
        }

        // 2. Conflito com outros clientes (aviso — ignorável com force=true)
        if (!force) {
            String sqlOutrosClientes = "SELECT v.fk_cod_cliente as cod_cliente, c.nome_cliente " +
                "FROM tb_veiculo v " +
                "JOIN tb_cliente c ON v.fk_cod_cliente = c.cod_cliente " +
                "WHERE " + condicaoPlaca + " AND v.fk_cod_cliente != ?";

            List<Map<String, Object>> outrosProprietarios;
            if (placaAlternativa != null) {
                outrosProprietarios = db.queryForList(sqlOutrosClientes, placa, placaAlternativa, clienteId);
            } else {
                outrosProprietarios = db.queryForList(sqlOutrosClientes, placa, clienteId);
            }

            if (!outrosProprietarios.isEmpty()) {
                String msg = outrosProprietarios.size() == 1
                    ? "Já existe um veículo cadastrado com essa placa para outro cliente (Nome: " +
                      outrosProprietarios.get(0).get("nome_cliente") + "). Deseja prosseguir?"
                    : "Já existem veículos cadastrados com essa placa para outros " +
                      outrosProprietarios.size() + " clientes. Deseja prosseguir?";
                throw new PlacaConflictException(msg, outrosProprietarios);
            }
        }
    }
    
    @DeleteMapping("/veiculos/{id}")
    public ResponseEntity<?> deletarVeiculo(@PathVariable int id) {
        try { db.update("call DeletarVeiculo(?)", id); return ResponseEntity.noContent().build(); } 
        catch (Exception e) { return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Collections.singletonMap("message", "Erro ao excluir veículo: " + e.getMessage())); }
    }

    // --- ORDENS DE SERVIÇO ---
    @GetMapping("/os")
    public List<Map<String, Object>> listarOs(@RequestParam(required = false) String status) {
        String sql = "SELECT os.cod_OS, os.data_OS, os.tipo_desconto, os.desconto, os.status_servico, os.valor_pago, v.placa, v.modelo, v.montadora, v.cor, v.ano, v.fk_cod_cliente, c.nome_cliente, (SELECT SUM(quantidade * valor) FROM tb_item_os WHERE fk_cod_OS = os.cod_OS) as valor_total FROM tb_ordem_servico os JOIN tb_veiculo v ON os.fk_cod_veiculo = v.cod_veiculo JOIN tb_cliente c ON v.fk_cod_cliente = c.cod_cliente ";
        if (status != null && !status.equals("Todas") && !status.equals("null") && !status.startsWith("pag_")) {
            sql += " WHERE os.status_servico = ?";
            return db.queryForList(sql + " ORDER BY os.data_OS DESC, os.cod_OS DESC", status);
        }
        return db.queryForList(sql + " ORDER BY os.data_OS DESC, os.cod_OS DESC");
    }

    @GetMapping("/os/{id}")
    public ResponseEntity<?> getOs(@PathVariable int id) {
        try {
            Map<String, Object> os = db.queryForMap("SELECT * FROM tb_ordem_servico WHERE cod_OS = ?", id);
            Map<String, Object> statusObj = new HashMap<>();
            statusObj.put("status_servico", os.get("status_servico")); statusObj.put("valor_pago", os.get("valor_pago"));
            List<Map<String, Object>> items = db.queryForList("SELECT * FROM tb_item_os WHERE fk_cod_OS = ? ORDER BY tipo, cod_item", id);
            
            Map<String, Object> response = new HashMap<>();
            response.put("os", os); response.put("status", statusObj); response.put("items", items);
            return ResponseEntity.ok(response);
        } catch (EmptyResultDataAccessException e) { return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Collections.singletonMap("message", "OS não encontrada"));
        } catch (Exception e) { return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Collections.singletonMap("message", "Erro interno: " + e.getMessage())); }
    }

    @GetMapping("/os/{id}/pdf")
    public ResponseEntity<byte[]> getOsPdf(@PathVariable int id) {
        try {
            Map<String, Object> os = db.queryForMap("SELECT os.cod_OS, os.data_OS, os.quilometragem, os.descricao, os.tipo_desconto, os.desconto, os.status_servico, os.valor_pago, v.*, c.nome_cliente, c.celular, c.telefone, c.cpf_cnpj FROM tb_ordem_servico os JOIN tb_veiculo v ON os.fk_cod_veiculo = v.cod_veiculo JOIN tb_cliente c ON v.fk_cod_cliente = c.cod_cliente WHERE os.cod_OS = ?", id);
            List<Map<String, Object>> items = db.queryForList("SELECT * FROM tb_item_os WHERE fk_cod_OS = ? ORDER BY tipo, cod_item", id);

            Map<String, Object> dadosOs = new HashMap<>();
            dadosOs.put("cod_OS", os.get("cod_OS"));
            dadosOs.put("data_OS", os.get("data_OS"));
            dadosOs.put("quilometragem", os.get("quilometragem"));
            dadosOs.put("descricao", os.get("descricao"));
            dadosOs.put("status", os.get("status_servico"));
            dadosOs.put("valor_pago", os.get("valor_pago"));
            dadosOs.put("tipo_desconto", os.get("tipo_desconto"));
            dadosOs.put("desconto", os.get("desconto"));

            dadosOs.put("placa", os.get("placa"));
            dadosOs.put("montadora", os.get("montadora"));
            dadosOs.put("modelo", os.get("modelo"));
            dadosOs.put("cor", os.get("cor"));
            dadosOs.put("ano", os.get("ano").toString().substring(0, 4));
            dadosOs.put("combustivel", os.get("combustivel"));

            dadosOs.put("nome_cliente", os.get("nome_cliente"));
            dadosOs.put("celular", os.get("celular"));
            dadosOs.put("telefone", os.get("telefone"));
            dadosOs.put("cpf_cnpj", os.get("cpf_cnpj"));
            dadosOs.put("itens", items);

            byte[] pdfBytes = pdfOsService.gerarOsPdf(dadosOs);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            // Define o nome do arquivo para download, usando o código da OS
            String nomeArquivo = "os_" + os.get("cod_OS") + ".pdf";
            headers.add("Content-Disposition", "inline; filename=\"os_" + nomeArquivo + ".pdf\"");
            // headers.setContentDispositionFormData("attachment", "os_" + os.get("cod_OS") + ".pdf");
            return ResponseEntity.ok().headers(headers).body(pdfBytes);
        } catch (EmptyResultDataAccessException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    /**
     * Gera um PDF com as ordens de serviço de um veículo (código do veículo = {id}).
     * 
     * @param id ID do veículo
     * @param status Permite filtrar por status (default = 0 -> lista todos os status)
     *                  Status válidos: 0 -> Todos, 1 -> Orçamento, 2 -> Ordem de Serviço Aberta, 3 -> Serviço em Andamento, 4 -> Finalizado, 5-> Cancelado
     * @param dataInicio Permite filtrar por data de início (default = data atual)
     * @param dataFim Permite filtrar por data de fim (default = data atual)
     * @return Arquivo PDF com as ordens de serviço do veículo
     * 
     * Exemplo de uso:
     *      GET /api/veiculos/3961/os/pdf?status=1,2,3&dataInicio=2015-01-01&dataFim=2022-01-01
     *      (pega os orçamentos, ordens de serviço abertas e serviço em andamento de 2015 a 2022)
     */
    @GetMapping("/veiculos/{id}/os/pdf")
    public ResponseEntity<byte[]> getVeiculoOsPdf(
        @PathVariable int id,
        @RequestParam(value = "status", required = false, defaultValue = "4") List<Integer> status, // 0=Todos, 1=Orçamento, 2=OS Aberta, 3=Serviço em Andamento, 4=Finalizado, 5=Cancelado
        @RequestParam(value = "dataInicio", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
        @RequestParam(value = "dataFim", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim) {
        try {
            // 1. Busca dados do veículo e cliente
            Map<String, Object> dados = db.queryForMap(
                "SELECT v.*, c.nome_cliente, c.celular, c.telefone, c.cpf_cnpj " +
                "FROM tb_veiculo v JOIN tb_cliente c ON v.fk_cod_cliente = c.cod_cliente " +
                "WHERE v.cod_veiculo = ?", id
            );

            // 2. Construção dinâmica das queries de ordens e itens
            StringBuilder sqlOrdens = new StringBuilder(
                "SELECT os.cod_OS, os.data_OS, os.quilometragem, os.descricao, os.status_servico, os.tipo_desconto, os.desconto, os.valor_pago " +
                "FROM tb_ordem_servico os " +
                "WHERE os.fk_cod_veiculo = ?"
            );

            StringBuilder sqlItens = new StringBuilder(
                "SELECT i.*, os.cod_OS FROM tb_item_os i " +
                "JOIN tb_ordem_servico os ON i.fk_cod_OS = os.cod_OS " +
                "WHERE os.fk_cod_veiculo = ?"
            );

            // Lista para armazenar os parâmetros que serão injetados no SQL
            List<Object> params = new ArrayList<>();
            params.add(id);

            // Filtro de Status (Se contiver 0 ou estiver vazia, busca todos)
            if (status != null && !status.isEmpty() && !status.contains(0)) {
                String placeholders = String.join(",", Collections.nCopies(status.size(), "?"));
                
                sqlOrdens.append(" AND os.status_servico IN (").append(placeholders).append(")");
                sqlItens.append(" AND os.status_servico IN (").append(placeholders).append(")");
                
                // Adiciona os valores dos status duas vezes (uma para a query de ordens, outra para itens)
                List<Object> statusParams = new ArrayList<>(status);
                params.addAll(statusParams); 
            }

            // Filtro de Data Inicial
            if (dataInicio != null) {
                sqlOrdens.append(" AND os.data_OS >= ?");
                sqlItens.append(" AND os.data_OS >= ?");
                params.add(dataInicio);
            }

            // Filtro de Data Final
            if (dataFim != null) {
                sqlOrdens.append(" AND os.data_OS <= ?");
                sqlItens.append(" AND os.data_OS <= ?");
                params.add(dataFim);
            }

            // Ordenação final das queries
            sqlOrdens.append(" ORDER BY os.data_OS DESC, os.cod_OS DESC");
            sqlItens.append(" ORDER BY os.data_OS DESC, os.cod_OS DESC, i.tipo, i.cod_item");

            // Separa os parâmetros específicos de cada query baseando-se na ordem de construção
            Object[] paramsArray = params.toArray();

            // Executa as buscas no banco de dados com os filtros aplicados
            List<Map<String, Object>> ordens = db.queryForList(sqlOrdens.toString(), paramsArray);
            List<Map<String, Object>> itens = db.queryForList(sqlItens.toString(), paramsArray);

            if (ordens.isEmpty()) {
                String mensagem = String.format("Nenhuma ordem de serviço concluída encontrada para o veículo ID %d", id);
                return ResponseEntity
                  .status(HttpStatus.NOT_FOUND)
                  .contentType(MediaType.TEXT_PLAIN)
                  .body(mensagem.getBytes(StandardCharsets.UTF_8));
            }

            // 3. Agrupar itens por cod_OS dentro de cada ordem
            for (Map<String, Object> ordem : ordens) {
                List<Map<String, Object>> itensDaOrdem = new ArrayList<>();
                int codOs = Integer.parseInt(ordem.get("cod_OS").toString());

                for (Map<String, Object> item : itens) {
                    int codOsItem = Integer.parseInt(item.get("cod_OS").toString());
                    if (codOsItem == codOs) {
                        itensDaOrdem.add(item);
                    }
                }
                ordem.put("itens", itensDaOrdem);
            }

            Map<String, Object> dadosRelatorio = new HashMap<>();
            dadosRelatorio.put("dados", dados);
            dadosRelatorio.put("ordens", ordens);

            // 4. Geração e retorno do PDF
            byte[] pdfBytes = pdfRelVeiculoService.gerarRelatorioOsPorVeiculo(dadosRelatorio);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);

            String placa = dados.get("placa") != null ? dados.get("placa").toString().replaceAll("\\W", "").toUpperCase() : "veiculo";
            headers.setContentDispositionFormData("attachment", "relatorio_os_" + placa + "_" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + ".pdf");
            
            return ResponseEntity.ok().headers(headers).body(pdfBytes);

        } catch (EmptyResultDataAccessException e) {
            String mensagem = String.format("Veículo não encontrado para gerar PDF: ", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(mensagem.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            String mensagem = String.format("Erro ao gerar PDF: ", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(mensagem.getBytes(StandardCharsets.UTF_8));
        }
    }

    @PostMapping("/veiculos/{veiculoId}/os")
    public ResponseEntity<?> criarOs(@PathVariable int veiculoId, @RequestBody Map<String, Object> payload) {
        Map<String, Object> os = (Map<String, Object>) payload.get("os");
        Map<String, Object> status = (Map<String, Object>) payload.get("status");
        List<Map<String, Object>> items = (List<Map<String, Object>>) payload.get("items");

        try {
            Integer osId = db.execute(
                connection -> {
                    CallableStatement cs = connection.prepareCall("{call InserirOrdemDeServico(?, ?, ?, ?, ?, ?, ?, ?, ?)}");
                    cs.setString(1, (String) os.get("data_OS")); cs.setObject(2, os.get("quilometragem"));
                    cs.setString(3, (String) os.get("descricao")); cs.setString(4, (String) os.getOrDefault("tipo_desconto", "N"));
                    cs.setObject(5, os.getOrDefault("desconto", 0)); cs.setInt(6, veiculoId);
                    cs.setObject(7, status.getOrDefault("status_servico", 1)); cs.setObject(8, status.getOrDefault("valor_pago", 0));
                    cs.registerOutParameter(9, Types.INTEGER); return cs;
                },
                (CallableStatementCallback<Integer>) cs -> { cs.execute(); return cs.getInt(9); }
            );
            if (items != null) {
                for (Map<String, Object> item : items) {
                    db.update("call InserirItemOS(?, ?, ?, ?, ?)", item.get("nome_item"), item.get("quantidade"), item.get("valor"), item.get("tipo"), osId);
                }
            }
            Map<String, Object> response = new HashMap<>(os); response.put("cod_OS", osId); response.put("fk_cod_veiculo", veiculoId);
            return ResponseEntity.status(201).body(response);
        } catch (Exception e) {
             if (e.getMessage() != null && e.getMessage().contains("Data da O.S. futura")) return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Collections.singletonMap("message", "Erro: Data da O.S. futura."));
             return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Collections.singletonMap("message", "Erro ao criar OS: " + e.getMessage()));
        }
    }
    
    @PutMapping("/os/{id}")
    public ResponseEntity<?> atualizarOs(@PathVariable int id, @RequestBody Map<String, Object> payload) {
        Map<String, Object> os = (Map<String, Object>) payload.get("os");
        Map<String, Object> status = (Map<String, Object>) payload.get("status");
        List<Map<String, Object>> items = (List<Map<String, Object>>) payload.get("items");
        
        try {
            String dataOS = (String) os.get("data_OS");
            if (dataOS != null && dataOS.trim().isEmpty()) dataOS = null;
            
            SimpleDateFormat formatoData = new SimpleDateFormat("yyyy-MM-dd");
            formatoData.setLenient(false); // Garante que datas inválidas sejam rejeitadas

            db.update("call AtualizarOrdemDeServico(?, ?, ?, ?, ?, ?, ?, ?)",
                id, formatoData.parse(dataOS), os.get("quilometragem"), os.get("descricao"),
                os.getOrDefault("tipo_desconto", "N"), os.getOrDefault("desconto", 0),
                status.get("status_servico"), status.get("valor_pago")
            );
            
            List<Map<String, Object>> existingItems = db.queryForList("SELECT cod_item FROM tb_item_os WHERE fk_cod_OS = ?", id);
            List<Integer> incomingItemIds = new ArrayList<>();
            if (items != null) {
                for (Map<String, Object> item : items) {
                    if (item.containsKey("cod_item") && item.get("cod_item") != null) {
                        Integer codItem = ((Number) item.get("cod_item")).intValue();
                        incomingItemIds.add(codItem);
                        db.update("call AtualizarItemOS(?, ?, ?, ?, ?)", codItem, item.get("nome_item"), item.get("quantidade"), item.get("valor"), item.get("tipo"));
                    } else {
                        db.update("call InserirItemOS(?, ?, ?, ?, ?)", item.get("nome_item"), item.get("quantidade"), item.get("valor"), item.get("tipo"), id);
                    }
                }
            }
            for (Map<String, Object> extItem : existingItems) {
                Integer extId = ((Number) extItem.get("cod_item")).intValue();
                if (!incomingItemIds.contains(extId)) db.update("call DeletarItemOS(?)", extId);
            }
            return ResponseEntity.ok(Collections.singletonMap("message", "OS atualizada"));
        } catch (Exception e) { return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Collections.singletonMap("message", "Erro ao atualizar OS: " + e.getMessage())); }
    }
    
    @DeleteMapping("/os/{id}")
    public ResponseEntity<?> deletarOs(@PathVariable int id) {
        try { db.update("call DeletarOrdemDeServico(?)", id); return ResponseEntity.noContent().build(); } 
        catch (Exception e) { return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Collections.singletonMap("message", "Erro ao excluir OS: " + e.getMessage())); }
    }
}