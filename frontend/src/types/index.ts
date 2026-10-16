export type UserRole = 'citizen' | 'admin';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  privacy_blur_location?: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export type CivicCategory = 
  | 'pothole_road_damage'
  | 'garbage_accumulation'
  | 'waterlogging_flooding'
  | 'damaged_infrastructure'
  | 'fallen_tree_obstruction'
  | 'other_uncertain';

export type IncidentStatus = 
  | 'submitted'
  | 'under_review'
  | 'dispatched'
  | 'in_progress'
  | 'resolved'
  | 'rejected';

export type SeverityLevel = 'low' | 'medium' | 'high' | 'unknown';

export interface IncidentImage {
  id: number;
  file_path: string;
  original_filename: string;
  file_size_bytes: number;
  mime_type: string;
  ml_predicted_class?: string;
  ml_confidence?: number;
  class_probabilities?: Record<string, number>;
  created_at: string;
}

export interface Incident {
  id: number;
  title: string;
  description: string;
  category: CivicCategory;
  user_category?: string;
  ml_category?: string;
  ml_confidence?: number;
  severity: SeverityLevel;
  severity_explanation?: string;
  status: IncidentStatus;
  latitude?: number;
  longitude?: number;
  address?: string;
  landmark?: string;
  obstruction_level?: string;
  affected_area_sqm?: number;
  user_id: number;
  is_duplicate_of?: number;
  review_required: boolean;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  images: IncidentImage[];
  reporter?: User;
}

export interface ClassProbability {
  category: string;
  label: string;
  probability: number;
}

export interface ImageAnalysisPreview {
  predicted_category: string;
  category_label: string;
  confidence: number;
  is_low_confidence: boolean;
  review_required: boolean;
  model_version: string;
  class_probabilities: ClassProbability[];
  alternative_predictions: ClassProbability[];
  model_trained: boolean;
}

export interface DuplicateSignalBreakdown {
  text_similarity: number;
  geographic_proximity_score: number;
  category_match_score: number;
  temporal_proximity_score: number;
  image_similarity_score: number;
}

export interface DuplicateMatchCandidate {
  candidate_id: number;
  candidate_title: string;
  candidate_category: string;
  candidate_created_at: string;
  candidate_address?: string;
  candidate_distance_meters?: number;
  composite_score: number;
  confidence_level: 'High' | 'Medium' | 'Low';
  signal_breakdown: DuplicateSignalBreakdown;
  explanation: string;
}

export interface CitationSource {
  document_title: string;
  organization: string;
  section?: string;
  page?: number;
  source_url?: string;
  excerpt: string;
  relevance_score: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  citations?: CitationSource[];
  is_grounded?: boolean;
  grounding_confidence?: string;
  timestamp: string;
}

export interface ComplaintDraft {
  incident_id: number;
  subject: string;
  salutation: string;
  body: string;
  recipient_department: string;
  statutory_sla_days: number;
  statutory_reference: string;
  evidence_checklist: string[];
  disclaimer: string;
}

export interface CategoryStat {
  category: string;
  label: string;
  count: number;
  percentage: number;
}

export interface TrendPoint {
  date: string;
  total_incidents: number;
  resolved_incidents: number;
  potholes: number;
  garbage: number;
  waterlogging: number;
}

export interface HotspotPoint {
  id: number;
  title: string;
  category: string;
  severity: string;
  latitude: number;
  longitude: number;
  address?: string;
  created_at: string;
}

export interface AnalyticsOverview {
  total_incidents: number;
  resolved_incidents: number;
  in_progress_incidents: number;
  pending_review_incidents: number;
  average_resolution_time_hours: number;
  category_distribution: CategoryStat[];
  severity_distribution: Record<string, number>;
  status_distribution: Record<string, number>;
  hotspots: HotspotPoint[];
}

export interface ModelEvaluationResults {
  model_name: string;
  model_version: string;
  architecture: string;
  evaluation_timestamp: string;
  test_dataset_size: number;
  overall_test_accuracy: number;
  macro_precision: number;
  macro_recall: number;
  macro_f1: number;
  baseline_chance_accuracy: number;
  accuracy_gain_over_baseline: number;
  confusion_matrix: number[][];
  classes: string[];
  per_class_metrics: Record<string, {
    display_name: string;
    precision: number;
    recall: number;
    f1_score: number;
    support: number;
  }>;
  training_history: Array<{
    epoch: number;
    train_loss: number;
    train_acc: number;
    val_loss: number;
    val_acc: number;
  }>;
}
