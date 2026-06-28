/**
 * @fileoverview Shared domain enums used across the founderIQ platform.
 *
 * These enums define the valid states and categories for core business entities.
 * They are shared across services in the monorepo via the `@founderiq/database` package
 * and correspond to Prisma enum types in the database schema.
 */

/** Organisation classification for the platform. */
enum OrganizationType {
  Venture_Capital,
  Angel_Network,
  Accelerator,
  Others,
}

/** Role a user holds within an organisation. Controls authorisation levels. */
enum UserRole {
  /** Full ownership access — can manage org settings, billing, members. */
  OWNER,
  /** Administrative access — can manage users, view all data. */
  ADMIN,
  /** Standard analyst — can view and create analyses. */
  ANALYST,
}

/** Stages in a startup's evaluation pipeline. */
enum StartupStatus {
  /** Newly added, not yet analysed. */
  NEW,
  /** Analysis in progress. */
  ANALYZING,
  /** Founder interview phase. */
  INTERVIEWING,
  /** Under review by investment committee. */
  REVIEW,
  /** Evaluation completed. */
  COMPLETED,
  /** Passed on (not invested). */
  PASSED,
  /** Investment made. */
  INVESTED,
}

/** Status of a file/document upload process. */
enum uploadStatus {
  /** Upload queued or in progress. */
  PENDING,
  /** File is being uploaded to storage. */
  UPLOADING,
  /** File received, being processed (e.g., OCR, parsing). */
  PROCESSING,
  /** Processing finished successfully. */
  COMPLETE,
  /** Upload or processing failed. */
  FAILED,
}

/** Status of an interview with a founder. */
enum InterviewStatus {
  /** Interview scheduled, not yet started. */
  PENDING,
  /** Interview is currently taking place. */
  IN_PROGRESS,
  /** Interview finished. */
  COMPLETED,
}

/** Status of a user session. */
enum SessionStatus {
  /** Session created, awaiting activity. */
  PENDING,
  /** Session is active. */
  IN_PROGRESS,
  /** Session completed successfully. */
  COMPLETED,
  /** Session TTL expired. */
  EXPIRED,
}

/** Status of a candidate through the analysis pipeline. */
enum CandidateStatus {
  /** Application received, not yet processed. */
  RECIEVED,
  /** Analysis in progress. */
  ANALYZING,
  /** Analysis complete, awaiting next step. */
  ANALYZED,
  /** Interview has been scheduled. */
  INTERVIEW_SCHEDULED,
  /** Currently being interviewed. */
  INTERVIEW_IN_PROGRESS,
  /** Pipeline completed. */
  COMPLETED,
  /** Candidate did not pass. */
  FAILED,
}

/** Categories of analysis performed on a startup. */
enum AnalysisType {
  MARKET,
  COMPETITOR,
  FOUNDER,
  EXECUTION,
  BUSINESS_MODEL,
  RISK,
}
