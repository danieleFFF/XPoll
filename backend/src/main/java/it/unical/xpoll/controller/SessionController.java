package it.unical.xpoll.controller;

import it.unical.xpoll.domain.Option;
import it.unical.xpoll.domain.Session;
import it.unical.xpoll.domain.Vote;
import it.unical.xpoll.model.AccessMode;
import it.unical.xpoll.model.User;
import it.unical.xpoll.repository.UserRepository;
import it.unical.xpoll.repository.VoteRepository;
import it.unical.xpoll.service.SessionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.util.stream.Collectors;

//Rest controller for session management
@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
@Slf4j
public class SessionController {
    private final SessionService sessionService;
    private final VoteRepository voteRepository;
    private final UserRepository userRepository;

    public record CreateSessionRequest(
            String creatorId,
            Long creatorUserId,
            String title,
            Integer timeLimit,
            List<Map<String, Object>> questions) {
    }
    public record JoinRequest(String displayName, Long userId) { }
    public record CreatorRequest(String creatorId) { }
    public record VoteRequest(String participantName, Map<String, Integer> answers) { }

    @PostMapping
    public ResponseEntity<?> createSession(@RequestBody CreateSessionRequest request) {
        try {
            Session session = sessionService.createSession(
                    request.creatorId(),
                    request.creatorUserId(),
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
    public ResponseEntity<?> joinSession(@PathVariable String code, @RequestBody JoinRequest request) {
        Map<String, Object> result = sessionService.joinSession(code, request.displayName(), request.userId());

        if((boolean) result.get("success")){ return ResponseEntity.ok(result);}
        return ResponseEntity.badRequest().body(result);
    }

    //Leaves session as participant (removes from lobby)
    public record LeaveRequest(String participantName) { }

    @PostMapping("/{code}/leave")
    public ResponseEntity<?> leaveSession(@PathVariable String code, @RequestBody LeaveRequest request) {
        boolean success = sessionService.leaveSession(code, request.participantName());

        if(success){ return ResponseEntity.ok(Map.of("success", true)); }

        return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Could not leave session"));
    }

    // Starts poll and timer.
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

        //Adds participants with their scores, completion time, and google status.
        map.put("participants", session.getParticipants().stream()
                .map(p -> {
                    Map<String, Object> pMap = new HashMap<>();
                    pMap.put("id", p.getId());
                    pMap.put("name", p.getName());
                    pMap.put("joinedAt", p.getJoinedAt());
                    //Calculates score from votes.
                    int score = calculateParticipantScore(session.getId(), p.getId());
                    pMap.put("score", score);
                    //Adds completion time if available
                    pMap.put("completionTimeSeconds", p.getCompletionTimeSeconds());
                    //Checks if user is logged in with google.
                    boolean isGoogleUser = false;

                    if (p.getUserId() != null) {
                        Optional<User> userOpt = userRepository.findById(p.getUserId());

                        if (userOpt.isPresent() && userOpt.get().getAccessMode() == AccessMode.GOOGLE) {
                            isGoogleUser = true;
                        }
                    }
                    pMap.put("isGoogleUser", isGoogleUser);
                    return pMap;
                })
                .collect(Collectors.toList()));
        return map;
    }

    //Helper method to calculate participant score from votes.
    private int calculateParticipantScore(Long sessionId, Long participantId) {
        log.info("calculateParticipantScore: sessionId={}, participantId={}", sessionId, participantId);
        List<Vote> votes = voteRepository.findBySessionIdAndParticipantId(sessionId, participantId);
        log.info("Found {} votes for participant {}", votes.size(), participantId);
        int totalScore = 0;

        for (Vote v : votes){
            if(v.getOption() == null || v.getQuestion() == null) {
                log.warn("Vote {} has null option or question", v.getId());
                continue;
            }

            //Checks if option has explicit value/score.
            if(v.getOption().getValue() != null && v.getOption().getValue() > 0) {
                totalScore += v.getOption().getValue();
                log.info("Vote {}: option has value {}, totalScore now {}", v.getId(), v.getOption().getValue(),
                        totalScore);
                continue;
            }

            //Otherwise checks if this is correct answer based on index.
            Integer correctAnswerIndex = v.getQuestion().getCorrectAnswer();
            log.info("Vote {}: questionId={}, correctAnswerIndex={}, selectedOptionId={}",
                    v.getId(), v.getQuestion().getId(), correctAnswerIndex, v.getOption().getId());

            if(correctAnswerIndex != null){
                List<Option> options = v.getQuestion().getOptions();
                //Finds the index of the selected option.
                for (int i = 0; i < options.size(); i++) {
                    if(options.get(i).getId().equals(v.getOption().getId())) {
                        log.info("Vote {}: found option at index {}, correctIndex is {}", v.getId(), i,
                                correctAnswerIndex);
                        if(i == correctAnswerIndex) {
                            totalScore += 1; // 1 point for correct answer.
                            log.info("Vote {}: CORRECT! totalScore now {}", v.getId(), totalScore);
                        }
                        break;
                    }
                }
            }
        }
        log.info("Final score for participant {}: {}", participantId, totalScore);
        return totalScore;
    }
}
