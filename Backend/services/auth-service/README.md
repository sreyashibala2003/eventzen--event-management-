# EventZen Auth Service

Spring Boot authentication and user-management microservice for EventZen.

## Features

- JWT access token (RS256) with refresh token cookie flow
- RBAC: SUPER_ADMIN, ADMIN, ORGANIZER, STAFF, ATTENDEE
- Endpoints aligned to PRD: register, login, refresh, logout, forgot/reset password, users CRUD + role assignment
- JWKS endpoint for API Gateway token validation
- Standardized error payload with traceId

## Run

1. Ensure Java 21 and Maven are installed.
2. Start the service:

```bash
mvn spring-boot:run
```

Service URL: `http://localhost:8081`

## Default admin account

- Email: `admin@eventzen.com`
- Password: `Admin@12345`

## Important endpoints

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/change-password`
- `GET /api/v1/auth/me`
- `PUT /api/v1/auth/me`
- `POST /api/v1/auth/introspect`

## Configuration

Environment overrides:

- `SERVER_PORT` default `8081`
- `DB_URL` default in-memory H2
- `DB_USERNAME`, `DB_PASSWORD`, `DB_DRIVER`
- `ALLOWED_ORIGINS` default `http://localhost:5173`

Use MySQL by setting:

```text
DB_URL=jdbc:mysql://localhost:3306/eventzen_auth
DB_USERNAME=root
DB_PASSWORD=your_password
DB_DRIVER=com.mysql.cj.jdbc.Driver
```
