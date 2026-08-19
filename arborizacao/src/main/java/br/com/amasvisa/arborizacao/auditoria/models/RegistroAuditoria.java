package br.com.amasvisa.arborizacao.auditoria.models;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "auditoria")
public class RegistroAuditoria {

    @Id
    @Column(name = "auditoria_id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "data_hora", nullable = false)
    private LocalDateTime dataHora;

    @Column(name = "usuario_email", length = 150)
    private String usuarioEmail;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AcaoAuditoria acao;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TipoEntidadeAuditoria entidade;

    @Column(name = "entidade_id")
    private Long entidadeId;

    @Column(length = 500)
    private String detalhe;

    public RegistroAuditoria() {
    }

    public Long getId() {
        return id;
    }

    public LocalDateTime getDataHora() {
        return dataHora;
    }

    public void setDataHora(LocalDateTime dataHora) {
        this.dataHora = dataHora;
    }

    public String getUsuarioEmail() {
        return usuarioEmail;
    }

    public void setUsuarioEmail(String usuarioEmail) {
        this.usuarioEmail = usuarioEmail;
    }

    public AcaoAuditoria getAcao() {
        return acao;
    }

    public void setAcao(AcaoAuditoria acao) {
        this.acao = acao;
    }

    public TipoEntidadeAuditoria getEntidade() {
        return entidade;
    }

    public void setEntidade(TipoEntidadeAuditoria entidade) {
        this.entidade = entidade;
    }

    public Long getEntidadeId() {
        return entidadeId;
    }

    public void setEntidadeId(Long entidadeId) {
        this.entidadeId = entidadeId;
    }

    public String getDetalhe() {
        return detalhe;
    }

    public void setDetalhe(String detalhe) {
        this.detalhe = detalhe;
    }
}