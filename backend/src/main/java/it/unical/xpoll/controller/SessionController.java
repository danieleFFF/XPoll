package it.unical.xpoll.controller;

import it.unical.xpoll.domain.Session;
import it.unical.xpoll.service.SessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.util.stream.Collectors;

//Rest controller for session management
@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class SessionController {
    private final SessionService sessionService;
    public record CreateSessionRequest(
            String creatorId,
            String title,
            Integer timeLimit,
            List<Map<String, Object>> questions) { }
    public record JoinRequest(String displayName) {}
    public record CreatorRequest(String creatorId) { }
    public record VoteRequest(String participantName, Map<String, Integer> answers) { }

    @PostMapping
    public ResponseEntity<?> createSession(@RequestBody CreateSessionRequest request){
        try {
            Session session = sessionService.createSession(
                    request.creatorId(),
                    request.title(),
                    request.timeLimit(),
                    request.questions());
            return ResponseEntity.ok(sessionToMap(session));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    //Gets session by code.
    @GetMapping("/{code}")
    public ResponseEntity<?> getSession(@PathVariable String code){
        return sessionService.getSession(code)
                .map(session -> ResponseEntity.ok(sessionToMap(session)))
                .orElse(ResponseEntity.notFound().build());
    }

    //Joins session as participant
    @PostMapping("/{code}/join")
    public ResponseEntity<?> joinSession(@PathVariable String code, @RequestBody JoinRequest request){
        Map<String, Object> result = sessionService.joinSession(code, request.displayName());

        if((boolean) result.get("success")){ return ResponseEntity.ok(result); }
        return ResponseEntity.badRequest().body(result);
    }

    //Starts poll and timer.
    @PostMapping("/{code}/launch")
    public ResponseEntity<?> launchPoll(@PathVariable String code, @RequestBody CreatorRequest request) {
        boolean success = sessionService.launchPoll(code, request.creatorId());

        if(success){ return ResponseEntity.ok(Map.of("success", true)); }
        return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Cannot launch poll"));
    }

    @PostMapping("/{code}/close")
    public ResponseEntity<?> closePoll(@PathVariable String code, @RequestBody CreatorRequest request) {
        boolean success = sessionService.closePoll(code, request.creatorId());

        if (success){ return ResponseEntity.ok(Map.of("success", true)); }
        return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Cannot close poll"));
    }

    //Shows results to participants.
    @PostMapping("/{code}/results")
    public ResponseEntity<?> showResults(@PathVariable String code, @RequestBody CreatorRequest request) {
        boolean success = sessionService.showResults(code, request.creatorId());

        if(success){ return ResponseEntity.ok(Map.of("success", true)); }
        return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Cannot show results"));
    }

    //Exits without showing results.
    @PostMapping("/{code}/exit")
    public ResponseEntity<?> exitWithoutResults(@PathVariable String code, @RequestBody CreatorRequest request) {
        boolean success = sessionService.exitWithoutResults(code, request.creatorId());

        if (success) { return ResponseEntity.ok(Map.of("success", true)); }
        return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Cannot exit"));
    }

    @DeleteMapping("/{code}")
    public ResponseEntity<?> deleteSession(@PathVariable String code, @RequestBody CreatorRequest request) {
        boolean success = sessionService.deleteSession(code, request.creatorId());

        if (success) {
            return ResponseEntity.ok(Map.of("success", true));
        }
        return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Cannot delete session"));
    }

    //submits votes.
    @PostMapping("/{code}/votes")
    public ResponseEntity<?> submitVotes(@PathVariable String code, @RequestBody VoteRequest request) {
        boolean success = sessionService.submitVotes(code, request.participantName(), request.answers());

        if (success) { return ResponseEntity.ok(Map.of("success", true)); }
        return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Cannot submit votes"));
    }

    @GetMapping("/{code}/time")
    public ResponseEntity<?> getRemainingTime(@PathVariable String code) {
        int time =  sessionService.getRemainingTime(code);
        return ResponseEntity.ok(Map.of("remainingTime", time));
    }

    @GetMapping("/{code}/results")
    public ResponseEntity<?> getResults(@PathVariable String code){
        Map<String, Object> results = sessionService.getResults(code);

        if(results != null){ return ResponseEntity.ok(results); }
        return ResponseEntity.notFound().build();
    }

    //Gets personalized participant results.
    @GetMapping("/{code}/results/{participantName}")
    public ResponseEntity<?> getParticipantResults(@PathVariable String code, @PathVariable String participantName){
        Map<String, Object> results = sessionService.getParticipantResults(code, participantName);

        if (results != null) { return ResponseEntity.ok(results); }
        return ResponseEntity.notFound().build();
    }

    //Converts session  to frontend-compatible map
    private Map<String, Object> sessionToMap(Session session) {
        Map<String, Object> map = new HashMap<>();
        map.put("code", session.getCode());
        map.put("creatorId", session.getCreatorId());
        map.put("state", session.getState());
        map.put("timerStartedAt", session.getTimerStartedAt());
        map.put("resultsShown", session.getResultsShown());
        map.put("createdAt", session.getCreatedAt());
        map.put("exitedWithoutResults", session.getExitedWithoutResults());

        if (session.getPoll() != null) {
            map.put("pollTitle", session.getPoll().getTitle());
            map.put("title", session.getPoll().getTitle());
            map.put("timeLimit", session.getPoll().getTimeLimit());
            map.put("description", session.getPoll().getDescription());
            map.put("hasScore", session.getPoll().getHasScore());
            map.put("isAnonymous", session.getPoll().getIsAnonymous());

            List<Map<String, Object>> questions = session.getPoll().getQuestions().stream()
                    .map(q -> {
                        Map<String, Object> qMap = new HashMap<>();
                        qMap.put("id", q.getId());
                        qMap.put("text", q.getText());
                        qMap.put("orderIndex", q.getOrderIndex());
                        qMap.put("type", q.getType());
                        qMap.put("isAIGenerated", q.getIsAIGenerated());

                        List<Map<String, Object>> options = q.getOptions().stream()
                                .map(o -> {
                                    Map<String, Object> oMap = new HashMap<>();
                                    oMap.put("id", o.getId());
                                    oMap.put("text", o.getText());
                                    oMap.put("value", o.getValue());
                                    oMap.put("isAIGenerated", o.getIsAIGenerated());
                                    return oMap;
                                }).collect(Collectors.toList());
                        qMap.put("options", options);
                        return qMap;
                    }).collect(Collectors.toList());
            //checks if questions are correctly populated
            if (questions.isEmpty()) {
                //returns empty list .
            }
            map.put("questions", questions);
        }

        //Adds participants.
        map.put("participants", session.getParticipants().stream()
                .map(p -> Map.of(
                        "id", p.getId(),
                        "name", p.getName(),
                        "joinedAt", p.getJoinedAt()))
                .collect(Collectors.toList()));
        return map;
    }
}
