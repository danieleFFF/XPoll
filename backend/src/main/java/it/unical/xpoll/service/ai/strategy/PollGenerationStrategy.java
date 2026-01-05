package it.unical.xpoll.service.ai.strategy;

import org.springframework.stereotype.Component;

@Component
public class PollGenerationStrategy implements PromptStrategy {

    @Override
    public String buildPrompt(String input) {
        return String.format(
                "Create a complete poll about: %s. " +
                        "Include a title, description, and at least 1 question with at least 2 answer options. " +
                        "Make it engaging and educational.",
                input);
    }

    @Override
    public String getSystemInstruction() {
        return """
                You are an AI assistant specialized in creating engaging polls.
                When asked to generate a poll, provide a JSON structure with the following format:
                {
                    "title": "Poll title",
                    "description": "Poll description",
                    "questions": [
                        {
                            "text": "Question text",
                            "options": [
                                {"text": "Option 1", "points": 0},
                                {"text": "Option 2", "points": 0}
                            ]
                        }
                    ]
                }
                Always include at least 1 question with at least 2 options.
                Keep content appropriate, educational, and free from offensive language.
                Respond ONLY with valid JSON, no additional text or markdown code blocks.
                """;
    }

    @Override
    public int getTimeoutSeconds() {
        return 30;
    }
}
