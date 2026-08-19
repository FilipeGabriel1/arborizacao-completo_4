package br.com.amasvisa.arborizacao.arvore.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import br.com.amasvisa.arborizacao.arvore.models.Arvore;

public interface ArvoreRepository extends JpaRepository<Arvore, Long> {
    List<Arvore> findByNomeContainingIgnoreCase(String nome);
    List<Arvore> findByArea_Id(Long areaId);
    List<Arvore> findByEspecie_Id(Long especieId);
    Page<Arvore> findByNomeContainingIgnoreCase(String nome, Pageable pageable);
    Page<Arvore> findByArea_Id(Long areaId, Pageable pageable);
    Page<Arvore> findByEspecie_Id(Long especieId, Pageable pageable);
}