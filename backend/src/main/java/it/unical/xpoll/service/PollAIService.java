package it.unical.xpoll.service;

import it.unical.xpoll.service.ai.factory.AIResponseFactory;
import it.unical.xpoll.service.ai.factory.AIResponseFactory.PollData;
import it.unical.xpoll.service.ai.factory.AIResponseFactory.OptionData;
import it.unical.xpoll.service.ai.strategy.PollGenerationStrategy;
import it.unical.xpoll.service.ai.strategy.AnswerGenerationStrategy;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class PollAIService {

    private final GeminiApiService geminiApiService;
    private final AIResponseFactory responseFactory;
    private final PollGenerationStrategy pollStrategy;
    private final AnswerGenerationStrategy answerStrategy;

    public PollAIService(GeminiApiService geminiApiService, AIResponseFactory responseFactory,
            PollGenerationStrategy pollStrategy, AnswerGenerationStrategy answerStrategy) {
        this.geminiApiService = geminiApiService;
        this.responseFactory = responseFactory;
        this.pollStrategy = pollStrategy;
        this.answerStrategy = answerStrategy;
    }

    public PollData generatePollFromPrompt(String userPrompt) {
        String sessionId = UUID.randomUUID().toString();

        try {
            String prompt = pollStrategy.buildPrompt(userPrompt);
            String aiResponse = geminiApiService.generatePollFromPrompt(sessionId, prompt, pollStrategy);

            if (aiResponse == null || aiResponse.isEmpty())
                return null;

            PollData pollData = responseFactory.createPollFromJson(aiResponse);

            if (pollData == null)
                throw new IllegalStateException("Failed to generate valid poll from AI response");

            if (pollData.questions() == null || pollData.questions().isEmpty())
                throw new IllegalStateException("Poll must have at least 1 question");

            for (var question : pollData.questions()) {
                if (question.options() == null || question.options().size() < 2)
                    throw new IllegalStateException("Each question must have at least 2 options");
            }

            return pollData;

        } catch (Exception e) {
            System.err.println("Error generating poll: " + e.getMessage());
            return null;
        }
    }

    public List<OptionData> generateAnswersForQuestion(String questionText, int numAnswers) {
        String sessionId = UUID.randomUUID().toString();

        try {
            String prompt = answerStrategy.buildPrompt(questionText);
            String aiResponse = geminiApiService.generateAnswersForQuestion(sessionId, prompt, numAnswers,
                    answerStrategy);

            if (aiResponse == null || aiResponse.isEmpty())
                return null;

            List<OptionData> options = responseFactory.createAnswersFromJson(aiResponse);

            if (options == null || options.size() < 2)
                throw new IllegalStateException("Must generate at least 2 answer options");

            return options;
        } catch (Exception e) {
            System.err.println("Error generating answers: " + e.getMessage());
            return null;
        }
    }

}
