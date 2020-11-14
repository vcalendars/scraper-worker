export class TeamestError extends Error {
  public message: string;
  public context: unknown;

  constructor(message: string, context?: unknown) {
    super();
    this.message = message;
    this.context = context;
  }
}
export class ScrapeError extends TeamestError {}
