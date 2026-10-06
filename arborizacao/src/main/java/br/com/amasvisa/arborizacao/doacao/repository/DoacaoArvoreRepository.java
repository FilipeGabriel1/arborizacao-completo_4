package br.com.amasvisa.arborizacao.doacao.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import br.com.amasvisa.arborizacao.doacao.models.DoacaoArvore;

public interface DoacaoArvoreRepository extends JpaRepository<DoacaoArvore, Long> {

    // Observação: NÃO existe findByCpf — o CPF é cifrado com IV aleatório,
    // então cada registro tem bytes diferentes; a filtragem por CPF decifra
    // em memória (ver DoacaoArvoreService.extratoDoador).

    List<DoacaoArvore> findBySolicitanteContainingIgnoreCase(String solicitante);

    List<DoacaoArvore> findTop12ByDataDoacaoIsNotNullOrderByDataDoacaoDesc();

    @Query("SELECT COALESCE(SUM(d.quantidade), 0) FROM DoacaoArvore d")
    long sumQuantidade();
}
