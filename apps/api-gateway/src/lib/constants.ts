enum OrganizationType {
  Venture_Capital,
  Angel_Network,
  Accelerator,
  Others,
}

enum UserRole {
  OWNER,
  ADMIN,
  ANALYST,
}

enum StartupStatus {
  NEW,
  ANALYZING,
  INTERVIEWING,
  REVIEW,
  COMPLETED,
  PASSED,
  INVESTED,
}

enum uploadStatus {
  PENDING,
  UPLOADING,
  PROCESSING,
  COMPLETE,
  FAILED,
}

enum InterviewStatus {
  PENDING,
  IN_PROGRESS,
  COMPLETED,
}

enum SessionStatus {
  PENDING,
  IN_PROGRESS,
  COMPLETED,
  EXPIRED,
}

enum CandidateStatus {
  RECIEVED,
  ANALYZING,
  ANALYZED,
  INTERVIEW_SCHEDULED,
  INTERVIEW_IN_PROGRESS,
  COMPLETED,
  FAILED,
}

enum AnalysisType {
  MARKET,
  COMPETITOR,
  FOUNDER,
  EXECUTION,
  BUSINESS_MODEL,
  RISK,
}