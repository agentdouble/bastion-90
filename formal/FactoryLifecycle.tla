--------------------------- MODULE FactoryLifecycle ---------------------------
EXTENDS Naturals, Sequences

CONSTANTS
  MaxAttempts,
  MaxRevertBasisPoints,
  StandardQuorum,
  CriticalQuorum

VARIABLES
  phase,
  attemptsOnPremise,
  constraintsPassed,
  boundariesPassed,
  testsPassed,
  artifactEmitted,
  isCriticalPath,
  authorId,
  validIndependentReviews,
  reviewMatchesDiff,
  revertBasisPoints,
  merged

vars == <<
  phase,
  attemptsOnPremise,
  constraintsPassed,
  boundariesPassed,
  testsPassed,
  artifactEmitted,
  isCriticalPath,
  authorId,
  validIndependentReviews,
  reviewMatchesDiff,
  revertBasisPoints,
  merged
>>

Phases == {
  "Plan",
  "Implement",
  "Review",
  "Verify",
  "AttackPremise",
  "AutoMergeGate",
  "Merged",
  "Halted"
}

Init ==
  /\ phase = "Plan"
  /\ attemptsOnPremise = 0
  /\ constraintsPassed = FALSE
  /\ boundariesPassed = FALSE
  /\ testsPassed = FALSE
  /\ artifactEmitted = FALSE
  /\ isCriticalPath \in BOOLEAN
  /\ authorId = 1
  /\ validIndependentReviews = 0
  /\ reviewMatchesDiff = FALSE
  /\ revertBasisPoints = 0
  /\ merged = FALSE

CircuitBreakerOpen == revertBasisPoints > MaxRevertBasisPoints
RequiredQuorum == IF isCriticalPath THEN CriticalQuorum ELSE StandardQuorum
QuorumMet == validIndependentReviews >= RequiredQuorum /\ reviewMatchesDiff

StartImplement ==
  /\ phase = "Plan"
  /\ phase' = "Implement"
  /\ validIndependentReviews' = 0
  /\ reviewMatchesDiff' = FALSE
  /\ UNCHANGED <<attemptsOnPremise, constraintsPassed, boundariesPassed, testsPassed, artifactEmitted, isCriticalPath, authorId, revertBasisPoints, merged>>

SubmitForReview ==
  /\ phase = "Implement"
  /\ phase' = "Review"
  /\ validIndependentReviews' = 0
  /\ reviewMatchesDiff' = TRUE
  /\ UNCHANGED <<attemptsOnPremise, constraintsPassed, boundariesPassed, testsPassed, artifactEmitted, isCriticalPath, authorId, revertBasisPoints, merged>>

RecordIndependentReview ==
  /\ phase = "Review"
  /\ validIndependentReviews < CriticalQuorum
  /\ validIndependentReviews' = validIndependentReviews + 1
  /\ UNCHANGED <<phase, attemptsOnPremise, constraintsPassed, boundariesPassed, testsPassed, artifactEmitted, isCriticalPath, authorId, reviewMatchesDiff, revertBasisPoints, merged>>

StartVerify ==
  /\ phase = "Review"
  /\ QuorumMet
  /\ phase' = "Verify"
  /\ UNCHANGED <<attemptsOnPremise, constraintsPassed, boundariesPassed, testsPassed, artifactEmitted, isCriticalPath, authorId, validIndependentReviews, reviewMatchesDiff, revertBasisPoints, merged>>

ReviewRejectLoopback ==
  /\ phase = "Review"
  /\ attemptsOnPremise + 1 < MaxAttempts
  /\ phase' = "Implement"
  /\ attemptsOnPremise' = attemptsOnPremise + 1
  /\ validIndependentReviews' = 0
  /\ reviewMatchesDiff' = FALSE
  /\ UNCHANGED <<constraintsPassed, boundariesPassed, testsPassed, artifactEmitted, isCriticalPath, authorId, revertBasisPoints, merged>>

VerifyPass ==
  /\ phase = "Verify"
  /\ phase' = "AutoMergeGate"
  /\ constraintsPassed' = TRUE
  /\ boundariesPassed' = TRUE
  /\ testsPassed' = TRUE
  /\ artifactEmitted' = TRUE
  /\ UNCHANGED <<attemptsOnPremise, isCriticalPath, authorId, validIndependentReviews, reviewMatchesDiff, revertBasisPoints, merged>>

