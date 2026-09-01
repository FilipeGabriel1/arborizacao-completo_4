package br.com.amasvisa.arborizacao.doacao.service;

import java.util.Comparator;
import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import br.com.amasvisa.arborizacao.arvore.models.Arvore;
import br.com.amasvisa.arborizacao.arvore.repository.ArvoreRepository;
import br.com.amasvisa.arborizacao.auditoria.models.AcaoAuditoria;
import br.com.amasvisa.arborizacao.auditoria.models.TipoEntidadeAuditoria;
import br.com.amasvisa.arborizacao.auditoria.service.AuditoriaService;
import br.com.amasvisa.arborizacao.doacao.models.DoacaoArvore;
import br.com.amasvisa.arborizacao.doacao.models.DoacaoArvoreRequest;
import br.com.amasvisa.arborizacao.doacao.models.DoacaoArvoreResponse;
import br.com.amasvisa.arborizacao.doacao.models.ExtratoDoadorResponse;
import br.com.amasvisa.arborizacao.doacao.repository.DoacaoArvoreRepository;
import br.com.amasvisa.arborizacao.comum.PaginaResponse;
import br.com.amasvisa.arborizacao.config.EncryptService;
import jakarta.persistence.EntityNotFoundException;

@Service
public class DoacaoArvoreService {

    private final DoacaoArvoreRepository repository;
    private final ArvoreRepository arvoreRepository;
    private final AuditoriaService auditoriaService;
    private final EncryptService encryptService;

    public DoacaoArvoreService(DoacaoArvoreRepository repository, ArvoreRepository arvoreRepository,
            AuditoriaService auditoriaService, EncryptService encryptService) {
        this.repository = repository;
        this.arvoreRepository = arvoreRepository;
        this.auditoriaService = auditoriaService;
        this.encryptService = encryptService;
    }

    public DoacaoArvoreResponse criar(DoacaoArvoreRequest request) {
        DoacaoArvore doacao = new DoacaoArvore();
        doacao.setArvore(obterArvore(request.arvoreId()));
        doacao.setDescricao(request.descricao());
        doacao.setSolicitante(request.solicitante());
        doacao.setDataDoacao(request.dataDoacao());
        doacao.setDestinacao(request.destinacao());
        doacao.setQuantidade(request.quantidade());
        doacao.setCpf(encryptService.encrypt(request.cpf()));
        doacao.setRg(encryptService.encrypt(request.rg()));

        DoacaoArvoreResponse response = toResponse(repository.save(doacao));
        auditoriaService.registrar(TipoEntidadeAuditoria.DOACAO, response.id(), AcaoAuditoria.CRIACAO,
                "Doação registrada: " + detalheDoacao(response.solicitante()));
        return response;
    }

    public PaginaResponse<DoacaoArvoreResponse> listar(Pageable pageable) {
        return PaginaResponse.of(repository.findAll(pageable).map(this::toResponse));
    }

    public DoacaoArvoreResponse buscarPorId(Long id) {
        return toResponse(obterEntidade(id));
    }

    public DoacaoArvoreResponse atualizar(Long id, DoacaoArvoreRequest request) {
        DoacaoArvore doacao = obterEntidade(id);
        doacao.setArvore(obterArvore(request.arvoreId()));
        doacao.setDescricao(request.descricao());
        doacao.setSolicitante(request.solicitante());
        doacao.setDataDoacao(request.dataDoacao());
        doacao.setDestinacao(request.destinacao());
        doacao.setQuantidade(request.quantidade());
        doacao.setCpf(encryptService.encrypt(request.cpf()));
        doacao.setRg(encryptService.encrypt(request.rg()));

        DoacaoArvoreResponse response = toResponse(repository.save(doacao));
        auditoriaService.registrar(TipoEntidadeAuditoria.DOACAO, response.id(), AcaoAuditoria.EDICAO,
                "Doação atualizada: " + detalheDoacao(response.solicitante()));
        return response;
    }

    public void remover(Long id) {
        DoacaoArvore doacao = obterEntidade(id);
        repository.delete(doacao);
        auditoriaService.registrar(TipoEntidadeAuditoria.DOACAO, id, AcaoAuditoria.EXCLUSAO,
                "Doação excluída: " + detalheDoacao(doacao.getSolicitante()));
    }

    public ExtratoDoadorResponse extratoDoador(String cpf, String nome) {
        List<DoacaoArvore> doacoes;
        if (cpf != null && !cpf.isBlank()) {
            String cpfCriptografado = encryptService.encrypt(cpf.replaceAll("\\D", ""));
            doacoes = repository.findByCpf(cpfCriptografado);
        } else {
            String termo = nome == null ? "" : nome.trim();
            doacoes = termo.isBlank() ? repository.findAll()
                    : repository.findBySolicitanteContainingIgnoreCase(termo);
        }

        if (doacoes.isEmpty()) {
            return new ExtratoDoadorResponse(
                    nome == null ? null : nome.trim(),
                    cpf == null ? null : cpf.trim(),
                    null,
                    0, 0, null, null,
                    List.of());
        }

        List<DoacaoArvore> ordenadas = doacoes.stream()
                .sorted(Comparator.comparing(DoacaoArvore::getDataDoacao,
                        Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .toList();

        DoacaoArvore primeira = doacoes.stream()
                .filter(d -> d.getDataDoacao() != null)
                .min(Comparator.comparing(DoacaoArvore::getDataDoacao))
                .orElse(null);
        DoacaoArvore ultima = doacoes.stream()
                .filter(d -> d.getDataDoacao() != null)
                .max(Comparator.comparing(DoacaoArvore::getDataDoacao))
                .orElse(null);

        long totalQuantidade = doacoes.stream()
                .mapToLong(d -> d.getQuantidade() == null ? 0 : d.getQuantidade())
                .sum();

        DoacaoArvore amostra = ordenadas.get(0);
        return new ExtratoDoadorResponse(
                amostra.getSolicitante(),
                encryptService.decrypt(amostra.getCpf()),
                encryptService.decrypt(amostra.getRg()),
                doacoes.size(),
                totalQuantidade,
                primeira != null ? primeira.getDataDoacao() : null,
                ultima != null ? ultima.getDataDoacao() : null,
                ordenadas.stream().map(this::toResponse).toList());
    }

    private String detalheDoacao(String solicitante) {
        return (solicitante == null || solicitante.isBlank()) ? "sem solicitante informado" : solicitante;
    }

    private DoacaoArvore obterEntidade(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Doação não encontrada: " + id));
    }

    private Arvore obterArvore(Long arvoreId) {
        return arvoreRepository.findById(arvoreId)
                .orElseThrow(() -> new EntityNotFoundException("Árvore não encontrada: " + arvoreId));
    }

    private DoacaoArvoreResponse toResponse(DoacaoArvore doacao) {
        return new DoacaoArvoreResponse(
                doacao.getId(),
                doacao.getArvore() != null ? doacao.getArvore().getId() : null,
                doacao.getArvore() != null ? doacao.getArvore().getNome() : null,
                doacao.getArvore() != null && doacao.getArvore().getEspecie() != null
                        ? doacao.getArvore().getEspecie().getNomePopular()
                        : null,
                doacao.getDescricao(),
                doacao.getSolicitante(),
                doacao.getDataDoacao(),
                doacao.getDestinacao(),
                doacao.getQuantidade(),
                encryptService.decrypt(doacao.getCpf()),
                encryptService.decrypt(doacao.getRg())
        );
    }
}
