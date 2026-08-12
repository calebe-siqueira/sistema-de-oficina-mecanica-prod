package com.carbulab.service;

import org.springframework.stereotype.Service;

import com.carbulab.dto.dashboard.DashboardStatsDTO;
import com.carbulab.repositories.ClienteRepository;
import com.carbulab.repositories.OrdemServicoRepository;
import com.carbulab.repositories.VeiculoRepository;

@Service
public class DashboardService {

    private final ClienteRepository clienteRepository;
    private final VeiculoRepository veiculoRepository;
    private final OrdemServicoRepository osRepository;

    public DashboardService(ClienteRepository clienteRepository, VeiculoRepository veiculoRepository, OrdemServicoRepository osRepository) {
        this.clienteRepository = clienteRepository;
        this.veiculoRepository = veiculoRepository;
        this.osRepository = osRepository;
    }

    public DashboardStatsDTO obterEstatisticas() {
        Long clientesAtivos = clienteRepository.countByDeletedAtIsNull();
        Long veiculosCadastrados = veiculoRepository.countByDeletedAtIsNull();
        
        // Status 3 = Em Andamento
        Long osEmAndamento = osRepository.countByStatusServicoAndDeletedAtIsNull(3);
        
        // Status 4 = Concluída no mês atual
        Long osConcluidasMes = osRepository.countConcluidasMesAtual(4);

        return new DashboardStatsDTO(
            clientesAtivos != null ? clientesAtivos : 0L,
            veiculosCadastrados != null ? veiculosCadastrados : 0L,
            osEmAndamento != null ? osEmAndamento : 0L,
            osConcluidasMes != null ? osConcluidasMes : 0L
        );
    }
}
