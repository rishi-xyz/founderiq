/**
 * Organization classification for investment firms.
 *
 * Mirrors the `OrganizationType` enum in `prisma/schema.prisma`.
 * Used to categorize firms during registration.
 *
 * @remarks Values use PascalCase to match database conventions.
 */
enum OrganizationType {
  Venture_Capital,
  Angel_Network,
  Accelerator,
  Others,
}

/**
 * Role assigned to a user within an organization.
 *
 * Mirrors the `UserRole` enum in `prisma/schema.prisma`.
 * Determines permission levels across the platform.
 *
 * @remarks OWNER has full access, ADMIN has management access,
 * ANALYST has read and analysis access.
 */
enum UserRole {
  OWNER,
  ADMIN,
  ANALYST,
}

/**
 * Lifecycle status of a startup within the pipeline.
 *
 * Mirrors the `StartupStatus` enum in `prisma/schema.prisma`.
 * Tracks the startup from entry through evaluation to investment decision.
 *
 * @remarks Startups progress sequentially: NEW → ANALYZING → INTERVIEWING
 * → REVIEW → COMPLETED / PASSED / INVESTED.
 */
enum StartupStatus {
  NEW,
  ANALYZING,
  INTERVIEWING,
  REVIEW,
  COMPLETED,
  PASSED,
  INVESTED,
}

/**
 * Upload progress state for documents.
 *
 * Mirrors the `uploadStatus` enum in `prisma/schema.prisma`.
 *
 * @remarks Tracks the lifecycle of a file upload: PENDING → UPLOADING
 * → PROCESSING → COMPLETE, or FAILED on error.
 */
enum uploadStatus {
  PENDING,
  UPLOADING,
  PROCESSING,
  COMPLETE,
  FAILED,
}

/**
 * Current state of an interview for a startup.
 *
 * Mirrors the `InterviewStatus` enum in `prisma/schema.prisma`.
 *
 * @remarks An interview is PENDING until the first session starts,
 * IN_PROGRESS while sessions are active, and COMPLETED when all
 * sessions are done.
 */
enum InterviewStatus {
  PENDING,
  IN_PROGRESS,
  COMPLETED,
}

/**
 * Lifecycle state of an individual interview session.
 *
 * Mirrors the `SessionStatus` enum in `prisma/schema.prisma`.
 *
 * @remarks Sessions are PENDING until the candidate joins, then become
 * IN_PROGRESS, and either COMPLETED or EXPIRED.
 */
enum SessionStatus {
  PENDING,
  IN_PROGRESS,
  COMPLETED,
  EXPIRED,
}

/**
 * Screening and interview pipeline state for a candidate.
 *
 * Mirrors the `CandidateStatus` enum in `prisma/schema.prisma`.
 * Tracks a candidate from initial application through analysis and
 * interview to final decision.
 *
 * @remarks Progression: RECIEVED → ANALYZING → ANALYZED →
 * INTERVIEW_SCHEDULED → INTERVIEW_IN_PROGRESS → COMPLETED / FAILED.
 */
enum CandidateStatus {
  RECIEVED,
  ANALYZING,
  ANALYZED,
  INTERVIEW_SCHEDULED,
  INTERVIEW_IN_PROGRESS,
  COMPLETED,
  FAILED,
}

/**
 * Dimension of analysis performed on a startup.
 *
 * Mirrors the `AnalysisType` enum in `prisma/schema.prisma`.
 * Each value represents a distinct evaluation axis.
 */
enum AnalysisType {
  MARKET,
  COMPETITOR,
  FOUNDER,
  EXECUTION,
  BUSINESS_MODEL,
  RISK,
}