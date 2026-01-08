package it.unical.xpoll.service;

import it.unical.xpoll.domain.*;
import it.unical.xpoll.service.ai.factory.AIResponseFactory.PollData;
import it.unical.xpoll.service.ai.factory.AIResponseFactory.QuestionData;
import it.unical.xpoll.service.ai.factory.AIResponseFactory.OptionData;
import it.unical.xpoll.repository.PollRepository;
import it.unical.xpoll.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class PollService {
    private final PollRepository pollRepository;
    private final PollAIService pollAIService;
    private final SessionRepository sessionRepository;

    public Poll createPoll(String creatorId, String title, String description, Integer timeLimit,
            Boolean hasScore, Boolean isAnonymous, Boolean showResults, List<Map<String, Object>> questionsData) {

        // If no questions provided, attempt to generate them via AI using the poll
        // title as the topic
        if (questionsData == null || questionsData.isEmpty()) {
            PollData aiPollData = pollAIService.generatePollFromPrompt(title);

            if (aiPollData != null && aiPollData.questions() != null && !aiPollData.questions().isEmpty()) {
                // Parse AI response into questionsData structure
                questionsData = new ArrayList<>();
                for (QuestionData q : aiPollData.questions()) {
                    Map<String, Object> questionMap = new HashMap<>();
                    questionMap.put("text", q.text());
                    questionMap.put("type", "SINGLE_CHOICE");

                    List<Map<String, Object>> optionsList = new ArrayList<>();
                    for (OptionData opt : q.options()) {
                        Map<String, Object> optionMap = new HashMap<>();
                        optionMap.put("text", opt.text());
                        optionMap.put("value", opt.value());
                        optionsList.add(optionMap);
                    }
                    questionMap.put("options", optionsList);
                    questionsData.add(questionMap);
                }

                // Use AI-generated title/description if not provided
                if (title == null || title.isBlank()) {
                    title = aiPollData.title();
                }
                if (description == null || description.isBlank()) {
                    description = aiPollData.description();
                }
            } else {
                throw new IllegalArgumentException("AI generation failed and no questions were provided.");
            }
        }

        for (Map<String, Object> quest : questionsData) {
            List<?> optionsList = (List<?>) quest.get("options");

            if (optionsList == null || optionsList.size() < 2) {
                throw new IllegalArgumentException("Each question must have at least two options.");
            }
        }

        Poll poll = Poll.builder()
                .creatorId(creatorId)
                .title(title)
                .description(description)
                .timeLimit(timeLimit)
                .hasScore(hasScore != null ? hasScore : false)
                .isAnonymous(isAnonymous != null ? isAnonymous : false)
                .showResults(showResults != null ? showResults : true)
                .status(PollStatus.DRAFT)
                .build();

        for (Map<String, Object> quest : questionsData) {
            // Handle question type
            String typeStr = (String) quest.getOrDefault("type", "SINGLE_CHOICE");
            Question.QuestionType questionType = Question.QuestionType.valueOf(typeStr);

            Question question = Question.builder()
                    .text((String) quest.get("text"))
                    .type(questionType)
                    .build();

            List<?> optionsList = (List<?>) quest.get("options");

            if (optionsList != null) {
                for (Object optionObj : optionsList) {
                    Option.OptionBuilder optionBuilder = Option.builder().question(question);

                    if (optionObj instanceof String) {
                        optionBuilder.text((String) optionObj);
                    } else if (optionObj instanceof Map) {
                        Map<?, ?> optionMap = (Map<?, ?>) optionObj;
                        optionBuilder.text((String) optionMap.get("text"));

                        if (optionMap.containsKey("value")) {
                            Object valueObj = optionMap.get("value");
                            if (valueObj instanceof Integer) {
                                optionBuilder.value((Integer) valueObj);
                            } else if (valueObj instanceof Number) {
                                optionBuilder.value(((Number) valueObj).intValue());
                            }
                        }

                        if (optionMap.containsKey("isCorrect")) {
                            Object isCorrectObj = optionMap.get("isCorrect");
                            if (isCorrectObj instanceof Boolean) {
                                optionBuilder.isCorrect((Boolean) isCorrectObj);
                            }
                        }
                    }
                    question.addOption(optionBuilder.build());
                }
            }
            poll.addQuestion(question);
        }
        return pollRepository.save(poll);
    }

    public Poll publishPoll(Poll poll) {
        poll.setStatus(PollStatus.PUBLISHED);

        return pollRepository.save(poll);
    }

    public Poll updatePoll(Long id, String title, String description, Integer timeLimit,
            Boolean hasScore, Boolean isAnonymous, Boolean showResults, List<Map<String, Object>> questionsData) {
        Poll poll = pollRepository.findById(id).orElseThrow(() -> new RuntimeException("Poll not found"));

        if (hasActiveSession(poll)) {
            throw new RuntimeException("Cannot modify poll with active session");
        }

        poll.setTitle(title != null ? title : poll.getTitle());
        poll.setDescription(description != null ? description : poll.getDescription());
        poll.setTimeLimit(timeLimit != null ? timeLimit : poll.getTimeLimit());
        poll.setHasScore(hasScore != null ? hasScore : poll.getHasScore());
        poll.setIsAnonymous(isAnonymous != null ? isAnonymous : poll.getIsAnonymous());
        poll.setShowResults(showResults != null ? showResults : poll.getShowResults());

        if (questionsData != null && !questionsData.isEmpty()) {
            poll.getQuestions().clear();
            for (Map<String, Object> quest : questionsData) {
                String typeStr = (String) quest.getOrDefault("type", "SINGLE_CHOICE");
                Question.QuestionType questionType = Question.QuestionType.valueOf(typeStr);
                Question question = Question.builder()
                        .text((String) quest.get("text"))
                        .type(questionType)
                        .build();
                List<?> optionsList = (List<?>) quest.get("options");
                if (optionsList != null) {
                    for (Object optionObj : optionsList) {
                        Option.OptionBuilder optionBuilder = Option.builder().question(question);
                        if (optionObj instanceof String) {
                            optionBuilder.text((String) optionObj);
                        } else if (optionObj instanceof Map) {
                            Map<?, ?> optionMap = (Map<?, ?>) optionObj;
                            optionBuilder.text((String) optionMap.get("text"));
                            if (optionMap.containsKey("value")) {
                                Object valueObj = optionMap.get("value");
                                if (valueObj instanceof Integer) {
                                    optionBuilder.value((Integer) valueObj);
                                } else if (valueObj instanceof Number) {
                                    optionBuilder.value(((Number) valueObj).intValue());
                                }
                            }
                            if (optionMap.containsKey("isCorrect")) {
                                Object isCorrectObj = optionMap.get("isCorrect");
                                if (isCorrectObj instanceof Boolean) {
                                    optionBuilder.isCorrect((Boolean) isCorrectObj);
                                }
                            }
                        }
                        question.addOption(optionBuilder.build());
                    }
                }
                poll.addQuestion(question);
            }
        }

        return pollRepository.save(poll);
    }

    private boolean hasActiveSession(Poll poll) {
        return sessionRepository.existsByPollAndStateIn(
                poll,
                List.of(SessionState.WAITING, SessionState.OPEN));
    }

    public void deletePoll(Long id) {
        Poll poll = pollRepository.findById(id).orElseThrow(() -> new RuntimeException("Poll not found"));

        if (hasActiveSession(poll)) {
            throw new RuntimeException("Cannot delete poll with active session");
        }

        pollRepository.delete(poll);
    }

    public java.util.Optional<Poll> getPollById(Long id) {
        return pollRepository.findById(id);
    }

    public List<Poll> getMyPolls(String creatorId) {
        return pollRepository.findByCreatorId(creatorId);
    }
}
