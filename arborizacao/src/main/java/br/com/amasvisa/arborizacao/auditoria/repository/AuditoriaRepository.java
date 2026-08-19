package br.com.amasvisa.arborizacao.auditoria.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import br.com.amasvisa.arborizacao.auditoria.models.RegistroAuditoria;

public interface AuditoriaRepository extends JpaRepository<RegistroAuditoria, Long> {

    List<RegistroAuditoria> findAllByOrderByDataHoraDesc();
}