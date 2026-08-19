package br.com.amasvisa.arborizacao.arvore.models;

import java.time.LocalDateTime;

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
@Table(name = "arvores_fotos")
public class ArvoreFoto {

    @Id
    @Column(name = "arvores_fotos_id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "arvore_id", nullable = false)
    private Arvore arvore;

    @Column(nullable = false, length = 500)
    private String url;

    @Column(length = 255)
    private String descricao;

    @Column(name = "criado_em", nullable = false)
    private LocalDateTime criadoEm;

    public ArvoreFoto() {
    }

    public void prepararPersistencia() {
        if (criadoEm == null) {
            criadoEm = LocalDateTime.now();
        }
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

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public LocalDateTime getCriadoEm() {
        return criadoEm;
    }
}