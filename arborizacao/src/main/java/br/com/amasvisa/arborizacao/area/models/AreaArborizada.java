package br.com.amasvisa.arborizacao.area.models;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

@Entity
@Table(name = "areas_arborizadas")
public class AreaArborizada {

    @Id
    @Column(name = "area_id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String nome;

    @Column(length = 500)
    private String descricao;

    @Column(name = "foto_url", length = 500)
    private String fotoUrl;

    @OneToMany(mappedBy = "area", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AreaFoto> fotos = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TipoArea tipo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = true, length = 30)
    private AreaStatus status;

    @Column(length = 120)
    private String bairro;

    @Column(length = 200)
    private String logradouro;

    @Column(name = "area_total_m2")
    private Double areaTotalM2;

    @Column(name = "responsavel_manutencao", length = 200)
    private String responsavelManutencao;

    @Enumerated(EnumType.STRING)
    @Column(name = "situacao_inventario", length = 30)
    private SituacaoInventario situacaoInventario;

    @Column(name = "individuos_cadastrados")
    private Integer individuosCadastrados;

    @Column(name = "ultima_atualizacao_inventario")
    private LocalDateTime ultimaAtualizacaoInventario;

    private Double latitude;
    private Double longitude;

    @ElementCollection
    @CollectionTable(name = "areas_pontos", joinColumns = @JoinColumn(name = "area_id"))
    private List<PontoGeografico> pontos = new ArrayList<>();

    @Column(nullable = false)
    private LocalDateTime criadoEm;

    @Column(nullable = false)
    private LocalDateTime atualizadoEm;

    public AreaArborizada() {
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

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public String getFotoUrl() {
        return fotoUrl;
    }

    public void setFotoUrl(String fotoUrl) {
        this.fotoUrl = fotoUrl;
    }

    public List<AreaFoto> getFotos() {
        return fotos;
    }

    public void setFotos(List<AreaFoto> fotos) {
        this.fotos = fotos;
    }

    public TipoArea getTipo() {
        return tipo;
    }

    public void setTipo(TipoArea tipo) {
        this.tipo = tipo;
    }

    public AreaStatus getStatus() {
        return status;
    }

    public void setStatus(AreaStatus status) {
        this.status = status;
    }

    public String getBairro() {
        return bairro;
    }

    public void setBairro(String bairro) {
        this.bairro = bairro;
    }

    public String getLogradouro() {
        return logradouro;
    }

    public void setLogradouro(String logradouro) {
        this.logradouro = logradouro;
    }

    public Double getAreaTotalM2() {
        return areaTotalM2;
    }

    public void setAreaTotalM2(Double areaTotalM2) {
        this.areaTotalM2 = areaTotalM2;
    }

    public String getResponsavelManutencao() {
        return responsavelManutencao;
    }

    public void setResponsavelManutencao(String responsavelManutencao) {
        this.responsavelManutencao = responsavelManutencao;
    }

    public SituacaoInventario getSituacaoInventario() {
        return situacaoInventario;
    }

    public void setSituacaoInventario(SituacaoInventario situacaoInventario) {
        this.situacaoInventario = situacaoInventario;
    }

    public Integer getIndividuosCadastrados() {
        return individuosCadastrados;
    }

    public void setIndividuosCadastrados(Integer individuosCadastrados) {
        this.individuosCadastrados = individuosCadastrados;
    }

    public LocalDateTime getUltimaAtualizacaoInventario() {
        return ultimaAtualizacaoInventario;
    }

    public void setUltimaAtualizacaoInventario(LocalDateTime ultimaAtualizacaoInventario) {
        this.ultimaAtualizacaoInventario = ultimaAtualizacaoInventario;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public List<PontoGeografico> getPontos() {
        return pontos;
    }

    public void setPontos(List<PontoGeografico> pontos) {
        this.pontos = pontos;
    }

    public LocalDateTime getCriadoEm() {
        return criadoEm;
    }

    public LocalDateTime getAtualizadoEm() {
        return atualizadoEm;
    }
}