package it.unical.xpoll.service.ai.factory;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class AIResponseFactory {

    private final ObjectMapper objectMapper;
    private static final Pattern JSON_PATTERN = Pattern.compile("\\{.*\\}", Pattern.DOTALL);
    private static final Pattern JSON_ARRAY_PATTERN = Pattern.compile("\\[.*\\]", Pattern.DOTALL);

    public AIResponseFactory() {
        this.objectMapper = new ObjectMapper();
    }

    public PollData createPollFromJson(String jsonResponse) {
        if (jsonResponse == null || jsonResponse.trim().isEmpty()) {
            return null;
        }

        try {
            String cleanJson = extractJson(jsonResponse);
            if (cleanJson == null) {
                System.err.println("No valid JSON found in response");
                return null;
            }

            JsonNode rootNode = objectMapper.readTree(cleanJson);

            String title = sanitize(rootNode.path("title").asText());
            String description = sanitize(rootNode.path("description").asText());

            List<QuestionData> questions = new ArrayList<>();
            JsonNode questionsNode = rootNode.path("questions");

            if (questionsNode.isArray()) {
                for (JsonNode questionNode : questionsNode) {
                    String questionText = sanitize(questionNode.path("text").asText());
                    List<OptionData> options = new ArrayList<>();

                    JsonNode optionsNode = questionNode.path("options");
                    if (optionsNode.isArray()) {
                        for (JsonNode optionNode : optionsNode) {
                            String optionText = sanitize(optionNode.path("text").asText());
                            int value = optionNode.path("points").asInt(0);
                            options.add(new OptionData(optionText, value));
                        }
                    }

                    if (options.size() >= 2) {
                        questions.add(new QuestionData(questionText, options));
                    }
                }
            }

            if (questions.isEmpty()) {
                System.err.println("Poll must have at least 1 question");
                return null;
            }

            return new PollData(title, description, questions);

        } catch (Exception e) {
            System.err.println("Error parsing poll JSON: " + e.getMessage());
            return null;
        }
    }

    public List<OptionData> createAnswersFromJson(String jsonResponse) {
        if (jsonResponse == null || jsonResponse.trim().isEmpty()) {
            return null;
        }

        try {
            String cleanJson = extractJsonArray(jsonResponse);
            if (cleanJson == null) {
                System.err.println("No valid JSON array found in response");
                return null;
            }

            JsonNode rootNode = objectMapper.readTree(cleanJson);
            List<OptionData> options = new ArrayList<>();

            if (rootNode.isArray()) {
                for (JsonNode optionNode : rootNode) {
                    String optionText = sanitize(optionNode.path("text").asText());
                    int value = optionNode.path("points").asInt(0);
                    options.add(new OptionData(optionText, value));
                }
            }

            if (options.size() < 2) {
                System.err.println("Must have at least 2 answer options");
                return null;
            }

            return options;

        } catch (Exception e) {
            System.err.println("Error parsing answers JSON: " + e.getMessage());
            return null;
        }
    }

    private String extractJson(String text) {
        Matcher matcher = JSON_PATTERN.matcher(text);
        if (matcher.find()) {
            return matcher.group();
        }
        return null;
    }

    private String extractJsonArray(String text) {
        Matcher matcher = JSON_ARRAY_PATTERN.matcher(text);
        if (matcher.find()) {
            return matcher.group();
        }
        return null;
    }

    private String sanitize(String text) {
        if (text == null)
            return "";
        text = text.replaceAll("<[^>]*>", "");
        text = text.replaceAll("(?i)<script[^>]*>.*?</script>", "");
        return text.trim();
    }

    public record PollData(String title, String description, List<QuestionData> questions) {
    }

    public record QuestionData(String text, List<OptionData> options) {
    }

    public record OptionData(String text, int value) {
    }
}
