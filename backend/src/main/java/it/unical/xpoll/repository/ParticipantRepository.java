package it.unical.xpoll.repository;

import it.unical.xpoll.domain.Participant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ParticipantRepository extends JpaRepository<Participant, Long> {
    Optional<Participant> findByNameAndSessionCode(String name, String sessionCode);
    boolean existsByNameAndSessionCode(String name, String sessionCode);
    //finds all participations for a registered user
    List<Participant> findByUserId(Long userId);
}
