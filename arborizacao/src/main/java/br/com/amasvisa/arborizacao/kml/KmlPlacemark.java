package br.com.amasvisa.arborizacao.kml;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class KmlPlacemark {
    private String nome;
    private String descricao;
    private Double latitude;
    private Double longitude;
    private String geometria = "POINT";
    private List<double[]> pontos = new ArrayList<>();
    private Map<String, String> extendedData = new LinkedHashMap<>();

    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
    public String getGeometria() { return geometria; }
    public void setGeometria(String geometria) { this.geometria = geometria; }
    public List<double[]> getPontos() { return pontos; }
    public void setPontos(List<double[]> pontos) { this.pontos = pontos; }
    public Map<String, String> getExtendedData() { return extendedData; }
    public void setExtendedData(Map<String, String> extendedData) { this.extendedData = extendedData; }
}
