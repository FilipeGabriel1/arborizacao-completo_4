package br.com.amasvisa.arborizacao.doacao.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import br.com.amasvisa.arborizacao.doacao.models.DoacaoArvore;

public interface DoacaoArvoreRepository extends JpaRepository<DoacaoArvore, Long> {
}
