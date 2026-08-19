package br.com.amasvisa.arborizacao.arvore.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import br.com.amasvisa.arborizacao.arvore.models.EspecieArvore;

public interface EspecieArvoreRepository extends JpaRepository<EspecieArvore, Long> {
    List<EspecieArvore> findByNomePopularContainingIgnoreCase(String nomePopular);
}