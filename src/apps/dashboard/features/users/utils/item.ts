import type { ParentalRating } from '@jellyfin/sdk/lib/generated-client/models/parental-rating';

export function groupRating(parentalRatings: ParentalRating[]) {
    const ratings: ParentalRating[] = [{ Name: 'None', Value: undefined }];

    for (const parentalRating of parentalRatings) {
        const rating: ParentalRating = {
            Name: parentalRating.Name,
            Value:
                parentalRating.Value !== undefined ?
                    parentalRating.Value :
                    null
        };

        const existingRating = ratings.find((r) => r.Value === rating.Value);
        if (existingRating) {
            existingRating.Name += '/' + rating.Name;
        } else {
            ratings.push(rating);
        }
    }

    return ratings;
}
