package br.com.amasvisa.arborizacao.manutencao.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import br.com.amasvisa.arborizacao.manutencao.models.ManutencaoArvore;

public interface ManutencaoArvoreRepository extends JpaRepository<ManutencaoArvore, Long> {
}
