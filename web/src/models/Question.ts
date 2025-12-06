import { Question } from '../types/qa';

export class QuestionModel implements Question {
  constructor(
    public id: string,
    public text: string
  ) {}

  static fromData(data: { id: string; question: string }): QuestionModel {
    return new QuestionModel(data.id, data.question);
  }
}
