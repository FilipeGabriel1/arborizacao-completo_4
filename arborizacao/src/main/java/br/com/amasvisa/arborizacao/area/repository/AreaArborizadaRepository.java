package br.com.amasvisa.arborizacao.area.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import br.com.amasvisa.arborizacao.area.models.AreaArborizada;

public interface AreaArborizadaRepository extends JpaRepository<AreaArborizada, Long> {
    List<AreaArborizada> findByNomeContainingIgnoreCase(String nome);
    Page<AreaArborizada> findByNomeContainingIgnoreCase(String nome, Pageable pageable);
}