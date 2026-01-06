package it.unical.xpoll.service;

import it.unical.xpoll.domain.*;
import it.unical.xpoll.repository.PollRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class PollService {
    private final PollRepository pollRepository;

    public Poll createPoll(String creatorId, String title, Integer timeLimit, List<Map<String, Object>> questionsData) {
        if (questionsData == null || questionsData.isEmpty()) {
            throw new IllegalArgumentException("A poll must contain at least one question.");
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
                .timeLimit(timeLimit)
                .status(PollStatus.DRAFT)
                .build();

        for (Map<String, Object> quest : questionsData) {
            Question question = Question.builder().text((String) quest.get("text"))
                    .correctAnswer((Integer) quest.get("correctAnswer"))
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
                            optionBuilder.value((Integer) optionMap.get("value"));
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

    public Poll updatePoll(Long id, String title, Integer timeLimit) {
        Poll poll = pollRepository.findById(id).orElseThrow(() -> new RuntimeException("Poll not found"));

        if (poll.getStatus() == PollStatus.PUBLISHED) {
            throw new RuntimeException("Can't modify published poll");
        }

        poll.setTitle(title);
        poll.setTimeLimit(timeLimit);

        return pollRepository.save(poll);
    }

    public void deletePoll(Long id) {
        Poll poll = pollRepository.findById(id).orElseThrow(() -> new RuntimeException("Poll not found"));

        if (poll.getStatus() == PollStatus.PUBLISHED) {
            throw new RuntimeException("Can't delete published poll");
        }

        pollRepository.delete(poll);
    }

    public List<Poll> getMyPolls(String creatorId) {
        return pollRepository.findByCreatorId(creatorId);
    }
}
