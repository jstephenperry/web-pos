# CORS Solution Documentation

## Issue
The application was experiencing a CORS (Cross-Origin Resource Sharing) error when making requests from the frontend (http://localhost:3000) to the backend API (http://localhost:8765):

```
Access to fetch at 'http://localhost:8765/api/v1/payments' from origin 'http://localhost:3000' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Temporary Frontend Solution (Implemented)

We've implemented a temporary workaround using Next.js API route rewrites to proxy the requests through the Next.js server:

1. Added a `rewrites()` configuration in `next.config.js` to proxy API requests
2. Updated the fetch URL in `page.tsx` to use a relative path that will be handled by the Next.js server

This solution works for development but is not recommended for production as it adds unnecessary load to your Next.js server.

## Proper Backend Solution (Recommended)

The proper solution is to enable CORS on your Spring Boot backend. Here's how to do it:

### Option 1: Using @CrossOrigin annotation

Add the `@CrossOrigin` annotation to your controller:

```java
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin(origins = "http://localhost:3000") // Allow requests from your frontend
public class PaymentController {
    // Your controller methods
}
```

### Option 2: Global CORS Configuration

Create a configuration class to enable CORS globally:

```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:3000")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
```

### Option 3: Using Spring Security

If you're using Spring Security, you'll need to configure CORS in your security configuration:

```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors().and() // Enable CORS
            .csrf().disable() // Disable CSRF (for API endpoints)
            // Other security configurations
            ;
        return http.build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:3000"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }
}
```

## Production Considerations

For production environments:

1. Replace `http://localhost:3000` with your actual production frontend URL
2. Consider using environment variables to configure the allowed origins based on the environment
3. Be as specific as possible with the allowed methods, headers, and paths to follow security best practices
4. Remove the Next.js rewrites configuration once the backend CORS is properly configured

## Testing the Solution

After implementing either solution:

1. Restart your Spring Boot application
2. Try making a payment from your frontend application
3. Check the browser's developer console for any CORS-related errors

If you implemented the frontend workaround, you should no longer see CORS errors. However, it's still recommended to implement the proper backend solution for a more robust and secure application.