package br.com.amasvisa.arborizacao.sementeira.models;

import java.time.LocalDate;
import java.time.LocalDateTime;

import br.com.amasvisa.arborizacao.arvore.models.EspecieArvore;
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
@Table(name = "lotes_sementeira")
public class LoteSementeira {

    @Id
    @Column(name = "lote_id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "numero_lote", nullable = false, length = 30)
    private String numeroLote;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "especie_id")
    private EspecieArvore especie;

    @Column(name = "quantidade_produzida")
    private Integer quantidadeProduzida;

    @Column(name = "quantidade_disponivel")
    private Integer quantidadeDisponivel;

    @Column(name = "quantidade_doadas")
    private Integer quantidadeDoadas;

    @Column(name = "quantidade_plantadas")
    private Integer quantidadePlantadas;

    @Column(name = "quantidade_perdas")
    private Integer quantidadePerdas;

    @Column(name = "data_producao")
    private LocalDate dataProducao;

    @Column(name = "origem_sementes", length = 200)
    private String origemSementes;

    @Column(length = 500)
    private String observacoes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatusLote status;

    @Column(name = "criado_em", nullable = false)
    private LocalDateTime criadoEm;

    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm;

    public LoteSementeira() {
    }

    public void prepararPersistencia() {
        LocalDateTime agora = LocalDateTime.now();
        if (criadoEm == null) {
            criadoEm = agora;
        }
        atualizadoEm = agora;
    }

    public Long getId() { return id; }
    public String getNumeroLote() { return numeroLote; }
    public void setNumeroLote(String numeroLote) { this.numeroLote = numeroLote; }
    public EspecieArvore getEspecie() { return especie; }
    public void setEspecie(EspecieArvore especie) { this.especie = especie; }
    public Integer getQuantidadeProduzida() { return quantidadeProduzida; }
    public void setQuantidadeProduzida(Integer quantidadeProduzida) { this.quantidadeProduzida = quantidadeProduzida; }
    public Integer getQuantidadeDisponivel() { return quantidadeDisponivel; }
    public void setQuantidadeDisponivel(Integer quantidadeDisponivel) { this.quantidadeDisponivel = quantidadeDisponivel; }
    public Integer getQuantidadeDoadas() { return quantidadeDoadas; }
    public void setQuantidadeDoadas(Integer quantidadeDoadas) { this.quantidadeDoadas = quantidadeDoadas; }
    public Integer getQuantidadePlantadas() { return quantidadePlantadas; }
    public void setQuantidadePlantadas(Integer quantidadePlantadas) { this.quantidadePlantadas = quantidadePlantadas; }
    public Integer getQuantidadePerdas() { return quantidadePerdas; }
    public void setQuantidadePerdas(Integer quantidadePerdas) { this.quantidadePerdas = quantidadePerdas; }
    public LocalDate getDataProducao() { return dataProducao; }
    public void setDataProducao(LocalDate dataProducao) { this.dataProducao = dataProducao; }
    public String getOrigemSementes() { return origemSementes; }
    public void setOrigemSementes(String origemSementes) { this.origemSementes = origemSementes; }
    public String getObservacoes() { return observacoes; }
    public void setObservacoes(String observacoes) { this.observacoes = observacoes; }
    public StatusLote getStatus() { return status; }
    public void setStatus(StatusLote status) { this.status = status; }
    public LocalDateTime getCriadoEm() { return criadoEm; }
    public LocalDateTime getAtualizadoEm() { return atualizadoEm; }
}
