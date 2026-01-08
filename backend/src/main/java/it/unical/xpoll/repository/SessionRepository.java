package it.unical.xpoll.repository;

import it.unical.xpoll.domain.Session;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import it.unical.xpoll.domain.Poll;
import it.unical.xpoll.domain.SessionState;
import java.util.List;

@Repository
public interface SessionRepository extends JpaRepository<Session, Long> {
    Optional<Session> findByCode(String code);

    boolean existsByCode(String code);

    boolean existsByPollAndStateIn(Poll poll, List<SessionState> states);
}
