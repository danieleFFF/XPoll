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
            String creatorId = (String) body.get("creatorId");
            String title = (String) body.get("title");
            Integer timeLimit = (Integer) body.get("timeLimit");
            java.util.List<Map<String, Object>> questions = (java.util.List<Map<String, Object>>) body.get("questions");

            Poll poll = pollService.createPoll(creatorId, title, timeLimit, questions);
            return ResponseEntity.ok(poll);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updatePoll(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            String title = (String) body.getOrDefault("title", "Untitled");
            Integer timeLimit = (Integer) body.get("timeLimit");
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

    //Gets all polls created by the current user.
    @GetMapping("/my-polls")
    public ResponseEntity<List<Poll>> getMyPolls() {
        return userService.getCurrentUser()
                .map(user -> ResponseEntity.ok(pollService.getMyPolls(String.valueOf(user.getId()))))
                .orElse(ResponseEntity.notFound().build());
    }
}
