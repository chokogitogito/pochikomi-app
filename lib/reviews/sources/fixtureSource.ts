import { ReviewSource, RawReview } from '../reviewSource';
import { GBP_FIXTURE_REVIEWS } from '@/lib/integrations/google';

export class FixtureReviewSource implements ReviewSource {
  readonly type = 'fixture' as const;

  async fetchReviews(_locationId: string): Promise<RawReview[]> {
    void _locationId;
    return GBP_FIXTURE_REVIEWS.map((item) => ({
      externalReviewId: item.reviewId,
      reviewerName: item.reviewer,
      starRating: item.starRating,
      comment: item.comment,
      reviewCreatedAt: item.createTime,
      source: 'fixture',
    }));
  }
}
