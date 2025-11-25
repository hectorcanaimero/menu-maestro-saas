import { Star } from "lucide-react";

interface StoreRatingProps {
  /**
   * Average rating (0-5)
   * NOTE: This is a MOCK/PLACEHOLDER value until Issue #32 (Reviews/Ratings) is implemented
   */
  rating?: number;
  /**
   * Total number of reviews
   * NOTE: This is a MOCK/PLACEHOLDER value until Issue #32 (Reviews/Ratings) is implemented
   */
  reviewCount?: number;
  /**
   * Display mode: compact (just stars + number) or full (stars + number + review count)
   */
  variant?: "compact" | "full";
  /**
   * Size of the stars and text
   */
  size?: "sm" | "md" | "lg";
}

/**
 * StoreRating Component
 *
 * Displays a mock store rating with star icons and numeric value.
 * This component uses PLACEHOLDER data until Issue #32 (Add Product Reviews and Ratings) is implemented.
 *
 * After Issue #32 is completed, this component needs to be updated to:
 * - Fetch real rating data from the database
 * - Add click handler to show reviews modal
 * - Display actual review count
 * - Show appropriate message when no reviews exist yet
 *
 * @param rating - Mock average rating (default: 4.7)
 * @param reviewCount - Mock review count (default: 124)
 * @param variant - Display mode: compact or full
 * @param size - Size of stars and text: sm, md, or lg
 */
export function StoreRating({
  rating = 4.7,
  reviewCount = 124,
  variant = "compact",
  size = "md"
}: StoreRatingProps) {
  const starSize = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5"
  }[size];

  const textSize = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  }[size];

  const ratingTextSize = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg"
  }[size];

  // Calculate filled and empty stars
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-2">
      {/* Star Icons */}
      <div className="flex items-center gap-0.5">
        {/* Full Stars */}
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star
            key={`full-${i}`}
            className={`${starSize} fill-yellow-400 text-yellow-400`}
          />
        ))}

        {/* Half Star */}
        {hasHalfStar && (
          <div className="relative">
            <Star className={`${starSize} text-gray-300`} />
            <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
              <Star className={`${starSize} fill-yellow-400 text-yellow-400`} />
            </div>
          </div>
        )}

        {/* Empty Stars */}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star
            key={`empty-${i}`}
            className={`${starSize} text-gray-300`}
          />
        ))}
      </div>

      {/* Rating Number */}
      <span className={`${ratingTextSize} font-semibold text-foreground`}>
        {rating.toFixed(1)}
      </span>

      {/* Review Count (only in full variant) */}
      {variant === "full" && (
        <span className={`${textSize} text-muted-foreground`}>
          ({reviewCount} reseñas)
        </span>
      )}
    </div>
  );
}
