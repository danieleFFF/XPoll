package it.unical.xpoll.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Session {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true, length = 6)
    private String code;
    private String creatorId;
    //null if for anonymous/guest creators
    private Long creatorUserId;
    @ManyToOne(cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JoinColumn(name = "poll_id")
    private Poll poll;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private SessionState state = SessionState.WAITING;
    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @Builder.Default
    private List<Participant> participants = new ArrayList<>();
    private Instant createdAt;
    private Instant timerStartedAt;
    private Instant endedAt;
    @Builder.Default
    private Boolean resultsShown = false;
    @Builder.Default
    private Boolean exitedWithoutResults = false;

    public void addParticipant(Participant participant) {
        participant.setSession(this);
        participants.add(participant);
    }
}
