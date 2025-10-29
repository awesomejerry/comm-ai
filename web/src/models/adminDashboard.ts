/**
 * Admin Dashboard State Model
 *
 * Represents the state of the admin dashboard view.
 */

import { EvaluationResult } from './evaluation';

export interface AdminDashboardState {
  evaluations: EvaluationResult[];
  totalCount: number;
  loading: boolean;
  error: Error | null;
  sortOrder: 'asc' | 'desc';
  selectedEvaluation: EvaluationResult | null;
}

export const initialAdminDashboardState: AdminDashboardState = {
  evaluations: [],
  totalCount: 0,
  loading: false,
  error: null,
  sortOrder: 'desc', // Newest first by default
  selectedEvaluation: null,
};
