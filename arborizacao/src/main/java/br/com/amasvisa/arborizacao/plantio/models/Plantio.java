package br.com.amasvisa.arborizacao.plantio.models;

import java.time.LocalDate;
import java.time.LocalDateTime;

import br.com.amasvisa.arborizacao.area.models.AreaArborizada;
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
@Table(name = "plantios")
public class Plantio {

    @Id
    @Column(name = "plantio_id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "area_id")
    private AreaArborizada area;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "especie_id")
    private EspecieArvore especie;

    @Column(name = "quantidade_mudas")
    private Integer quantidadeMudas;

    @Column(name = "data_plantio")
    private LocalDate dataPlantio;

    @Column(name = "responsavel", length = 150)
    private String responsavel;

    @Column(name = "descricao", columnDefinition = "TEXT")
    private String descricao;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatusPlantio status;

    @Column(name = "criado_em", nullable = false)
    private LocalDateTime criadoEm;

    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm;

    public Plantio() {
    }

    public void prepararPersistencia() {
        LocalDateTime agora = LocalDateTime.now();
        if (criadoEm == null) {
            criadoEm = agora;
        }
        atualizadoEm = agora;
    }

    public Long getId() { return id; }
    public AreaArborizada getArea() { return area; }
    public void setArea(AreaArborizada area) { this.area = area; }
    public EspecieArvore getEspecie() { return especie; }
    public void setEspecie(EspecieArvore especie) { this.especie = especie; }
    public Integer getQuantidadeMudas() { return quantidadeMudas; }
    public void setQuantidadeMudas(Integer quantidadeMudas) { this.quantidadeMudas = quantidadeMudas; }
    public LocalDate getDataPlantio() { return dataPlantio; }
    public void setDataPlantio(LocalDate dataPlantio) { this.dataPlantio = dataPlantio; }
    public String getResponsavel() { return responsavel; }
    public void setResponsavel(String responsavel) { this.responsavel = responsavel; }
    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }
    public StatusPlantio getStatus() { return status; }
    public void setStatus(StatusPlantio status) { this.status = status; }
    public LocalDateTime getCriadoEm() { return criadoEm; }
    public LocalDateTime getAtualizadoEm() { return atualizadoEm; }
}
