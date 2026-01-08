package it.unical.xpoll.service;

import com.google.genai.Client;
import com.google.genai.types.*;
import it.unical.xpoll.service.ai.strategy.PromptStrategy;
import org.springframework.stereotype.Service;

@Service
public class GeminiApiService {
    private final Client client;

    public GeminiApiService(Client client) {
        this.client = client;
    }

    public String generateWithStrategy(String sessionId, String prompt, PromptStrategy strategy) {
        try {
            GenerateContentConfig config = GenerateContentConfig.builder()
                    .systemInstruction(Content.fromParts(Part.fromText(strategy.getSystemInstruction())))
                    .responseMimeType("application/json").build();

            Content userContent = Content.fromParts(Part.fromText(prompt));
            GenerateContentResponse response = client.models.generateContent("gemini-2.5-flash", userContent, config);

            return response.text();
        } catch (Exception e) {
            System.err.println("Error during AI generation: " + e.getMessage());
            return null;
        }
    }

    public String generatePollFromPrompt(String sessionId, String prompt, PromptStrategy strategy) {
        return generateWithStrategy(sessionId, prompt, strategy);
    }

    public String generateAnswersForQuestion(String sessionId, String questionText, int numAnswers,
            PromptStrategy strategy) {
        String prompt = String.format("Generate %d answer options for this question: %s", numAnswers, questionText);
        return generateWithStrategy(sessionId, prompt, strategy);
    }
}
