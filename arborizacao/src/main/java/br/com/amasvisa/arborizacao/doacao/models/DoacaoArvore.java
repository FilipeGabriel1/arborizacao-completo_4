package br.com.amasvisa.arborizacao.doacao.models;

import java.time.LocalDate;

import br.com.amasvisa.arborizacao.arvore.models.Arvore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "doacoes_arvores")
public class DoacaoArvore {

    @Id
    @Column(name = "doacoes_arvores_id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "arvore_id")
    private Arvore arvore;

    @Column(columnDefinition = "TEXT")
    private String descricao;

    @Column(length = 150)
    private String solicitante;

    @Column(name = "data_doacao")
    private LocalDate dataDoacao;

    @Column(length = 150)
    private String destinacao;

    public DoacaoArvore() {
    }

    public Long getId() {
        return id;
    }

    public Arvore getArvore() {
        return arvore;
    }

    public void setArvore(Arvore arvore) {
        this.arvore = arvore;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public String getSolicitante() {
        return solicitante;
    }

    public void setSolicitante(String solicitante) {
        this.solicitante = solicitante;
    }

    public LocalDate getDataDoacao() {
        return dataDoacao;
    }

    public void setDataDoacao(LocalDate dataDoacao) {
        this.dataDoacao = dataDoacao;
    }

    public String getDestinacao() {
        return destinacao;
    }

    public void setDestinacao(String destinacao) {
        this.destinacao = destinacao;
    }
}
