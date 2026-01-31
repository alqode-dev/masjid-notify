/**
 * Structured logging utility for cron jobs
 *
 * Provides JSON-formatted logs with start time, end time, duration,
 * message counts, and error context for easy parsing and monitoring.
 */

export interface CronLogContext {
  job: string;
  startTime: Date;
  messagesSent: number;
  errors: CronLogError[];
  metadata?: Record<string, unknown>;
}

export interface CronLogError {
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
}

export interface CronLogResult {
  job: string;
  status: "success" | "partial" | "error";
  startTime: string;
  endTime: string;
  durationMs: number;
  messagesSent: number;
  errors: CronLogError[];
  metadata?: Record<string, unknown>;
}

/**
 * Creates a new cron job logger context
 */
export function createCronLogger(jobName: string): CronLogContext {
  return {
    job: jobName,
    startTime: new Date(),
    messagesSent: 0,
    errors: [],
  };
}

/**
 * Logs an error with context during cron execution
 */
export function logCronError(
  ctx: CronLogContext,
  message: string,
  context?: Record<string, unknown>
): void {
  const error: CronLogError = {
    message,
    timestamp: new Date().toISOString(),
    ...(context && { context }),
  };
  ctx.errors.push(error);

  // Also log to console with JSON format for immediate visibility
  console.error(
    JSON.stringify({
      level: "error",
      job: ctx.job,
      message,
      context,
      timestamp: error.timestamp,
    })
  );
}

/**
 * Increments the sent message counter
 */
export function incrementMessageCount(ctx: CronLogContext, count: number = 1): void {
  ctx.messagesSent += count;
}

/**
 * Sets additional metadata for the log
 */
export function setCronMetadata(
  ctx: CronLogContext,
  metadata: Record<string, unknown>
): void {
  ctx.metadata = { ...ctx.metadata, ...metadata };
}

/**
 * Finalizes the cron job log and outputs structured JSON
 */
export function finalizeCronLog(ctx: CronLogContext): CronLogResult {
  const endTime = new Date();
  const durationMs = endTime.getTime() - ctx.startTime.getTime();

  let status: CronLogResult["status"] = "success";
  if (ctx.errors.length > 0) {
    status = ctx.messagesSent > 0 ? "partial" : "error";
  }

  const result: CronLogResult = {
    job: ctx.job,
    status,
    startTime: ctx.startTime.toISOString(),
    endTime: endTime.toISOString(),
    durationMs,
    messagesSent: ctx.messagesSent,
    errors: ctx.errors,
    ...(ctx.metadata && { metadata: ctx.metadata }),
  };

  // Log the final result as structured JSON
  console.log(JSON.stringify(result));

  return result;
}
