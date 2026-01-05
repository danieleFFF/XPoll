package it.unical.xpoll.dto.gemini;

import java.util.List;

public record GeminiResponse(List<Candidate> candidates) {

    public record Candidate(Content content, String finishReason) {
    }

    public record Content(List<Part> parts, String role) {
    }

    public record Part(String text) {
    }

    public String text() {
        if (candidates == null || candidates.isEmpty()) {
            return "";
        }
        Candidate candidate = candidates.get(0);
        if (candidate.content() == null || candidate.content().parts() == null
                || candidate.content().parts().isEmpty()) {
            return "";
        }
        return candidate.content().parts().get(0).text();
    }
}
