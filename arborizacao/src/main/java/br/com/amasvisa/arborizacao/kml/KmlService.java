package br.com.amasvisa.arborizacao.kml;

import java.io.ByteArrayInputStream;
import java.io.StringWriter;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.transform.OutputKeys;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;

import org.springframework.stereotype.Service;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;

import br.com.amasvisa.arborizacao.area.models.AreaArborizada;
import br.com.amasvisa.arborizacao.area.repository.AreaArborizadaRepository;
import br.com.amasvisa.arborizacao.area.service.PoligonoUtils;
import br.com.amasvisa.arborizacao.arvore.models.Arvore;
import br.com.amasvisa.arborizacao.arvore.models.ArvoreRequest;
import br.com.amasvisa.arborizacao.arvore.models.EspecieArvore;
import br.com.amasvisa.arborizacao.arvore.models.TipoArvore;
import br.com.amasvisa.arborizacao.arvore.models.PorteArvore;
import br.com.amasvisa.arborizacao.arvore.models.OrigemArvore;
import br.com.amasvisa.arborizacao.arvore.models.StatusArvore;
import br.com.amasvisa.arborizacao.arvore.repository.ArvoreRepository;
import br.com.amasvisa.arborizacao.arvore.repository.EspecieArvoreRepository;
import br.com.amasvisa.arborizacao.area.models.PontoGeografico;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class KmlService {

    private final ArvoreRepository arvoreRepository;
    private final AreaArborizadaRepository areaRepository;
    private final EspecieArvoreRepository especieRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public KmlService(ArvoreRepository arvoreRepository,
                      AreaArborizadaRepository areaRepository,
                      EspecieArvoreRepository especieRepository) {
        this.arvoreRepository = arvoreRepository;
        this.areaRepository = areaRepository;
        this.especieRepository = especieRepository;
    }

    public String exportarArvores() {
        List<Arvore> arvores = arvoreRepository.findAll();
        return gerarKmlArvores(arvores, "Árvores - Arborização");
    }

    public String exportarAreas() {
        List<AreaArborizada> areas = areaRepository.findAll();
        return gerarKmlAreas(areas, "Áreas Arborizadas");
    }

    public String exportarTudo() {
        List<AreaArborizada> areas = areaRepository.findAll();
        List<Arvore> arvores = arvoreRepository.findAll();
        return gerarKmlCompleto(areas, arvores);
    }

    private String gerarKmlArvores(List<Arvore> arvores, String docName) {
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            DocumentBuilder builder = factory.newDocumentBuilder();
            Document doc = builder.newDocument();

            Element kml = doc.createElementNS("http://www.opengis.net/kml/2.2", "kml");
            doc.appendChild(kml);

            Element document = doc.createElement("Document");
            kml.appendChild(document);

            appendTextElement(doc, document, "name", docName);

            Element folder = doc.createElement("Folder");
            document.appendChild(folder);
            appendTextElement(doc, folder, "name", "Árvores");

            for (Arvore a : arvores) {
                if (a.getLatitude() == null || a.getLongitude() == null) continue;
                if (!a.isGeorreferenciada()) continue;

                Element pm = doc.createElement("Placemark");
                folder.appendChild(pm);

                String nome = a.getNome() != null ? a.getNome() : "Árvore #" + a.getId();
                appendTextElement(doc, pm, "name", nome);

                StringBuilder desc = new StringBuilder();
                desc.append("ID: ARB-").append(String.format("%06d", a.getId())).append("\n");
                if (a.getEspecie() != null) desc.append("Espécie: ").append(a.getEspecie().getNomePopular()).append("\n");
                desc.append("Tipo: ").append(a.getTipoArvore()).append("\n");
                desc.append("Porte: ").append(a.getPorte()).append("\n");
                desc.append("Status: ").append(a.getStatus()).append("\n");
                if (a.getDataPlantio() != null) desc.append("Plantio: ").append(a.getDataPlantio()).append("\n");
                if (a.getArea() != null) desc.append("Área: ").append(a.getArea().getNome()).append("\n");
                appendTextElement(doc, pm, "description", desc.toString());

                Element point = doc.createElement("Point");
                pm.appendChild(point);
                appendTextElement(doc, point, "coordinates",
                        a.getLongitude() + "," + a.getLatitude() + ",0");
            }

            return documentToString(doc);
        } catch (Exception e) {
            throw new RuntimeException("Erro ao gerar KML de árvores", e);
        }
    }

    private String gerarKmlAreas(List<AreaArborizada> areas, String docName) {
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            DocumentBuilder builder = factory.newDocumentBuilder();
            Document doc = builder.newDocument();

            Element kml = doc.createElementNS("http://www.opengis.net/kml/2.2", "kml");
            doc.appendChild(kml);

            Element document = doc.createElement("Document");
            kml.appendChild(document);

            appendTextElement(doc, document, "name", docName);

            for (AreaArborizada area : areas) {
                List<PontoGeografico> pontos = area.getPontos();
                if (pontos == null || pontos.size() < 3) {
                    if (area.getLatitude() != null && area.getLongitude() != null) {
                        Element pm = doc.createElement("Placemark");
                        document.appendChild(pm);
                        appendTextElement(doc, pm, "name", area.getNome());
                        StringBuilder desc = new StringBuilder();
                        desc.append("Tipo: ").append(area.getTipo()).append("\n");
                        desc.append("Status: ").append(area.getStatus() != null ? area.getStatus() : "—").append("\n");
                        desc.append("Bairro: ").append(area.getBairro() != null ? area.getBairro() : "—").append("\n");
                        appendTextElement(doc, pm, "description", desc.toString());
                        Element point = doc.createElement("Point");
                        pm.appendChild(point);
                        appendTextElement(doc, point, "coordinates",
                                area.getLongitude() + "," + area.getLatitude() + ",0");
                    }
                    continue;
                }

                Element pm = doc.createElement("Placemark");
                document.appendChild(pm);
                appendTextElement(doc, pm, "name", area.getNome());

                StringBuilder desc = new StringBuilder();
                desc.append("Tipo: ").append(area.getTipo()).append("\n");
                desc.append("Status: ").append(area.getStatus() != null ? area.getStatus() : "—").append("\n");
                desc.append("Bairro: ").append(area.getBairro() != null ? area.getBairro() : "—").append("\n");
                desc.append("Logradouro: ").append(area.getLogradouro() != null ? area.getLogradouro() : "—").append("\n");
                appendTextElement(doc, pm, "description", desc.toString());

                Element polygon = doc.createElement("Polygon");
                pm.appendChild(polygon);
                appendTextElement(doc, polygon, "tessellate", "1");

                Element outer = doc.createElement("outerBoundaryIs");
                polygon.appendChild(outer);
                Element ring = doc.createElement("LinearRing");
                outer.appendChild(ring);

                StringBuilder coords = new StringBuilder();
                for (PontoGeografico p : pontos) {
                    coords.append(p.getLongitude()).append(",").append(p.getLatitude()).append(",0\n");
                }
                if (!pontos.isEmpty()) {
                    PontoGeografico first = pontos.get(0);
                    coords.append(first.getLongitude()).append(",").append(first.getLatitude()).append(",0");
                }
                appendTextElement(doc, ring, "coordinates", coords.toString());
            }

            return documentToString(doc);
        } catch (Exception e) {
            throw new RuntimeException("Erro ao gerar KML de áreas", e);
        }
    }

    private String gerarKmlCompleto(List<AreaArborizada> areas, List<Arvore> arvores) {
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            DocumentBuilder builder = factory.newDocumentBuilder();
            Document doc = builder.newDocument();

            Element kml = doc.createElementNS("http://www.opengis.net/kml/2.2", "kml");
            doc.appendChild(kml);

            Element document = doc.createElement("Document");
            kml.appendChild(document);
            appendTextElement(doc, document, "name", "Arborização Completa");

            // Folder de áreas
            Element folderAreas = doc.createElement("Folder");
            document.appendChild(folderAreas);
            appendTextElement(doc, folderAreas, "name", "Áreas Arborizadas");

            for (AreaArborizada area : areas) {
                List<PontoGeografico> pontos = area.getPontos();
                Element pm = doc.createElement("Placemark");
                folderAreas.appendChild(pm);
                appendTextElement(doc, pm, "name", area.getNome());

                StringBuilder desc = new StringBuilder();
                desc.append("Tipo: ").append(area.getTipo()).append("\n");
                desc.append("Status: ").append(area.getStatus() != null ? area.getStatus() : "—").append("\n");
                desc.append("Bairro: ").append(area.getBairro() != null ? area.getBairro() : "—").append("\n");
                appendTextElement(doc, pm, "description", desc.toString());

                if (pontos != null && pontos.size() >= 3) {
                    Element polygon = doc.createElement("Polygon");
                    pm.appendChild(polygon);
                    appendTextElement(doc, polygon, "tessellate", "1");
                    Element outer = doc.createElement("outerBoundaryIs");
                    polygon.appendChild(outer);
                    Element ring = doc.createElement("LinearRing");
                    outer.appendChild(ring);
                    StringBuilder coords = new StringBuilder();
                    for (PontoGeografico p : pontos) {
                        coords.append(p.getLongitude()).append(",").append(p.getLatitude()).append(",0\n");
                    }
                    PontoGeografico first = pontos.get(0);
                    coords.append(first.getLongitude()).append(",").append(first.getLatitude()).append(",0");
                    appendTextElement(doc, ring, "coordinates", coords.toString());
                } else if (area.getLatitude() != null && area.getLongitude() != null) {
                    Element point = doc.createElement("Point");
                    pm.appendChild(point);
                    appendTextElement(doc, point, "coordinates",
                            area.getLongitude() + "," + area.getLatitude() + ",0");
                }
            }

            // Folder de árvores
            Element folderArvores = doc.createElement("Folder");
            document.appendChild(folderArvores);
            appendTextElement(doc, folderArvores, "name", "Árvores");

            for (Arvore a : arvores) {
                if (a.getLatitude() == null || a.getLongitude() == null) continue;
                if (!a.isGeorreferenciada()) continue;

                Element pm = doc.createElement("Placemark");
                folderArvores.appendChild(pm);

                String nome = a.getNome() != null ? a.getNome() : "Árvore #" + a.getId();
                appendTextElement(doc, pm, "name", nome);

                StringBuilder desc = new StringBuilder();
                desc.append("ID: ARB-").append(String.format("%06d", a.getId())).append("\n");
                if (a.getEspecie() != null) desc.append("Espécie: ").append(a.getEspecie().getNomePopular()).append("\n");
                desc.append("Tipo: ").append(a.getTipoArvore()).append("\n");
                desc.append("Porte: ").append(a.getPorte()).append("\n");
                desc.append("Status: ").append(a.getStatus()).append("\n");
                if (a.getArea() != null) desc.append("Área: ").append(a.getArea().getNome()).append("\n");
                appendTextElement(doc, pm, "description", desc.toString());

                Element point = doc.createElement("Point");
                pm.appendChild(point);
                appendTextElement(doc, point, "coordinates",
                        a.getLongitude() + "," + a.getLatitude() + ",0");
            }

            return documentToString(doc);
        } catch (Exception e) {
            throw new RuntimeException("Erro ao gerar KML completo", e);
        }
    }

    public List<KmlPlacemark> parsearKml(String kmlContent) {
        List<KmlPlacemark> placemarks = new ArrayList<>();
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            factory.setNamespaceAware(true);
            DocumentBuilder builder = factory.newDocumentBuilder();
            Document doc = builder.parse(new InputSource(new ByteArrayInputStream(
                    kmlContent.getBytes(StandardCharsets.UTF_8))));

            NodeList pmNodes = doc.getElementsByTagNameNS("http://www.opengis.net/kml/2.2", "Placemark");
            if (pmNodes.getLength() == 0) {
                pmNodes = doc.getElementsByTagName("Placemark");
            }

            for (int i = 0; i < pmNodes.getLength(); i++) {
                Element pm = (Element) pmNodes.item(i);
                KmlPlacemark placemark = new KmlPlacemark();

                String name = getTagText(pm, "name");
                if (name == null) name = getTagTextNS(pm, "name");
                placemark.setNome(name != null ? name : "Placemark " + (i + 1));

                String desc = getTagText(pm, "description");
                if (desc == null) desc = getTagTextNS(pm, "description");
                placemark.setDescricao(desc);

                Element pointEl = getFirstChildElement(pm, "Point");
                if (pointEl == null) pointEl = getFirstChildElementNS(pm, "Point");

                if (pointEl != null) {
                    String coords = getTagText(pointEl, "coordinates");
                    if (coords == null) coords = getTagTextNS(pointEl, "coordinates");
                    if (coords != null) {
                        coords = coords.trim();
                        String[] parts = coords.split("[,\\s]+");
                        if (parts.length >= 2) {
                            placemark.setLongitude(Double.parseDouble(parts[0]));
                            placemark.setLatitude(Double.parseDouble(parts[1]));
                        }
                    }
                }

                if (placemark.getLatitude() != null && placemark.getLongitude() != null) {
                    placemarks.add(placemark);
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Erro ao parsear KML", e);
        }
        return placemarks;
    }

    public List<Arvore> importarArvores(String kmlContent, Long areaId) {
        return importarArvores(kmlContent, areaId, null, null);
    }

    public List<Arvore> importarArvores(String kmlContent, Long areaId, String defaultsJson) {
        return importarArvores(kmlContent, areaId, defaultsJson, null);
    }

    public List<Arvore> importarArvores(String kmlContent, Long areaId, String defaultsJson, String indicesCsv) {
        List<KmlPlacemark> placemarks = parsearKml(kmlContent);
        placemarks = filtrarPorIndices(placemarks, indicesCsv);
        JsonNode d = parseDefaults(defaultsJson);

        boolean autoArea = d != null && hasNonEmpty(d, "areaId")
                && "auto".equalsIgnoreCase(d.get("areaId").asText().trim());

        Long efetivoAreaId = areaId;
        if (d != null && hasNonEmpty(d, "areaId") && !autoArea) {
            try {
                efetivoAreaId = Long.parseLong(d.get("areaId").asText().trim());
            } catch (NumberFormatException ignored) {
            }
        }
        AreaArborizada area = efetivoAreaId != null ? areaRepository.findById(efetivoAreaId).orElse(null) : null;
        List<AreaArborizada> areasPoligono = autoArea
                ? areaRepository.findAll().stream()
                        .filter(a -> a.getPontos() != null && a.getPontos().size() >= 3)
                        .toList()
                : List.of();
        EspecieArvore especie = null;
        if (d != null && hasNonEmpty(d, "especieId")) {
            try {
                especie = especieRepository.findById(Long.parseLong(d.get("especieId").asText().trim())).orElse(null);
            } catch (NumberFormatException ignored) {
            }
        }

        List<Arvore> criadas = new ArrayList<>();
        for (KmlPlacemark pm : placemarks) {
            Arvore arvore = new Arvore();
            arvore.setNome(pm.getNome());
            arvore.setLatitude(pm.getLatitude());
            arvore.setLongitude(pm.getLongitude());
            arvore.setGeorreferenciada(true);

            arvore.setTipoArvore(enumOrDefault(d, "tipoArvore", TipoArvore.class, TipoArvore.NATIVA));
            arvore.setPorte(enumOrDefault(d, "porte", PorteArvore.class, PorteArvore.MEDIO));
            arvore.setOrigem(enumOrDefault(d, "origem", OrigemArvore.class, OrigemArvore.PLANTIO_PROPRIO));
            arvore.setStatus(enumOrDefault(d, "status", StatusArvore.class, StatusArvore.ATIVA));

            if (especie != null) arvore.setEspecie(especie);
            if (area != null) {
                arvore.setArea(area);
            } else if (autoArea) {
                AreaArborizada contida = areasPoligono.stream()
                        .filter(a -> PoligonoUtils.pontoDentroDoPoligono(
                                pm.getLatitude(), pm.getLongitude(), a.getPontos()))
                        .findFirst()
                        .orElse(null);
                if (contida != null) {
                    arvore.setArea(contida);
                }
            }

            arvore.setDataPlantio(dateOrDefault(d, "dataPlantio"));
            arvore.setNumeroProcesso(textOrDefault(d, "numeroProcesso"));
            arvore.setDescricao(textOrDefault(d, "descricao"));
            arvore.setFotoUrl(textOrDefault(d, "fotoUrl"));
            arvore.setResponsavelCadastro(textOrDefault(d, "responsavelCadastro"));

            arvore.setCap(doubleOrDefault(d, "cap"));
            arvore.setDap(doubleOrDefault(d, "dap"));
            if (arvore.getCap() != null && arvore.getDap() == null) {
                arvore.setDap(Math.round((arvore.getCap() / Math.PI) * 100.0) / 100.0);
            }
            arvore.setAlturaTotal(doubleOrDefault(d, "alturaTotal"));
            arvore.setAlturaPrimeiraBifurcacao(doubleOrDefault(d, "alturaPrimeiraBifurcacao"));
            arvore.setDiametroCopa(doubleOrDefault(d, "diametroCopa"));

            arvore.setCondicaoFitossanitaria(enumOrDefault(d, "condicaoFitossanitaria",
                    br.com.amasvisa.arborizacao.arvore.models.CondicaoFitossanitaria.class, null));
            arvore.setPragas(textOrDefault(d, "pragas"));
            arvore.setDoencas(textOrDefault(d, "doencas"));
            arvore.setCavidades(textOrDefault(d, "cavidades"));
            arvore.setFungos(textOrDefault(d, "fungos"));
            arvore.setGalhosSecos(textOrDefault(d, "galhosSecos"));
            arvore.setInclinacao(textOrDefault(d, "inclinacao"));
            arvore.setDanosTronco(textOrDefault(d, "danosTronco"));
            arvore.setRaizesExpostas(textOrDefault(d, "raizesExpostas"));
            arvore.setSinaisApodrecimento(textOrDefault(d, "sinaisApodrecimento"));

            arvore.setTipoConflito(joinConflitos(d));

            arvore.setTipoManejo(enumOrDefault(d, "tipoManejo",
                    br.com.amasvisa.arborizacao.arvore.models.TipoManejo.class,
                    br.com.amasvisa.arborizacao.arvore.models.TipoManejo.NENHUM));
            arvore.setPrioridadeManejo(enumOrDefault(d, "prioridadeManejo",
                    br.com.amasvisa.arborizacao.arvore.models.PrioridadeManejo.class, null));

            arvore.prepararPersistencia();
            criadas.add(arvoreRepository.save(arvore));
        }

        return criadas;
    }

    private List<KmlPlacemark> filtrarPorIndices(List<KmlPlacemark> placemarks, String indicesCsv) {
        if (indicesCsv == null || indicesCsv.isBlank()) {
            return placemarks;
        }
        List<Integer> indices = new ArrayList<>();
        for (String parte : indicesCsv.split(",")) {
            try {
                indices.add(Integer.parseInt(parte.trim()));
            } catch (NumberFormatException ignored) {
            }
        }
        if (indices.isEmpty()) {
            return placemarks;
        }
        List<KmlPlacemark> filtrados = new ArrayList<>();
        for (int idx : indices) {
            if (idx >= 0 && idx < placemarks.size()) {
                filtrados.add(placemarks.get(idx));
            }
        }
        return filtrados;
    }

    private JsonNode parseDefaults(String defaultsJson) {
        if (defaultsJson == null || defaultsJson.isBlank()) return null;
        try {
            return objectMapper.readTree(defaultsJson);
        } catch (Exception e) {
            return null;
        }
    }

    private boolean hasNonEmpty(JsonNode d, String field) {
        return d != null && d.hasNonNull(field) && !d.get(field).asText().trim().isEmpty();
    }

    private String textOrDefault(JsonNode d, String field) {
        return hasNonEmpty(d, field) ? d.get(field).asText().trim() : null;
    }

    private Double doubleOrDefault(JsonNode d, String field) {
        if (d == null || !d.has(field) || d.get(field).isNull()) return null;
        try {
            return d.get(field).asDouble();
        } catch (Exception e) {
            return null;
        }
    }

    private LocalDate dateOrDefault(JsonNode d, String field) {
        String text = textOrDefault(d, field);
        if (text == null) return null;
        try {
            return LocalDate.parse(text);
        } catch (Exception e) {
            return null;
        }
    }

    private <E extends Enum<E>> E enumOrDefault(JsonNode d, String field, Class<E> type, E fallback) {
        String text = textOrDefault(d, field);
        if (text == null) return fallback;
        try {
            return Enum.valueOf(type, text);
        } catch (IllegalArgumentException e) {
            return fallback;
        }
    }

    private String joinConflitos(JsonNode d) {
        if (d == null || !d.has("tiposConflito") || !d.get("tiposConflito").isArray()) {
            return br.com.amasvisa.arborizacao.arvore.models.TipoConflito.SEM_CONFLITO.name();
        }
        List<String> valores = new ArrayList<>();
        for (JsonNode no : d.get("tiposConflito")) {
            String v = no.asText(null);
            if (v != null && !v.isBlank()) valores.add(v.trim());
        }
        return valores.isEmpty()
                ? br.com.amasvisa.arborizacao.arvore.models.TipoConflito.SEM_CONFLITO.name()
                : String.join(",", valores);
    }

    private String getTagText(Element parent, String tag) {
        NodeList nodes = parent.getElementsByTagName(tag);
        if (nodes.getLength() > 0) return nodes.item(0).getTextContent();
        return null;
    }

    private String getTagTextNS(Element parent, String tag) {
        NodeList nodes = parent.getElementsByTagNameNS("http://www.opengis.net/kml/2.2", tag);
        if (nodes.getLength() > 0) return nodes.item(0).getTextContent();
        return null;
    }

    private Element getFirstChildElement(Element parent, String tag) {
        NodeList nodes = parent.getElementsByTagName(tag);
        if (nodes.getLength() > 0 && nodes.item(0) instanceof Element) return (Element) nodes.item(0);
        return null;
    }

    private Element getFirstChildElementNS(Element parent, String tag) {
        NodeList nodes = parent.getElementsByTagNameNS("http://www.opengis.net/kml/2.2", tag);
        if (nodes.getLength() > 0 && nodes.item(0) instanceof Element) return (Element) nodes.item(0);
        return null;
    }

    private void appendTextElement(Document doc, Element parent, String tag, String value) {
        Element el = doc.createElement(tag);
        el.setTextContent(value);
        parent.appendChild(el);
    }

    private String documentToString(Document doc) throws Exception {
        TransformerFactory tf = TransformerFactory.newInstance();
        Transformer transformer = tf.newTransformer();
        transformer.setOutputProperty(OutputKeys.INDENT, "yes");
        transformer.setOutputProperty("{http://xml.apache.org/xslt}indent-amount", "2");
        StringWriter writer = new StringWriter();
        transformer.transform(new DOMSource(doc), new StreamResult(writer));
        return writer.toString();
    }
}
