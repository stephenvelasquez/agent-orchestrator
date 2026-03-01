/**
 * Circuit breaker for agent failure detection.
 * Prevents agents from looping on errors indefinitely.
 *
 * States:
 * - Closed: normal operation
 * - Open: failures exceeded threshold, agent stopped
 * - Half-Open: testing if recovery is possible
 */
export type CircuitState = 'closed' | 'open' | 'half_open';

export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;

  constructor(
    private readonly failureThreshold: number = 3,
    private readonly recoveryTimeMs: number = 30000,
    private readonly halfOpenSuccessThreshold: number = 2,
  ) {}

  /**
   * Record a successful operation.
   */
  recordSuccess(): void {
    if (this.state === 'half_open') {
      this.successCount++;
      if (this.successCount >= this.halfOpenSuccessThreshold) {
        this.state = 'closed';
        this.failureCount = 0;
        this.successCount = 0;
      }
    } else {
      this.failureCount = 0;
    }
  }

  /**
   * Record a failed operation.
   */
  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'open';
    }
  }

  /**
   * Check if the circuit allows the next operation.
   */
  isAllowed(): boolean {
    if (this.state === 'closed') return true;

    if (this.state === 'open') {
      // Check if recovery time has elapsed
      if (Date.now() - this.lastFailureTime > this.recoveryTimeMs) {
        this.state = 'half_open';
        this.successCount = 0;
        return true;
      }
      return false;
    }

    // half_open: allow cautiously
    return true;
  }

  getState(): CircuitState { return this.state; }
  getFailureCount(): number { return this.failureCount; }
}
