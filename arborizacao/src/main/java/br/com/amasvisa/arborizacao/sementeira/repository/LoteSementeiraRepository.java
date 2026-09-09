package br.com.amasvisa.arborizacao.sementeira.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import br.com.amasvisa.arborizacao.sementeira.models.LoteSementeira;

public interface LoteSementeiraRepository extends JpaRepository<LoteSementeira, Long> {
}
