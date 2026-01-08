package it.unical.xpoll;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.context.ApplicationContext;
import org.springframework.core.env.Environment;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = WebEnvironment.MOCK)
class XPollApplicationTests {
    @Autowired
    private ApplicationContext applicationContext;
    @Autowired
    private Environment environment;

    @Test
    void applicationContextNotNull() {
        assertNotNull(applicationContext, "Application context should not be null");
    }

    @Test
    void environmentLoads() {
        assertNotNull(environment, "Environment should not be null");
    }

    @Test
    void applicationNameIsCorrect() {
        String appName = environment.getProperty("spring.application.name");
        assertEquals("xpoll", appName, "Application name should be 'xpoll'");
    }
}
