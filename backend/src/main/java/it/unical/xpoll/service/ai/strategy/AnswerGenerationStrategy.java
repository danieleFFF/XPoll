package it.unical.xpoll.service.ai.strategy;

import org.springframework.stereotype.Component;

@Component
public class AnswerGenerationStrategy implements PromptStrategy {

    @Override
    public String buildPrompt(String input) {
        return String.format(
                "Generate 4-5 relevant answer options for this question: %s. " +
                        "Make the options diverse, clear, and engaging. " +
                        "If it's a quiz question with a correct answer, mark the correct option with points=1.",
                input);
    }

    @Override
    public String getSystemInstruction() {
        return """
                You are an AI assistant specialized in creating poll answer options.
                When given a question, provide relevant answer options in JSON array format:
                [
                    {"text": "Option 1", "points": 0, "isCorrect": false},
                    {"text": "Option 2 (correct)", "points": 1, "isCorrect": true},
                    {"text": "Option 3", "points": 0, "isCorrect": false},
                    {"text": "Option 4", "points": 0, "isCorrect": false}
                ]

                IMPORTANT RULES:
                - For opinion questions (no right/wrong): set all "points" to 0 and "isCorrect" to false
                - For quiz questions (with correct answer): set "points" to 1 and "isCorrect" to true for correct answer
                - Provide 4-5 relevant options
                - Keep content appropriate and free from offensive language
                - Respond ONLY with valid JSON array, no additional text or markdown code blocks
                """;
    }

    @Override
    public int getTimeoutSeconds() {
        return 15;
    }
}
