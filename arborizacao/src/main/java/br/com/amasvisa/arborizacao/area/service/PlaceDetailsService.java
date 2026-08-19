package br.com.amasvisa.arborizacao.area.service;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import br.com.amasvisa.arborizacao.area.models.PlaceDetailsResponse;

@Service
public class PlaceDetailsService {

    private static final String NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";
    private static final String WIKIDATA_URL = "https://www.wikidata.org/wiki/Special:EntityData/%s.json";

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public PlaceDetailsService() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public PlaceDetailsResponse reverse(double latitude, double longitude) {
        JsonNode nominatim = fetchJson(buildNominatimUri(latitude, longitude));
        JsonNode addressNode = nominatim.path("address");
        JsonNode extratags = nominatim.path("extratags");

        String displayName = textOrDefault(nominatim, "display_name", "Local sem nome");
        String title = textOrDefault(nominatim, "name", displayName);
        String category = textOrDefault(nominatim, "category", null);
        String type = textOrDefault(nominatim, "type", null);
        Map<String, String> address = extractAddress(addressNode);

        String wikidataId = textOrDefault(extratags, "wikidata", null);
        String wikipedia = textOrDefault(extratags, "wikipedia", null);
        String photoUrl = null;
        String photoCredit = null;
        List<String> galleryUrls = new ArrayList<>();
        String wikiUrl = wikipedia != null ? wikipediaToUrl(wikipedia) : null;

        if (wikidataId != null && !wikidataId.isBlank()) {
            JsonNode entity = fetchJson(URI.create(String.format(WIKIDATA_URL, encodePathSegment(wikidataId)))).path("entities").path(wikidataId);
            if (!entity.isMissingNode()) {
                JsonNode p18 = entity.path("claims").path("P18");
                if (p18.isArray() && !p18.isEmpty()) {
                    String imageFile = p18.path(0).path("mainsnak").path("datavalue").path("value").asText(null);
                    if (imageFile != null && !imageFile.isBlank()) {
                        photoUrl = "https://commons.wikimedia.org/wiki/Special:FilePath/" + encodePathSegment(imageFile) + "?width=1200";
                        photoCredit = "Wikimedia Commons";
                        galleryUrls.add(photoUrl);
                    }
                }

                addGalleryImage(galleryUrls, entity, "P373");
                addGalleryImage(galleryUrls, entity, "P5775");

                if (wikiUrl == null) {
                    wikiUrl = wikiLinkFromEntity(entity);
                }
            }
        }

        if (wikiUrl != null && wikiUrl.contains("wikipedia.org/wiki/")) {
            addWikipediaSummaryImage(galleryUrls, wikiUrl);
        }

        if (galleryUrls.isEmpty()) {
            galleryUrls.add(createFallbackImage("Sem fotos públicas"));
            galleryUrls.add(createFallbackImage("Abrir área arborizada"));
            galleryUrls.add(createFallbackImage("Visualização 3D"));
        }

        if (wikiUrl == null) {
            wikiUrl = "https://www.openstreetmap.org/?mlat=" + latitude + "&mlon=" + longitude + "#map=18/" + latitude + "/" + longitude;
        }

        return new PlaceDetailsResponse(
                title,
                displayName,
                category,
                type,
                latitude,
                longitude,
                address,
                photoUrl,
                photoCredit,
                dedupeGallery(galleryUrls),
                "https://www.openstreetmap.org/?mlat=" + latitude + "&mlon=" + longitude + "#map=18/" + latitude + "/" + longitude,
                wikiUrl
        );
    }

    private List<String> dedupeGallery(List<String> galleryUrls) {
        Set<String> unique = new LinkedHashSet<>(galleryUrls);
        return new ArrayList<>(unique);
    }

    private void addWikipediaSummaryImage(List<String> galleryUrls, String wikiUrl) {
        try {
            String page = wikiUrl.substring(wikiUrl.indexOf("/wiki/") + 6);
            int hostStart = wikiUrl.indexOf("//") + 2;
            int hostEnd = wikiUrl.indexOf('/', hostStart);
            String host = wikiUrl.substring(hostStart, hostEnd);
            String language = host.substring(0, host.indexOf('.'));
            URI summaryUri = URI.create("https://" + language + ".wikipedia.org/api/rest_v1/page/summary/" + encodePathSegment(page));
            JsonNode summary = fetchJson(summaryUri);
            String thumbnail = summary.path("thumbnail").path("source").asText(null);
            if (thumbnail != null && !thumbnail.isBlank() && !galleryUrls.contains(thumbnail)) {
                galleryUrls.add(thumbnail);
            }
            String original = summary.path("originalimage").path("source").asText(null);
            if (original != null && !original.isBlank() && !galleryUrls.contains(original)) {
                galleryUrls.add(original);
            }
        } catch (Exception ignored) {
            // Summary images are optional.
        }
    }

    private String createFallbackImage(String title) {
        String encoded = URLEncoder.encode(title, StandardCharsets.UTF_8).replace("+", "%20");
        return "data:image/svg+xml;charset=UTF-8," +
                encodedFallbackSvg(title, encoded);
    }

