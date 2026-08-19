package br.com.amasvisa.arborizacao.area.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import br.com.amasvisa.arborizacao.area.models.PlaceDetailsResponse;
import br.com.amasvisa.arborizacao.area.service.PlaceDetailsService;

@RestController
@RequestMapping("/api/places")
public class PlaceDetailsController {

    private final PlaceDetailsService placeDetailsService;

    public PlaceDetailsController(PlaceDetailsService placeDetailsService) {
        this.placeDetailsService = placeDetailsService;
    }

    @GetMapping("/reverse")
    public PlaceDetailsResponse reverse(@RequestParam double lat, @RequestParam double lon) {
        return placeDetailsService.reverse(lat, lon);
    }
}