package it.unical.xpoll.domain;

import jakarta.persistence.*;
import lombok.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "questions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Question {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, columnDefinition = "TEXT")
    private String text;
    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("orderIndex ASC")
    @Builder.Default
    private List<Option> options = new ArrayList<>();

    private Integer correctAnswer;
    @Column(nullable = false)
    private Integer orderIndex;
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private QuestionType type = QuestionType.SINGLE_CHOICE;

    @Builder.Default
    private Boolean isAIGenerated = false;

    public void addOption(Option option) {
        option.setQuestion(this);
        option.setOrderIndex(options.size());
        options.add(option);
    }

    public enum QuestionType {
        SINGLE_CHOICE,
        MULTIPLE_CHOICE
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "poll_id")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Poll poll;
}
