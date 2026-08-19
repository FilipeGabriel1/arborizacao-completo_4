package br.com.amasvisa.arborizacao.arvore.models;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "especies_arvores")
public class EspecieArvore {

    @Id
    @Column(name = "especies_arvores_id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nome_popular", nullable = false, length = 120)
    private String nomePopular;

    @Column(name = "nome_cientifico", length = 180, unique = true)
    private String nomeCientifico;

    @Column(length = 120)
    private String familia;

    @Column(name = "porte_padrao", length = 20)
    private String portePadrao;

    @Column(columnDefinition = "TEXT")
    private String observacoes;

    @Column(name = "criado_em", nullable = false)
    private LocalDateTime criadoEm;

    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm;

    public EspecieArvore() {
    }

    public void prepararPersistencia() {
        LocalDateTime agora = LocalDateTime.now();
        if (criadoEm == null) {
            criadoEm = agora;
        }
        atualizadoEm = agora;
    }

    public Long getId() {
        return id;
    }

    public String getNomePopular() {
        return nomePopular;
    }

    public void setNomePopular(String nomePopular) {
        this.nomePopular = nomePopular;
    }

    public String getNomeCientifico() {
        return nomeCientifico;
    }

    public void setNomeCientifico(String nomeCientifico) {
        this.nomeCientifico = nomeCientifico;
    }

    public String getFamilia() {
        return familia;
    }

    public void setFamilia(String familia) {
        this.familia = familia;
    }

    public String getPortePadrao() {
        return portePadrao;
    }

    public void setPortePadrao(String portePadrao) {
        this.portePadrao = portePadrao;
    }

    public String getObservacoes() {
        return observacoes;
    }

    public void setObservacoes(String observacoes) {
        this.observacoes = observacoes;
    }

    public LocalDateTime getCriadoEm() {
        return criadoEm;
    }

    public LocalDateTime getAtualizadoEm() {
        return atualizadoEm;
    }
}