package br.com.amasvisa.arborizacao.arvore.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import br.com.amasvisa.arborizacao.arvore.models.Arvore;
import br.com.amasvisa.arborizacao.arvore.models.OrigemArvore;
import br.com.amasvisa.arborizacao.arvore.models.PorteArvore;
import br.com.amasvisa.arborizacao.arvore.models.StatusArvore;

public interface ArvoreRepository extends JpaRepository<Arvore, Long> {
    List<Arvore> findByNomeContainingIgnoreCase(String nome);
    List<Arvore> findByArea_Id(Long areaId);
    List<Arvore> findByEspecie_Id(Long especieId);
    Page<Arvore> findByNomeContainingIgnoreCase(String nome, Pageable pageable);
    Page<Arvore> findByArea_Id(Long areaId, Pageable pageable);
    Page<Arvore> findByEspecie_Id(Long especieId, Pageable pageable);

    long countByArea_Id(Long areaId);
    long countByPorte(PorteArvore porte);
    long countByOrigem(OrigemArvore origem);
    long countByStatus(StatusArvore status);

    List<Arvore> findTop12ByOrderByCriadoEmDesc();

    @Query("SELECT ar.area.id, COUNT(ar) FROM Arvore ar WHERE ar.area.id IN :ids GROUP BY ar.area.id")
    List<Object[]> contarPorAreaIds(@Param("ids") List<Long> ids);
}