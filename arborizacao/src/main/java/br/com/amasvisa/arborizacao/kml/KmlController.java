package br.com.amasvisa.arborizacao.kml;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import br.com.amasvisa.arborizacao.arvore.models.Arvore;

@RestController
@RequestMapping("/api/kml")
public class KmlController {

    private final KmlService kmlService;

    public KmlController(KmlService kmlService) {
        this.kmlService = kmlService;
    }

    @GetMapping("/export/arvores")
    public ResponseEntity<byte[]> exportarArvores() {
        String kml = kmlService.exportarArvores();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=arvores.kml")
                .contentType(MediaType.APPLICATION_XML)
                .body(kml.getBytes());
    }

    @GetMapping("/export/areas")
    public ResponseEntity<byte[]> exportarAreas() {
        String kml = kmlService.exportarAreas();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=areas.kml")
                .contentType(MediaType.APPLICATION_XML)
                .body(kml.getBytes());
    }

    @GetMapping("/export/tudo")
    public ResponseEntity<byte[]> exportarTudo() {
        String kml = kmlService.exportarTudo();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=arborizacao-completa.kml")
                .contentType(MediaType.APPLICATION_XML)
                .body(kml.getBytes());
    }

    @PostMapping("/import/preview")
    public ResponseEntity<List<KmlPlacemark>> preview(
            @RequestParam("file") MultipartFile file) {
        try {
            String content = new String(file.getBytes(), StandardCharsets.UTF_8);
            List<KmlPlacemark> placemarks = kmlService.parsearKml(content);
            return ResponseEntity.ok(placemarks);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/import/arvores")
    public ResponseEntity<Map<String, Object>> importarArvores(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "areaId", required = false) Long areaId,
            @RequestParam(value = "defaults", required = false) String defaults,
            @RequestParam(value = "indices", required = false) String indices) {
        try {
            String content = new String(file.getBytes(), StandardCharsets.UTF_8);
            List<Arvore> criadas = kmlService.importarArvores(content, areaId, defaults, indices);
            List<Long> ids = criadas.stream().map(Arvore::getId).toList();
            return ResponseEntity.ok(Map.of(
                    "total", criadas.size(),
                    "ids", ids,
                    "mensagem", criadas.size() + " árvore(s) importada(s) com sucesso"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "erro", e.getMessage() != null ? e.getMessage() : "Erro ao importar"
            ));
        }
    }
}
