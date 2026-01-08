package it.unical.xpoll.repository;

import it.unical.xpoll.domain.Poll;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PollRepository extends JpaRepository<Poll, Long> {
    //Finds all polls created by a specific user.
    List<Poll> findByCreatorId(String creatorId);
}