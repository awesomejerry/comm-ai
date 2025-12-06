export interface Question {
  id: string;
  text: string;
}

export interface Answer {
  id: string;
  text: string;
  evidence: string;
}

export interface QASession {
  currentIndex: number;
  revealed: boolean;
  questionIds: string[];
}
