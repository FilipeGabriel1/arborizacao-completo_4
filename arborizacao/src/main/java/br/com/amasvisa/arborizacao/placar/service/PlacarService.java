package br.com.amasvisa.arborizacao.placar.service;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import br.com.amasvisa.arborizacao.area.repository.AreaArborizadaRepository;
import br.com.amasvisa.arborizacao.arvore.models.OrigemArvore;
import br.com.amasvisa.arborizacao.arvore.models.PorteArvore;
import br.com.amasvisa.arborizacao.arvore.models.StatusArvore;
import br.com.amasvisa.arborizacao.arvore.repository.ArvoreRepository;
import br.com.amasvisa.arborizacao.arvore.repository.EspecieArvoreRepository;
import br.com.amasvisa.arborizacao.doacao.models.DoacaoArvore;
import br.com.amasvisa.arborizacao.doacao.repository.DoacaoArvoreRepository;
import br.com.amasvisa.arborizacao.placar.models.DoacaoRecenteResponse;
import br.com.amasvisa.arborizacao.placar.models.PlacarArborizacaoResponse;

@Service
public class PlacarService {

    private final ArvoreRepository arvoreRepository;
    private final DoacaoArvoreRepository doacaoRepository;
    private final AreaArborizadaRepository areaRepository;
    private final EspecieArvoreRepository especieRepository;

    public PlacarService(ArvoreRepository arvoreRepository, DoacaoArvoreRepository doacaoRepository,
            AreaArborizadaRepository areaRepository, EspecieArvoreRepository especieRepository) {
        this.arvoreRepository = arvoreRepository;
        this.doacaoRepository = doacaoRepository;
        this.areaRepository = areaRepository;
        this.especieRepository = especieRepository;
    }

    public PlacarArborizacaoResponse obter() {
        Map<String, Long> porPorte = new LinkedHashMap<>();
        for (PorteArvore porte : PorteArvore.values()) {
            porPorte.put(porte.name(), arvoreRepository.countByPorte(porte));
        }

        Map<String, Long> porOrigem = new LinkedHashMap<>();
        for (OrigemArvore origem : OrigemArvore.values()) {
            porOrigem.put(origem.name(), arvoreRepository.countByOrigem(origem));
        }

        Map<String, Long> porStatus = new LinkedHashMap<>();
        for (StatusArvore status : StatusArvore.values()) {
            porStatus.put(status.name(), arvoreRepository.countByStatus(status));
        }

        List<DoacaoRecenteResponse> recentes = doacaoRepository.findTop12ByDataDoacaoIsNotNullOrderByDataDoacaoDesc()
                .stream()
                .map(this::toDoacaoRecente)
                .toList();

        return new PlacarArborizacaoResponse(
                arvoreRepository.count(),
                arvoreRepository.countByOrigem(OrigemArvore.DOACAO),
                doacaoRepository.count(),
                areaRepository.count(),
                especieRepository.count(),
                porPorte,
                porOrigem,
                porStatus,
                recentes,
                LocalDateTime.now());
    }

    private DoacaoRecenteResponse toDoacaoRecente(DoacaoArvore doacao) {
        return new DoacaoRecenteResponse(
                doacao.getId(),
                doacao.getSolicitante(),
                doacao.getDescricao(),
                doacao.getQuantidade(),
                doacao.getDataDoacao(),
                doacao.getArvore() != null && doacao.getArvore().getEspecie() != null
                        ? doacao.getArvore().getEspecie().getNomePopular()
                        : null);
    }
}