package br.com.amasvisa.arborizacao.plantio.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import br.com.amasvisa.arborizacao.plantio.models.Plantio;

public interface PlantioRepository extends JpaRepository<Plantio, Long> {
}
