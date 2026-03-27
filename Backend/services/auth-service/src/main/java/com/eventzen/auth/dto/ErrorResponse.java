package com.eventzen.auth.dto;

import java.time.Instant;
import java.util.List;

public record ErrorResponse(
    Instant timestamp,
    int status,
    String errorCode,
    String message,
    String traceId,
    String path,
    List<FieldValidationError> validationErrors) {
  public record FieldValidationError(String field, String message) {
  }
}