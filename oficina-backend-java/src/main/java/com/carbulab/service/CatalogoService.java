package com.carbulab.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import com.carbulab.exception.BusinessValidationException;
import com.carbulab.repositories.MontadoraRepository;
import com.carbulab.repositories.PecaRepository;
import com.carbulab.repositories.ServicoRepository;
import com.carbulab.repositories.ModeloRepository;
import com.carbulab.domain.veiculo.Montadora;
import com.carbulab.domain.veiculo.Modelo;
import com.carbulab.domain.ordem_servico.Peca;
import com.carbulab.domain.ordem_servico.Servico;

@Service
public class CatalogoService {
    
    private final MontadoraRepository montadoraRepository;
    private final ModeloRepository modeloRepository;
    private final PecaRepository pecaRepository;
    private final ServicoRepository servicoRepository;

    public CatalogoService(MontadoraRepository montadoraRepository,
                           ModeloRepository modeloRepository,
                           PecaRepository pecaRepository,
                           ServicoRepository servicoRepository) {
        this.montadoraRepository = montadoraRepository;
        this.modeloRepository = modeloRepository;
        this.pecaRepository = pecaRepository;
        this.servicoRepository = servicoRepository;
    }
    
    public List<Montadora> listarMontadoras() {
        return montadoraRepository.listarTodas();
    }
    
    public List<Modelo> listarModelosPorMontadora(Integer codMontadora) {
        return modeloRepository.listarPorMontadora(codMontadora);
    }

    public List<Peca> listarPecas() {
        return pecaRepository.findAllByOrderByNomePecaAsc();
    }

    public List<Servico> listarServicos() {
        return servicoRepository.findAllByOrderByNomeServicoAsc();
    }

    // ===================== DELETE (PERMANENTE) =======================

    @Transactional
    public void deletarPecaPermanentemente(Integer id) {
        try {
            pecaRepository.deleteById(id);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            throw new BusinessValidationException("Não é possível excluir esta peça, pois ela está sendo usada em uma ou mais Ordens de Serviço.");
        }
    }

    @Transactional
    public void deletarServicoPermanentemente(Integer id) {
        try {
            servicoRepository.deleteById(id);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            throw new BusinessValidationException("Não é possível excluir este serviço, pois ele está sendo usado em uma ou mais Ordens de Serviço.");
        }
    }
}
