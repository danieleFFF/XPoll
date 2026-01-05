package it.unical.xpoll.config;

import com.google.genai.Client;
import org.springframework.beans.factory.annotation.Value;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration

public class GeminiConfig {

    @Value("${gemini.api.key}")
    private String apiKey;

    @Bean
    public Client geminiClient() {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            throw new IllegalStateException("Gemini API key not configured. Set GEMINI_API_KEY environment variable.");
        }
        return new Client.Builder().apiKey(apiKey).build();
    }

}
