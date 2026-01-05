package it.unical.xpoll.controller;

import it.unical.xpoll.domain.Poll;
import it.unical.xpoll.service.PollService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/polls")
@RequiredArgsConstructor
public class PollController {
    private final PollService pollService;

    @PostMapping
    public ResponseEntity<?> createPoll(@RequestBody Map<String, Object> body) {
        try {
            String creatorId = String.valueOf(body.get("creatorId"));
            String title = (String) body.get("title");
            String description = (String) body.get("description");
            Integer timeLimit = body.get("timeLimit") != null ? ((Number) body.get("timeLimit")).intValue() : null;
            Boolean hasScore = (Boolean) body.getOrDefault("hasScore", false);
            Boolean isAnonymous = (Boolean) body.getOrDefault("isAnonymous", false);
            Boolean showResults = (Boolean) body.getOrDefault("showResults", true);
            java.util.List<Map<String, Object>> questions = (java.util.List<Map<String, Object>>) body.get("questions");
            Poll poll = pollService.createPoll(creatorId, title, description, timeLimit, hasScore, isAnonymous,
                    showResults, questions);
            return ResponseEntity.ok(poll);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updatePoll(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            String title = (String) body.getOrDefault("title", "Untitled");
            Integer timeLimit = body.get("timeLimit") != null ? ((Number) body.get("timeLimit")).intValue() : null;
            Poll updated = pollService.updatePoll(id, title, timeLimit);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePoll(@PathVariable Long id) {
        try {
            pollService.deletePoll(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