    private String encodedFallbackSvg(String title, String encodedTitle) {
        String svg = "<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='800' viewBox='0 0 1200 800'>" +
                "<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='%231b4d34'/><stop offset='100%' stop-color='%23070d09'/></linearGradient></defs>" +
                "<rect width='1200' height='800' fill='url(%23g)'/>" +
                "<circle cx='930' cy='180' r='120' fill='%2369c18f' fill-opacity='0.16'/>" +
                "<path d='M170 650 C290 500, 330 420, 360 280 C400 420, 450 500, 560 650 Z' fill='%2349a970' fill-opacity='0.42'/>" +
                "<path d='M620 670 C720 520, 760 430, 800 280 C860 430, 920 520, 1010 670 Z' fill='%2369c18f' fill-opacity='0.34'/>" +
                "<text x='70' y='110' fill='%23e7f5ee' font-family='Inter, Arial, sans-serif' font-size='44' font-weight='700'>" + title + "</text>" +
                "<text x='70' y='165' fill='%2394b2a4' font-family='Inter, Arial, sans-serif' font-size='24'>Sem fotos públicas disponíveis para este local.</text>" +
                "<text x='70' y='740' fill='%2394b2a4' font-family='Inter, Arial, sans-serif' font-size='18'>Arborização • " + encodedTitle + "</text>" +
                "</svg>";
        return URLEncoder.encode(svg, StandardCharsets.UTF_8).replace("+", "%20");
    }

    private void addGalleryImage(List<String> galleryUrls, JsonNode entity, String property) {
        JsonNode claims = entity.path("claims").path(property);
        if (!claims.isArray() || claims.isEmpty()) {
            return;
        }

        String value = claims.path(0).path("mainsnak").path("datavalue").path("value").asText(null);
        if (value == null || value.isBlank()) {
            return;
        }

        String imageUrl = "https://commons.wikimedia.org/wiki/Special:FilePath/" + encodePathSegment(value) + "?width=1200";
        if (!galleryUrls.contains(imageUrl)) {
            galleryUrls.add(imageUrl);
        }
    }

    private JsonNode fetchJson(URI uri) {
        HttpRequest request = HttpRequest.newBuilder(uri)
                .timeout(Duration.ofSeconds(15))
                .header("Accept", "application/json")
                .header("User-Agent", "ArborizacaoApp/1.0 (local development)")
                .GET()
                .build();

        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 400) {
                throw new IllegalStateException("Falha ao consultar " + uri + ": HTTP " + response.statusCode());
            }
            return objectMapper.readTree(response.body());
        } catch (IOException exception) {
            throw new UncheckedIOException(exception);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Consulta interrompida para " + uri, exception);
        }
    }

    private URI buildNominatimUri(double latitude, double longitude) {
        return URI.create(String.format(
                "%s?format=jsonv2&lat=%s&lon=%s&zoom=18&addressdetails=1&extratags=1&namedetails=1",
                NOMINATIM_URL,
                latitude,
                longitude
        ));
    }

    private Map<String, String> extractAddress(JsonNode addressNode) {
        Map<String, String> address = new LinkedHashMap<>();
        putIfPresent(address, "road", textOrDefault(addressNode, "road", null));
        putIfPresent(address, "suburb", textOrDefault(addressNode, "suburb", null));
        putIfPresent(address, "city", textOrDefault(addressNode, "city", null));
        putIfPresent(address, "town", textOrDefault(addressNode, "town", null));
        putIfPresent(address, "state", textOrDefault(addressNode, "state", null));
        putIfPresent(address, "postcode", textOrDefault(addressNode, "postcode", null));
        return address;
    }

    private void putIfPresent(Map<String, String> address, String key, String value) {
        if (value != null && !value.isBlank()) {
            address.put(key, value);
        }
    }

    private String textOrDefault(JsonNode node, String field, String fallback) {
        if (node == null || node.isMissingNode()) {
            return fallback;
        }
        String value = node.path(field).asText(null);
        return value == null || value.isBlank() ? fallback : value;
    }

    private String wikipediaToUrl(String wikipedia) {
        int separator = wikipedia.indexOf(':');
        if (separator <= 0 || separator >= wikipedia.length() - 1) {
            return null;
        }

        String language = wikipedia.substring(0, separator);
        String title = wikipedia.substring(separator + 1).replace(' ', '_');
        return "https://" + language + ".wikipedia.org/wiki/" + encodePathSegment(title);
    }

    private String wikiLinkFromEntity(JsonNode entity) {
        JsonNode sitelinks = entity.path("sitelinks");
        JsonNode ptWiki = sitelinks.path("ptwiki");
        if (!ptWiki.isMissingNode()) {
            String title = ptWiki.path("title").asText(null);
            if (title != null && !title.isBlank()) {
                return "https://pt.wikipedia.org/wiki/" + encodePathSegment(title.replace(' ', '_'));
            }
        }

        JsonNode enWiki = sitelinks.path("enwiki");
        if (!enWiki.isMissingNode()) {
            String title = enWiki.path("title").asText(null);
            if (title != null && !title.isBlank()) {
                return "https://en.wikipedia.org/wiki/" + encodePathSegment(title.replace(' ', '_'));
            }
        }

        String id = entity.path("id").asText(null);
        return id == null ? null : "https://www.wikidata.org/wiki/" + encodePathSegment(id);
    }

    private String encodePathSegment(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8).replace("+", "%20");
    }
}