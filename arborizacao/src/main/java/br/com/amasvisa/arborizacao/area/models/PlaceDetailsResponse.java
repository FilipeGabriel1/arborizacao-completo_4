package br.com.amasvisa.arborizacao.area.models;

import java.util.List;
import java.util.Map;

public record PlaceDetailsResponse(
        String title,
        String displayName,
        String category,
        String type,
        Double latitude,
        Double longitude,
        Map<String, String> address,
        String photoUrl,
        String photoCredit,
        List<String> galleryUrls,
        String sourceUrl,
        String wikiUrl
) {
}