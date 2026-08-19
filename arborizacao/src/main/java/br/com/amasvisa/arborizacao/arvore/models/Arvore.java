package br.com.amasvisa.arborizacao.arvore.models;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import br.com.amasvisa.arborizacao.area.models.AreaArborizada;
import jakarta.persistence.CascadeType;
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
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

@Entity
@Table(name = "arvores")
public class Arvore {

    @Id
    @Column(name = "arvores_id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "area_id")
    private AreaArborizada area;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "especie_id")
    private EspecieArvore especie;

    @Column(length = 120)
    private String nome;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_arvore", nullable = false, length = 60)
    private TipoArvore tipoArvore;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PorteArvore porte;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private OrigemArvore origem;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private StatusArvore status;

    @Column(nullable = false)
    private boolean georreferenciada;

    private Double latitude;
    private Double longitude;

    @Column(name = "data_plantio")
    private LocalDate dataPlantio;

    @Column(name = "numero_processo", length = 80)
    private String numeroProcesso;

    @Column(columnDefinition = "TEXT")
    private String descricao;

    @Column(name = "foto_url", length = 500)
    private String fotoUrl;

    @OneToMany(mappedBy = "arvore", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ArvoreFoto> fotos = new ArrayList<>();

    @Column(name = "criado_em", nullable = false)
    private LocalDateTime criadoEm;

    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm;

    public Arvore() {
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

    public AreaArborizada getArea() {
        return area;
    }

    public void setArea(AreaArborizada area) {
        this.area = area;
    }

    public EspecieArvore getEspecie() {
        return especie;
    }

    public void setEspecie(EspecieArvore especie) {
        this.especie = especie;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public TipoArvore getTipoArvore() {
        return tipoArvore;
    }

    public void setTipoArvore(TipoArvore tipoArvore) {
        this.tipoArvore = tipoArvore;
    }

    public PorteArvore getPorte() {
        return porte;
    }

    public void setPorte(PorteArvore porte) {
        this.porte = porte;
    }

    public OrigemArvore getOrigem() {
        return origem;
    }

    public void setOrigem(OrigemArvore origem) {
        this.origem = origem;
    }

    public StatusArvore getStatus() {
        return status;
    }

    public void setStatus(StatusArvore status) {
        this.status = status;
    }

    public boolean isGeorreferenciada() {
        return georreferenciada;
    }

    public void setGeorreferenciada(boolean georreferenciada) {
        this.georreferenciada = georreferenciada;
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

    public LocalDate getDataPlantio() {
        return dataPlantio;
    }

    public void setDataPlantio(LocalDate dataPlantio) {
        this.dataPlantio = dataPlantio;
    }

    public String getNumeroProcesso() {
        return numeroProcesso;
    }

    public void setNumeroProcesso(String numeroProcesso) {
        this.numeroProcesso = numeroProcesso;
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

    public List<ArvoreFoto> getFotos() {
        return fotos;
    }

    public void setFotos(List<ArvoreFoto> fotos) {
        this.fotos = fotos;
    }

    public LocalDateTime getCriadoEm() {
        return criadoEm;
    }

    public LocalDateTime getAtualizadoEm() {
        return atualizadoEm;
    }
}