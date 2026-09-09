package br.com.amasvisa.arborizacao.manutencao.models;

import java.time.LocalDate;
import java.time.LocalDateTime;

import br.com.amasvisa.arborizacao.arvore.models.Arvore;
import br.com.amasvisa.arborizacao.arvore.models.PrioridadeManejo;
import br.com.amasvisa.arborizacao.arvore.models.TipoManejo;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "manutencoes_arvore")
public class ManutencaoArvore {

    @Id
    @Column(name = "manutencao_id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "arvore_id")
    private Arvore arvore;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TipoManejo tipo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PrioridadeManejo prioridade;

    @Column(name = "data_agendada")
    private LocalDate dataAgendada;

    @Column(name = "data_execucao")
    private LocalDate dataExecucao;

    @Column(name = "responsavel_execucao", length = 150)
    private String responsavelExecucao;

    @Column(name = "observacoes", columnDefinition = "TEXT")
    private String observacoes;

    @Column(length = 30)
    private String status;

    @Column(name = "criado_em", nullable = false)
    private LocalDateTime criadoEm;

    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm;

    public ManutencaoArvore() {
    }

    public void prepararPersistencia() {
        LocalDateTime agora = LocalDateTime.now();
        if (criadoEm == null) {
            criadoEm = agora;
        }
        atualizadoEm = agora;
    }

    public Long getId() { return id; }
    public Arvore getArvore() { return arvore; }
    public void setArvore(Arvore arvore) { this.arvore = arvore; }
    public TipoManejo getTipo() { return tipo; }
    public void setTipo(TipoManejo tipo) { this.tipo = tipo; }
    public PrioridadeManejo getPrioridade() { return prioridade; }
    public void setPrioridade(PrioridadeManejo prioridade) { this.prioridade = prioridade; }
    public LocalDate getDataAgendada() { return dataAgendada; }
    public void setDataAgendada(LocalDate dataAgendada) { this.dataAgendada = dataAgendada; }
    public LocalDate getDataExecucao() { return dataExecucao; }
    public void setDataExecucao(LocalDate dataExecucao) { this.dataExecucao = dataExecucao; }
    public String getResponsavelExecucao() { return responsavelExecucao; }
    public void setResponsavelExecucao(String responsavelExecucao) { this.responsavelExecucao = responsavelExecucao; }
    public String getObservacoes() { return observacoes; }
    public void setObservacoes(String observacoes) { this.observacoes = observacoes; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getCriadoEm() { return criadoEm; }
    public LocalDateTime getAtualizadoEm() { return atualizadoEm; }
}
