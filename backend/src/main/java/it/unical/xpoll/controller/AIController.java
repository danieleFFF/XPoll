package it.unical.xpoll.controller;

import it.unical.xpoll.service.PollAIService;
import it.unical.xpoll.service.ai.factory.AIResponseFactory.PollData;
import it.unical.xpoll.service.ai.factory.AIResponseFactory.OptionData;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AIController {

    private final PollAIService pollAIService;

    @PostMapping("/generate-poll")
    public ResponseEntity<?> generatePoll(@RequestBody Map<String, String> body) {
        String topic = body.get("prompt");
        if (topic == null || topic.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Missing 'prompt' field"));
        }

        PollData result = pollAIService.generatePollFromPrompt(topic);

        if (result == null) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to generate poll from AI"));
        }

        return ResponseEntity.ok(Map.of(
                "title", result.title(),
                "description", result.description(),
                "questions", result.questions()));
    }

    @PostMapping("/generate-answers")
    public ResponseEntity<?> generateAnswers(@RequestBody Map<String, Object> body) {
        String question = (String) body.get("question");
        if (question == null || question.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Missing 'question' field"));
        }

        Integer numAnswers = (Integer) body.getOrDefault("numAnswers", 4);

        List<OptionData> result = pollAIService.generateAnswersForQuestion(question, numAnswers);

        if (result == null) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to generate answers from AI"));
        }

        return ResponseEntity.ok(Map.of("options", result));
    }
}
