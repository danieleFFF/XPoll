package it.unical.xpoll.controller;

import it.unical.xpoll.domain.Poll;
import it.unical.xpoll.service.PollService;
import it.unical.xpoll.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/polls")
@RequiredArgsConstructor
public class PollController {
    private final PollService pollService;
    private final UserService userService;

    @PostMapping
    public ResponseEntity<?> createPoll(@RequestBody Map<String, Object> body) {
        try {
            // Priority: Authenticated User ID > Body creatorId (fallback)
            String creatorId = userService.getCurrentUser().map(u -> String.valueOf(u.getId()))
                    .orElse(body.get("creatorId") != null ? String.valueOf(body.get("creatorId")) : null);
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
            String title = (String) body.get("title");
            String description = (String) body.get("description");
            Integer timeLimit = body.get("timeLimit") != null ? ((Number) body.get("timeLimit")).intValue() : null;
            Boolean hasScore = (Boolean) body.get("hasScore");
            Boolean isAnonymous = (Boolean) body.get("isAnonymous");
            Boolean showResults = (Boolean) body.get("showResults");
            java.util.List<Map<String, Object>> questions = (java.util.List<Map<String, Object>>) body.get("questions");
            Poll updated = pollService.updatePoll(id, title, description, timeLimit, hasScore, isAnonymous, showResults,
                    questions);
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

    @GetMapping("/{id}")
    public ResponseEntity<?> getPollById(@PathVariable Long id) {
        try {
            return pollService.getPollById(id)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Gets all polls created by the current user.
    @GetMapping("/my-polls")
    public ResponseEntity<List<Poll>> getMyPolls() {
        return userService.getCurrentUser()
                .map(user -> ResponseEntity.ok(pollService.getMyPolls(String.valueOf(user.getId()))))
                .orElse(ResponseEntity.notFound().build());
    }
}
