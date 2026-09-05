export type ReviewSourceType = 'gbp' | 'places' | 'manual' | 'fixture';

export interface RawReview {
  externalReviewId: string;
  reviewerName: string | null;
  starRating: number;
  comment: string | null;
  reviewCreatedAt: string | null;
  source: ReviewSourceType;
}

export interface ReviewSource {
  readonly type: ReviewSourceType;
  fetchReviews(locationId: string, googlePlaceId?: string | null): Promise<RawReview[]>;
}
