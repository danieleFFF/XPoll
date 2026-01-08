package it.unical.xpoll.service.ai.strategy;

import org.springframework.stereotype.Component;

@Component
public class PollGenerationStrategy implements PromptStrategy {

    @Override
    public String buildPrompt(String input) {
        return String.format(
                "Create a complete poll about: %s. " +
                        "Include a title, description, and at least 1 question with at least 2 answer options. " +
                        "Make it engaging and educational. " +
                        "If it's a quiz-style question with a correct answer, mark the correct option with points=1.",
                input);
    }

    @Override
    public String getSystemInstruction() {
        return """
                You are an AI assistant specialized in creating engaging polls and quizzes.
                When asked to generate a poll, provide a JSON structure with the following format:
                {
                    "title": "Poll title",
                    "description": "Poll description",
                    "questions": [
                        {
                            "text": "Question text",
                            "options": [
                                {"text": "Option 1", "points": 0, "isCorrect": false},
                                {"text": "Option 2", "points": 1, "isCorrect": true},
                                {"text": "Option 3", "points": 0, "isCorrect": false}
                            ]
                        }
                    ]
                }

                IMPORTANT RULES:
                - For opinion polls (no right/wrong answer): set all "points" to 0 and "isCorrect" to false
                - For quiz questions (with a correct answer): set "points" to 1 and "isCorrect" to true for the correct answer
                - Always include at least 1 question with at least 2 options
                - Keep content appropriate, educational, and free from offensive language
                - Respond ONLY with valid JSON, no additional text or markdown code blocks
                """;
    }

    @Override
    public int getTimeoutSeconds() {
        return 30;
    }
}
