package in.goldentriangle.mfa;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class MfaApplication {

    public static void main(String[] args) {
        SpringApplication.run(MfaApplication.class, args);
    }
}
