package it.unical.xpoll.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;

//Response DTO for participation history items.
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParticipationResponse {
    private Long sessionId;
    private String pollTitle;
    private Instant participationDate;
    private Integer score;
    private Integer maxScore;
    private Boolean isPresenter;
    private Boolean hasParticipated;
    private Integer completionTimeSeconds;
    private Integer totalTimeSeconds;
}

