package it.unical.xpoll.domain;

import jakarta.persistence.*;
import lombok.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "polls")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Poll {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;
    private String creatorId;
    @Column(columnDefinition = "TEXT")
    private String description;
    private Integer timeLimit;
    @Builder.Default
    private Boolean hasScore = false;
    @Builder.Default
    private Boolean isAnonymous = false;
    @Builder.Default
    private Boolean showResults = true;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private PollStatus status = PollStatus.DRAFT;
    @OneToMany(mappedBy = "poll", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("orderIndex ASC")
    @Builder.Default
    private List<Question> questions = new ArrayList<>();

    public void addQuestion(Question question) {
        question.setPoll(this);
        question.setOrderIndex(questions.size());
        questions.add(question);
    }
}
