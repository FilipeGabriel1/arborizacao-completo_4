package br.com.amasvisa.arborizacao.doacao.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import br.com.amasvisa.arborizacao.doacao.models.DoacaoArvore;

public interface DoacaoArvoreRepository extends JpaRepository<DoacaoArvore, Long> {

    List<DoacaoArvore> findByCpf(String cpf);

    List<DoacaoArvore> findBySolicitanteContainingIgnoreCase(String solicitante);

    List<DoacaoArvore> findTop12ByDataDoacaoIsNotNullOrderByDataDoacaoDesc();

    @Query("SELECT COALESCE(SUM(d.quantidade), 0) FROM DoacaoArvore d")
    long sumQuantidade();
}
