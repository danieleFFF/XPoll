package it.unical.xpoll.repository;

import it.unical.xpoll.domain.Participant;
import it.unical.xpoll.domain.Vote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface VoteRepository extends JpaRepository<Vote, Long> {
        List<Vote> findBySessionId(Long sessionId);

        //Uses JOIN FETCH to  load question and option to avoid lazy loading issues when calculating scores
        @org.springframework.data.jpa.repository.Query("SELECT DISTINCT v FROM Vote v " +
                        "JOIN FETCH v.question q " +
                        "JOIN FETCH v.option o " +
                        "LEFT JOIN FETCH q.options " +
                        "WHERE v.session.id = :sessionId AND v.participant.id = :participantId")
        List<Vote> findBySessionIdAndParticipantId(
                        @org.springframework.data.repository.query.Param("sessionId") Long sessionId,
                        @org.springframework.data.repository.query.Param("participantId") Long participantId);
        boolean existsBySessionIdAndParticipantId(Long sessionId, Long participantId);
        List<Vote> findByParticipant(Participant participant);
        List<Vote> findByParticipantId(Long participantId);
}
