import { QASession } from '../types/qa';

export class QASessionModel implements QASession {
  constructor(
    public currentIndex: number,
    public revealed: boolean,
    public questionIds: string[]
  ) {}

  static create(questionIds: string[]): QASessionModel {
    return new QASessionModel(0, false, questionIds);
  }

  next(): void {
    if (this.currentIndex < this.questionIds.length - 1) {
      this.currentIndex++;
      this.revealed = false;
    }
  }

  previous(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.revealed = false;
    }
  }

  reveal(): void {
    this.revealed = true;
  }

  isComplete(): boolean {
    return this.currentIndex === this.questionIds.length - 1 && this.revealed;
  }

  reset(): void {
    this.currentIndex = 0;
    this.revealed = false;
  }
}
