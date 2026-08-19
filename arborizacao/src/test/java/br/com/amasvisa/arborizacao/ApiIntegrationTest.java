package br.com.amasvisa.arborizacao;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String AREA_JSON = """
            {
              "nome": "%s",
              "descricao": "Área de teste",
              "tipo": "PRACA",
              "status": "ATIVA",
              "latitude": -23.5505,
              "longitude": -46.6333,
              "fotos": [
                { "url": "https://lh3.googleusercontent.com/d/AREA123=w2000", "descricao": "Vista geral" }
              ]
            }
            """;

    private static final String ARVORE_JSON = """
            {
              "areaId": %d,
              "nome": "Ipê Amarelo",
              "tipoArvore": "NATIVA",
              "porte": "MEDIO",
              "origem": "PLANTIO_PROPRIO",
              "status": "ATIVA",
              "georreferenciada": true,
              "latitude": -23.5505,
              "longitude": -46.6333,
              "dataPlantio": "2024-01-15",
              "fotos": [
                { "url": "https://lh3.googleusercontent.com/d/TREE123=w2000", "descricao": "Copa" }
              ]
            }
            """;

    private Long criarArea(String nome) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/areas")
                        .with(user("teste@amasvisa.com.br").roles("ADMIN"))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(AREA_JSON.formatted(nome)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andReturn();
        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        return body.get("id").asLong();
    }

    @Test
    void postEmAreaSemAutenticacaoRetorna401() throws Exception {
        mockMvc.perform(post("/api/areas")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(AREA_JSON.formatted("Área Anônima")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void postEmAreaAutenticadoSemCsrfRetorna403() throws Exception {
        mockMvc.perform(post("/api/areas")
                        .with(user("teste@amasvisa.com.br").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(AREA_JSON.formatted("Área Sem CSRF")))
                .andExpect(status().isForbidden());
    }

    @Test
    void listagemDeAreasEhPublica() throws Exception {
        mockMvc.perform(get("/api/areas"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.value").isArray());
    }

    @Test
    void criarAreaComFotosRetorna201ComFotos() throws Exception {
        mockMvc.perform(post("/api/areas")
                        .with(user("teste@amasvisa.com.br").roles("ADMIN"))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(AREA_JSON.formatted("Praça das Flores")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.nome").value("Praça das Flores"))
                .andExpect(jsonPath("$.fotos[0].url").value("https://lh3.googleusercontent.com/d/AREA123=w2000"));
    }

    @Test
    void atualizarAreaRetorna200() throws Exception {
        Long id = criarArea("Praça Antiga");

        mockMvc.perform(put("/api/areas/{id}", id)
                        .with(user("teste@amasvisa.com.br").roles("ADMIN"))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(AREA_JSON.formatted("Praça Renovada")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Praça Renovada"));
    }

    @Test
    void removerAreaRetorna204() throws Exception {
        Long id = criarArea("Praça Removível");

        mockMvc.perform(delete("/api/areas/{id}", id)
                        .with(user("teste@amasvisa.com.br").roles("ADMIN"))
                        .with(csrf()))
                .andExpect(status().isNoContent());
    }

    @Test
    void auditoriaRegistradaAposCriarArea() throws Exception {
        criarArea("Praça Auditada");

        mockMvc.perform(get("/api/auditoria")
                        .with(user("teste@amasvisa.com.br").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.value[0].entidade").value("AREA"))
                .andExpect(jsonPath("$.value[0].acao").value("CRIACAO"));
    }

    @Test
    void auditoriaSomenteParaAdmin() throws Exception {
        mockMvc.perform(get("/api/auditoria")
                        .with(user("funcionario@amasvisa.com.br").roles("USER")))
                .andExpect(status().isForbidden());
    }

    @Test
    void criarArvoreComFotosRetorna201ComFotos() throws Exception {
        Long areaId = criarArea("Praça das Árvores");

        mockMvc.perform(post("/api/arvores")
                        .with(user("teste@amasvisa.com.br").roles("ADMIN"))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(ARVORE_JSON.formatted(areaId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.areaId").value(areaId))
                .andExpect(jsonPath("$.fotos[0].url").value("https://lh3.googleusercontent.com/d/TREE123=w2000"));
    }

    @Test
    void paginacaoRetornaPaginasComMetadados() throws Exception {
        criarArea("Área Um");
        criarArea("Área Dois");
        criarArea("Área Três");

        mockMvc.perform(get("/api/areas").param("page", "0").param("size", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.value.length()").value(2))
                .andExpect(jsonPath("$.totalElements").value(3))
                .andExpect(jsonPath("$.totalPages").value(2))
                .andExpect(jsonPath("$.page").value(0));

        mockMvc.perform(get("/api/areas").param("page", "1").param("size", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.value.length()").value(1));
    }

    @Test
    void autenticacaoMeExigeLogin() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void autenticacaoMeRetornaEmailEAdmin() throws Exception {
        mockMvc.perform(get("/api/auth/me")
                        .with(user("admin@amasvisa.com.br").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("admin@amasvisa.com.br"))
                .andExpect(jsonPath("$.admin").value(true));
    }
}