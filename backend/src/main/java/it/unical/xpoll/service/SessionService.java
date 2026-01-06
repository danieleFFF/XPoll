package it.unical.xpoll.service;

import it.unical.xpoll.domain.*;
import it.unical.xpoll.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class SessionService {
    private final SessionRepository sessionRepository;
    private final VoteRepository voteRepository;
    private final ParticipantRepository participantRepository;
    private final QuestionRepository questionRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final PollService pollService;

    private String generateCode() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        Random random = new Random();
        StringBuilder code = new StringBuilder();

        do {
            code.setLength(0);

            for (int i = 0; i < 6; i++) {
                code.append(chars.charAt(random.nextInt(chars.length())));
            }
        } while (sessionRepository.existsByCode(code.toString()));

        return code.toString();
    }

    // Creates new session with poll data
    public Session createSession(String creatorId, Long creatorUserId, String title, Integer timeLimit,
            List<Map<String, Object>> questionsData) {

        // Creates draft poll (passing null for description)
        Poll poll = pollService.createPoll(creatorId, title, null, timeLimit, false, false, true, questionsData);
        // Publishes poll
        poll = pollService.publishPoll(poll);

        Session session = Session.builder()
                .code(generateCode())
                .creatorId(creatorId)
                .creatorUserId(creatorUserId)
                .poll(poll)
                .state(SessionState.WAITING)
                .createdAt(Instant.now())
                .build();

        Session saved = sessionRepository.save(session);

        return saved;
    }

    // Gets session by code
    @Transactional(readOnly = true)
    public Optional<Session> getSession(String code) {
        return sessionRepository.findByCode(code.toUpperCase());
    }

    // Joins session as participant.
    public Map<String, Object> joinSession(String code, String displayName, Long userId) {
        Optional<Session> opt = sessionRepository.findByCode(code.toUpperCase());

        if (opt.isEmpty()) {
            return Map.of("success", false, "error", "Session not found");
        }

        Session session = opt.get();

        if (session.getState() == SessionState.CLOSED) {
            return Map.of("success", false, "error", "Session is closed");
        }

        // Check for duplicate name in this session
        boolean nameExists = session.getParticipants().stream()
                .anyMatch(p -> p.getName().equalsIgnoreCase(displayName));

        if (nameExists)
            return Map.of("success", false, "error", "Display name already taken", "code", "NAME_TAKEN");

        // Create new participant linked to session
        Participant participant = Participant.builder()
                .name(displayName)
                .session(session)
                .sessionToken(UUID.randomUUID().toString())
                .joinedAt(Instant.now())
                .isConnected(true)
                .userId(userId) // Links authenticated user for history tracking.
                .build();

        participantRepository.save(participant);

        // Adds participant to session list
        session.addParticipant(participant);
        sessionRepository.save(session);

        // Broadcasts participant that joined.
        broadcastSessionUpdate(code, "PARTICIPANT_JOINED", Map.of(
                "participant", Map.of("name", displayName, "joinedAt", participant.getJoinedAt())));

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("sessionCode", code);
        result.put("sessionToken", participant.getSessionToken());
        Map<String, Object> participantData = new HashMap<>();
        participantData.put("name", participant.getName());
        participantData.put("joinedAt", participant.getJoinedAt());
        participantData.put("id", participant.getId());
        result.put("participant", participantData);

        return result;
    }

    // removes participant from session .
    public boolean leaveSession(String code, String participantName) {
        Optional<Session> opt = sessionRepository.findByCode(code.toUpperCase());

        if (opt.isEmpty()) {
            return false;
        }

        Session session = opt.get();

        // Finds and removes participant by name
        Optional<Participant> participantOpt = session.getParticipants().stream()
                .filter(p -> p.getName().equalsIgnoreCase(participantName))
                .findFirst();

        if (participantOpt.isEmpty()) {
            return false;
        }

        Participant participant = participantOpt.get();
        session.getParticipants().remove(participant);
        participantRepository.delete(participant);
        sessionRepository.save(session);

        // Broadcasts participant left.
        broadcastSessionUpdate(code, "PARTICIPANT_LEFT", Map.of(
                "participantName", participantName));

        return true;
    }

    // Launches poll and starts timer
    public boolean launchPoll(String code, String creatorId) {
        Optional<Session> opt = sessionRepository.findByCode(code.toUpperCase());

        if (opt.isEmpty())
            return false;

        Session session = opt.get();

        if (!session.getCreatorId().equals(creatorId))
            return false;

        session.setState(SessionState.OPEN);
        session.setTimerStartedAt(Instant.now());
        sessionRepository.save(session);

        broadcastSessionUpdate(code, "SESSION_STATE_CHANGED", Map.of(
                "state", SessionState.OPEN.name(),
                "timerStartedAt", session.getTimerStartedAt()));

        return true;
    }

    // Closes poll.
    public boolean closePoll(String code, String creatorId) {
        Optional<Session> opt = sessionRepository.findByCode(code.toUpperCase());

        if (opt.isEmpty())
            return false;

        Session session = opt.get();

        if (!session.getCreatorId().equals(creatorId))
            return false;

        session.setState(SessionState.CLOSED);
        session.setEndedAt(Instant.now());
        sessionRepository.save(session);
        broadcastSessionUpdate(code, "SESSION_STATE_CHANGED", Map.of("state", SessionState.CLOSED.name()));

        return true;
    }

    // Shows results to participants
    public boolean showResults(String code, String creatorId) {
        Optional<Session> opt = sessionRepository.findByCode(code.toUpperCase());

        if (opt.isEmpty())
            return false;

        Session session = opt.get();

        if (!session.getCreatorId().equals(creatorId))
            return false;

        session.setResultsShown(true);
        session.setState(SessionState.CLOSED);
        session.setEndedAt(Instant.now());
        sessionRepository.save(session);
        broadcastSessionUpdate(code, "RESULTS_SHOWN", Map.of("resultsShown", true));

        return true;
    }

    // Exits without showing results.
    public boolean exitWithoutResults(String code, String creatorId) {
        Optional<Session> opt = sessionRepository.findByCode(code.toUpperCase());

        if (opt.isEmpty())
            return false;

        Session session = opt.get();

        if (!session.getCreatorId().equals(creatorId))
            return false;

        session.setExitedWithoutResults(true);
        session.setState(SessionState.CLOSED);
        session.setEndedAt(Instant.now());
        sessionRepository.save(session);
        broadcastSessionUpdate(code, "SESSION_CLOSED", Map.of("exitedWithoutResults", true));

        return true;
    }

    // Deletes session.
    public boolean deleteSession(String code, String creatorId) {
        Optional<Session> opt = sessionRepository.findByCode(code.toUpperCase());

        if (opt.isEmpty())
            return false;

        Session session = opt.get();

        if (!session.getCreatorId().equals(creatorId))
            return false;

        sessionRepository.delete(session);
        broadcastSessionUpdate(code, "SESSION_DELETED", Map.of());

        return true;
    }

    // Submits participant's votes
    public boolean submitVotes(String code, String participantName, Map<String, Integer> answers) {
        Optional<Session> opt = sessionRepository.findByCode(code.toUpperCase());

        if (opt.isEmpty()) {
            return false;
        }

        Session session = opt.get();

        if (session.getState() == SessionState.WAITING) {
            return false;
        }

        // Finds participant by name in this session
        Optional<Participant> participantOpt = session.getParticipants().stream()
                .filter(p -> p.getName().equalsIgnoreCase(participantName))
                .findFirst();

        if (participantOpt.isEmpty()) {
            return false;
        }

        Participant participant = participantOpt.get();

        // Gets existing votes for this participant
        List<Vote> existingVotes = voteRepository.findBySessionIdAndParticipantId(session.getId(), participant.getId());
        Set<Long> answeredQuestionIds = existingVotes.stream()
                .map(v -> v.getQuestion().getId())
                .collect(Collectors.toSet());

        try {
            List<Vote> votesToSave = new ArrayList<>();
            for (Map.Entry<String, Integer> entry : answers.entrySet()) {
                Long questionId = Long.valueOf(entry.getKey());
                Integer optionIndex = entry.getValue();

                // Skips if already answered
                if (answeredQuestionIds.contains(questionId)) {
                    continue;
                }

                Question question = questionRepository.findById(questionId).orElse(null);
                if (question == null || !question.getPoll().getId().equals(session.getPoll().getId())) {
                    continue;
                }

                if (optionIndex >= 0 && optionIndex < question.getOptions().size()) {
                    Option selectedOption = question.getOptions().get(optionIndex);

                    Vote vote = Vote.builder()
                            .session(session)
                            .participant(participant)
                            .question(question)
                            .option(selectedOption)
                            .submittedAt(Instant.now())
                            .build();
                    votesToSave.add(vote);
                }
            }

            if (!votesToSave.isEmpty()) {
                voteRepository.saveAll(votesToSave);

                // Calculates and saves completion time (only on first submission)
                if (participant.getSubmittedAt() == null && session.getTimerStartedAt() != null) {
                    Instant now = Instant.now();
                    participant.setSubmittedAt(now);
                    int completionSeconds = (int) (now.getEpochSecond() - session.getTimerStartedAt().getEpochSecond());
                    participant.setCompletionTimeSeconds(completionSeconds);
                    participantRepository.save(participant);
                }
            }

            // Broadcasts update.
            broadcastSessionUpdate(code, "VOTE_SUBMITTED", Map.of("status", "ok"));
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    // Gets remaining time
    @Transactional(readOnly = true)
    public int getRemainingTime(String code) {
        Optional<Session> opt = sessionRepository.findByCode(code.toUpperCase());

        if (opt.isEmpty())
            return 0;

        Session session = opt.get();

        if (session.getTimerStartedAt() == null) {
            return session.getPoll().getTimeLimit() != null ? session.getPoll().getTimeLimit() : 0;
        }

        long elapsed = Instant.now().getEpochSecond() - session.getTimerStartedAt().getEpochSecond();
        int timeLimit = session.getPoll().getTimeLimit() != null ? session.getPoll().getTimeLimit() : 0;
        return Math.max(0, timeLimit - (int) elapsed);
    }

    // Calculates aggregate results .
    @Transactional(readOnly = true)
    public Map<String, Object> getResults(String code) {
        Optional<Session> opt = sessionRepository.findByCode(code.toUpperCase());

        if (opt.isEmpty())
            return null;

        Session session = opt.get();
        Poll poll = session.getPoll();
        List<Vote> allVotes = voteRepository.findBySessionId(session.getId());
        List<Map<String, Object>> questionsResults = new ArrayList<>();

        for (Question question : poll.getQuestions()) {
            List<Map<String, Object>> optionResults = new ArrayList<>();
            // Filters votes for this question
            List<Vote> questionVotes = allVotes.stream()
                    .filter(v -> v.getQuestion().getId().equals(question.getId()))
                    .toList();

            for (int i = 0; i < question.getOptions().size(); i++) {
                Option option = question.getOptions().get(i);

                long voteCount = questionVotes.stream()
                        .filter(v -> v.getOption().getId().equals(option.getId()))
                        .count();

                boolean isCorrect = question.getCorrectAnswer() != null && question.getCorrectAnswer() == i;

                optionResults.add(Map.of(
                        "id", option.getId(),
                        "text", option.getText(),
                        "votes", voteCount,
                        "isCorrect", isCorrect));
            }
            Map<String, Object> questionMap = new HashMap<>();
            questionMap.put("id", question.getId());
            questionMap.put("text", question.getText());
            questionMap.put("options", optionResults);
            questionsResults.add(questionMap);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("pollTitle", poll.getTitle());
        // counts distinct voters
        response.put("totalParticipants", allVotes.stream().map(v -> v.getParticipant().getId()).distinct().count());
        response.put("questions", questionsResults);

        return response;
    }

    // Gets personalized results
    @Transactional(readOnly = true)
    public Map<String, Object> getParticipantResults(String code, String participantName) {
        Optional<Session> opt = sessionRepository.findByCode(code.toUpperCase());

        if (opt.isEmpty())
            return null;

        Session session = opt.get();
        Poll poll = session.getPoll();

        // Finds participant
        Optional<Participant> participantOpt = session.getParticipants().stream()
                .filter(p -> p.getName().equalsIgnoreCase(participantName))
                .findFirst();

        if (participantOpt.isEmpty()) {
            return null;
        }
        Participant participant = participantOpt.get();

        // Gets participant's votes
        List<Vote> myVotes = voteRepository.findBySessionIdAndParticipantId(session.getId(), participant.getId());
        int correctCount = 0;
        List<Map<String, Object>> questionsResults = new ArrayList<>();

        for (Question question : poll.getQuestions()) {
            Optional<Vote> voteOpt = myVotes.stream()
                    .filter(v -> v.getQuestion().getId().equals(question.getId()))
                    .findFirst();

            Map<String, Object> qResult = new HashMap<>();
            qResult.put("id", question.getId());
            qResult.put("text", question.getText());

            // Maps options to DTO
            List<Map<String, Object>> optionsDTO = question.getOptions().stream()
                    .map(o -> {
                        Map<String, Object> map = new HashMap<>();
                        map.put("id", o.getId());
                        map.put("text", o.getText());
                        return map;
                    })
                    .collect(Collectors.toList());
            qResult.put("options", optionsDTO);

            int selectedIndex = -1;
            int correctAnswerIndex = question.getCorrectAnswer() != null ? question.getCorrectAnswer() : -1;

            if (voteOpt.isPresent()) {
                Vote vote = voteOpt.get();
                for (int i = 0; i < question.getOptions().size(); i++) {
                    if (question.getOptions().get(i).getId().equals(vote.getOption().getId())) {
                        selectedIndex = i;
                        break;
                    }
                }
                boolean isCorrect = (selectedIndex != -1 && selectedIndex == correctAnswerIndex);
                qResult.put("isCorrect", isCorrect);

                if (isCorrect)
                    correctCount++;
            } else {
                qResult.put("isCorrect", false);
            }
            qResult.put("selectedIndex", selectedIndex);
            qResult.put("correctAnswerIndex", correctAnswerIndex);
            questionsResults.add(qResult);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("pollTitle", poll.getTitle());
        result.put("correctCount", correctCount);
        result.put("totalQuestions", poll.getQuestions().size());
        result.put("questions", questionsResults);

        return result;
    }

    // Broadcasts session update to all connected participants
    private void broadcastSessionUpdate(String code, String type, Map<String, Object> payload) {
        Map<String, Object> message = new HashMap<>();
        message.put("type", type);
        message.putAll(payload);
        messagingTemplate.convertAndSend("/topic/session/" + code.toUpperCase(), (Object) message);
    }
}
