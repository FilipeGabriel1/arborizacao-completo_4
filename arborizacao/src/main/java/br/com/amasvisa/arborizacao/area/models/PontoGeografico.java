package br.com.amasvisa.arborizacao.area.models;

import jakarta.persistence.Embeddable;

@Embeddable
public class PontoGeografico {

    private Double latitude;
    private Double longitude;

    public PontoGeografico() {
    }

    public PontoGeografico(Double latitude, Double longitude) {
        this.latitude = latitude;
        this.longitude = longitude;
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
}