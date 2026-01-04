package it.unical.xpoll.repository;

import it.unical.xpoll.domain.Vote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VoteRepository extends JpaRepository<Vote, Long> {
    List<Vote> findBySessionId(Long sessionId);
    List<Vote> findBySessionIdAndParticipantId(Long sessionId, Long participantId);
    boolean existsBySessionIdAndParticipantId(Long sessionId, Long participantId);
}