VerifyFailLoopback ==
  /\ phase = "Verify"
  /\ attemptsOnPremise + 1 < MaxAttempts
  /\ phase' = "Implement"
  /\ attemptsOnPremise' = attemptsOnPremise + 1
  /\ constraintsPassed' = FALSE
  /\ boundariesPassed' = FALSE
  /\ testsPassed' = FALSE
  /\ artifactEmitted' = TRUE
  /\ validIndependentReviews' = 0
  /\ reviewMatchesDiff' = FALSE
  /\ UNCHANGED <<isCriticalPath, authorId, revertBasisPoints, merged>>

VerifyFailAttackPremise ==
  /\ phase = "Verify"
  /\ attemptsOnPremise + 1 >= MaxAttempts
  /\ phase' = "AttackPremise"
  /\ attemptsOnPremise' = attemptsOnPremise + 1
  /\ constraintsPassed' = FALSE
  /\ boundariesPassed' = FALSE
  /\ testsPassed' = FALSE
  /\ artifactEmitted' = TRUE
  /\ validIndependentReviews' = 0
  /\ reviewMatchesDiff' = FALSE
  /\ UNCHANGED <<isCriticalPath, authorId, revertBasisPoints, merged>>

ResetWithNewPremise ==
  /\ phase = "AttackPremise"
  /\ phase' = "Plan"
  /\ attemptsOnPremise' = 0
  /\ UNCHANGED <<constraintsPassed, boundariesPassed, testsPassed, artifactEmitted, isCriticalPath, authorId, validIndependentReviews, reviewMatchesDiff, revertBasisPoints, merged>>

ApproveAutoMerge ==
  /\ phase = "AutoMergeGate"
  /\ constraintsPassed = TRUE
  /\ boundariesPassed = TRUE
  /\ testsPassed = TRUE
  /\ artifactEmitted = TRUE
  /\ QuorumMet
  /\ ~CircuitBreakerOpen
  /\ phase' = "Merged"
  /\ merged' = TRUE
  /\ UNCHANGED <<attemptsOnPremise, constraintsPassed, boundariesPassed, testsPassed, artifactEmitted, isCriticalPath, authorId, validIndependentReviews, reviewMatchesDiff, revertBasisPoints>>

HaltOnCircuitBreaker ==
  /\ phase = "AutoMergeGate"
  /\ CircuitBreakerOpen
  /\ phase' = "Halted"
  /\ UNCHANGED <<attemptsOnPremise, constraintsPassed, boundariesPassed, testsPassed, artifactEmitted, isCriticalPath, authorId, validIndependentReviews, reviewMatchesDiff, revertBasisPoints, merged>>

Next ==
  \/ StartImplement
  \/ SubmitForReview
  \/ RecordIndependentReview
  \/ StartVerify
  \/ ReviewRejectLoopback
  \/ VerifyPass
  \/ VerifyFailLoopback
  \/ VerifyFailAttackPremise
  \/ ResetWithNewPremise
  \/ ApproveAutoMerge
  \/ HaltOnCircuitBreaker

TypeOK ==
  /\ phase \in Phases
  /\ attemptsOnPremise \in 0..MaxAttempts
  /\ constraintsPassed \in BOOLEAN
  /\ boundariesPassed \in BOOLEAN
  /\ testsPassed \in BOOLEAN
  /\ artifactEmitted \in BOOLEAN
  /\ isCriticalPath \in BOOLEAN
  /\ validIndependentReviews \in 0..CriticalQuorum
  /\ reviewMatchesDiff \in BOOLEAN
  /\ merged \in BOOLEAN

NoUnverifiedMerge ==
  merged => (constraintsPassed /\ boundariesPassed /\ testsPassed /\ artifactEmitted)

ReviewBoundToDiff ==
  merged => (reviewMatchesDiff /\ validIndependentReviews >= RequiredQuorum)

CriticalPathQuorum ==
  (merged /\ isCriticalPath) => (validIndependentReviews >= CriticalQuorum)

CircuitBreakerSafety ==
  merged => ~CircuitBreakerOpen

Spec == Init /\ [][Next]_vars

=============================================================================
