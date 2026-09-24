package br.com.amasvisa.arborizacao.area.service;

import java.util.List;

import br.com.amasvisa.arborizacao.area.models.PontoGeografico;

public final class PoligonoUtils {

    private PoligonoUtils() {
    }

    /**
     * Ray casting — devolve true se o ponto (lat, lng) está dentro do
     * polígono definido pela lista ordenada de vértices (>= 3).
     */
    public static boolean pontoDentroDoPoligono(Double lat, Double lng, List<PontoGeografico> pontos) {
        if (lat == null || lng == null || pontos == null || pontos.size() < 3) {
            return false;
        }

        boolean dentro = false;
        int n = pontos.size();
        for (int i = 0, j = n - 1; i < n; j = i++) {
            PontoGeografico pi = pontos.get(i);
            PontoGeografico pj = pontos.get(j);
            if (pi.getLatitude() == null || pi.getLongitude() == null
                    || pj.getLatitude() == null || pj.getLongitude() == null) {
                continue;
            }
            double yi = pi.getLatitude();
            double xi = pi.getLongitude();
            double yj = pj.getLatitude();
            double xj = pj.getLongitude();

            boolean cruza = ((yi > lat) != (yj > lat))
                    && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
            if (cruza) {
                dentro = !dentro;
            }
        }
        return dentro;
    }
}
