import { RawReview } from '../reviewSource';
import { generateManualReviewId } from '../reviewRef';
import { sanitizeReviewComment } from '../sanitize';

export interface ManualReviewInput {
  locationId: string;
  reviewerName?: string | null;
  starRating: number;
  comment?: string | null;
  reviewCreatedAt?: string | null;
}

export function createManualReview(input: ManualReviewInput): RawReview {
  const safeComment = sanitizeReviewComment(input.comment);
  const safeName = (input.reviewerName || '').trim() || null;
  const createdAt = input.reviewCreatedAt ? new Date(input.reviewCreatedAt).toISOString() : new Date().toISOString();

  const externalReviewId = generateManualReviewId({
    locationId: input.locationId,
    reviewerName: safeName,
    reviewCreatedAt: createdAt.slice(0, 10), // 日付単位でハッシュ化
    comment: safeComment,
  });

  return {
    externalReviewId,
    reviewerName: safeName,
    starRating: Math.min(5, Math.max(1, Math.round(input.starRating || 5))),
    comment: safeComment || null,
    reviewCreatedAt: createdAt,
    source: 'manual',
  };
}
