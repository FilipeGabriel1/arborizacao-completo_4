package br.com.amasvisa.arborizacao.arvore.models;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record ArvoreResponse(
        Long id,
        Long areaId,
        String areaNome,
        Long especieId,
        String especieNomePopular,
        String nome,
        TipoArvore tipoArvore,
        PorteArvore porte,
        OrigemArvore origem,
        StatusArvore status,
        boolean georreferenciada,
        Double latitude,
        Double longitude,
        LocalDate dataPlantio,
        String numeroProcesso,
        String descricao,
        String fotoUrl,
        List<ArvoreFotoResponse> fotos,
        // Dados dendrométricos
        Double cap,
        Double dap,
        Double alturaTotal,
        Double alturaPrimeiraBifurcacao,
        Double diametroCopa,
        // Condição fitossanitária
        CondicaoFitossanitaria condicaoFitossanitaria,
        String pragas,
        String doencas,
        String cavidades,
        String fungos,
        String galhosSecos,
        String inclinacao,
        String danosTronco,
        String raizesExpostas,
        String sinaisApodrecimento,
        // Conflitos
        TipoConflito tipoConflito,
        // Manejo
        TipoManejo tipoManejo,
        PrioridadeManejo prioridadeManejo,
        String responsavelCadastro,
        LocalDateTime criadoEm,
        LocalDateTime atualizadoEm
) {
}