package br.com.amasvisa.arborizacao.config;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;

/**
 * Controle de tentativas de login em memória.
 *
 * Após MAX_FALHAS falhas de autenticação para o mesmo par IP + e-mail,
 * o acesso ao endpoint de login é bloqueado por BLOQUEIO_MINUTOS.
 * Um login bem-sucedido zera o contador.
 */
@Service
public class LoginAttemptService {

    private static final int MAX_FALHAS = 5;
    private static final Duration BLOQUEIO = Duration.ofMinutes(15);

    private final ConcurrentHashMap<String, Registro> tentativas = new ConcurrentHashMap<>();

    private static final class Registro {
        int falhas;
        Instant ultimaFalha;
        Instant bloqueadoAte;
    }

    public static String chave(String ip, String email) {
        return ip + "|" + (email == null ? "" : email.trim().toLowerCase());
    }

    public boolean bloqueado(String chave) {
        Registro r = tentativas.get(chave);
        if (r == null) {
            return false;
        }
        synchronized (r) {
            if (r.bloqueadoAte != null && Instant.now().isAfter(r.bloqueadoAte)) {
                // Bloqueio expirou: recomeça do zero.
                r.falhas = 0;
                r.bloqueadoAte = null;
            }
            return r.bloqueadoAte != null;
        }
    }

    /** Minutos restantes de bloqueio (arredondados para cima), 0 se não bloqueado. */
    public long minutosRestantes(String chave) {
        Registro r = tentativas.get(chave);
        if (r == null || r.bloqueadoAte == null) {
            return 0;
        }
        synchronized (r) {
            if (r.bloqueadoAte == null) {
                return 0;
            }
            Duration restante = Duration.between(Instant.now(), r.bloqueadoAte);
            if (restante.isNegative() || restante.isZero()) {
                return 0;
            }
            return Math.max(1, restante.toMinutes() + (restante.toSeconds() % 60 > 0 ? 1 : 0));
        }
    }

    public void registraFalha(String chave) {
        Registro r = tentativas.computeIfAbsent(chave, k -> new Registro());
        synchronized (r) {
            if (r.bloqueadoAte != null && Instant.now().isAfter(r.bloqueadoAte)) {
                r.falhas = 0;
                r.bloqueadoAte = null;
            }
            r.falhas++;
            r.ultimaFalha = Instant.now();
            if (r.falhas >= MAX_FALHAS) {
                r.bloqueadoAte = Instant.now().plus(BLOQUEIO);
            }
        }
        limparExpirados();
    }

    public void limpa(String chave) {
        tentativas.remove(chave);
    }

    /** Remove registros vencidos para a tabela não crescer sem limite. */
    private void limparExpirados() {
        if (tentativas.size() < 10_000) {
            return;
        }
        Instant agora = Instant.now();
        tentativas.entrySet().removeIf(e -> {
            Registro r = e.getValue();
            synchronized (r) {
                if (r.ultimaFalha == null) {
                    return true;
                }
                boolean bloqueioAtivo = r.bloqueadoAte != null && agora.isBefore(r.bloqueadoAte);
                return !bloqueioAtivo && agora.isAfter(r.ultimaFalha.plus(BLOQUEIO).plus(BLOQUEIO));
            }
        });
    }
}
