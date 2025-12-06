import { Answer } from '../types/qa';

export class AnswerModel implements Answer {
  constructor(
    public id: string,
    public text: string,
    public evidence: string
  ) {}

  static fromData(data: { id: string; answer: string; evidence: string }): AnswerModel {
    return new AnswerModel(data.id, data.answer, data.evidence);
  }
}
