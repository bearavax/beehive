/**
 * Elo Rating System for Beehive Wellington
 * 
 * This algorithm updates ratings based on vote outcomes where:
 * - Each vote is treated as a "match" between the selected option and all other options
 * - The selected option "wins" against all non-selected options
 * - Rating changes are calculated based on expected vs actual outcomes
 */

const K_FACTOR = 32; // Standard K-factor for Elo rating system
const DEFAULT_RATING = 1200; // Starting rating for new options

/**
 * Calculate expected score for player A against player B
 * @param ratingA - Rating of player A
 * @param ratingB - Rating of player B
 * @returns Expected score (0-1)
 */
function calculateExpectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * Update Elo rating based on match result
 * @param currentRating - Current rating of the player
 * @param expectedScore - Expected score (0-1)
 * @param actualScore - Actual score (0 for loss, 0.5 for draw, 1 for win)
 * @param kFactor - K-factor for rating sensitivity
 * @returns New rating
 */
function updateRating(
  currentRating: number, 
  expectedScore: number, 
  actualScore: number, 
  kFactor: number = K_FACTOR
): number {
  return currentRating + kFactor * (actualScore - expectedScore);
}

/**
 * Process a vote and calculate new Elo ratings for all options
 * @param selectedOptionId - ID of the option that received the vote
 * @param optionsWithRatings - Array of all options with their current ratings
 * @returns Updated ratings for all options
 */
export function processVoteEloUpdate(
  selectedOptionId: number,
  optionsWithRatings: Array<{ id: number; elo_rating: number }>
): Array<{ id: number; newRating: number }> {
  const updates: Array<{ id: number; newRating: number }> = [];
  
  // Find the selected option
  const selectedOption = optionsWithRatings.find(opt => opt.id === selectedOptionId);
  if (!selectedOption) {
    throw new Error('Selected option not found');
  }
  
  // Calculate rating changes for all options
  optionsWithRatings.forEach(option => {
    if (option.id === selectedOptionId) {
      // This option was voted for - it "wins" against all others
      let totalRatingChange = 0;
      
      optionsWithRatings.forEach(opponent => {
        if (opponent.id !== option.id) {
          const expectedScore = calculateExpectedScore(option.elo_rating, opponent.elo_rating);
          const ratingChange = K_FACTOR * (1 - expectedScore); // 1 = win
          totalRatingChange += ratingChange;
        }
      });
      
      // Average the rating change across all opponents
      const avgRatingChange = totalRatingChange / (optionsWithRatings.length - 1);
      updates.push({
        id: option.id,
        newRating: Math.max(option.elo_rating + avgRatingChange, 600) // Minimum rating floor
      });
    } else {
      // This option was not voted for - it "loses" to the selected option
      const expectedScore = calculateExpectedScore(option.elo_rating, selectedOption.elo_rating);
      const ratingChange = K_FACTOR * (0 - expectedScore); // 0 = loss
      
      updates.push({
        id: option.id,
        newRating: Math.max(option.elo_rating + ratingChange, 600) // Minimum rating floor
      });
    }
  });
  
  return updates;
}

/**
 * Calculate win probability between two options
 * @param ratingA - Rating of option A
 * @param ratingB - Rating of option B
 * @returns Probability that A beats B (0-1)
 */
export function calculateWinProbability(ratingA: number, ratingB: number): number {
  return calculateExpectedScore(ratingA, ratingB);
}

/**
 * Get relative strength category based on Elo rating
 * @param rating - Elo rating
 * @returns Strength category string
 */
export function getRatingCategory(rating: number): string {
  if (rating >= 1800) return 'Legendary';
  if (rating >= 1600) return 'Excellent';
  if (rating >= 1400) return 'Very Good';
  if (rating >= 1200) return 'Good';
  if (rating >= 1000) return 'Average';
  return 'Developing';
}

/**
 * Calculate rating change for a hypothetical vote
 * Used for showing users the potential impact of their vote
 * @param selectedRating - Rating of the option being voted for
 * @param otherRatings - Ratings of all other options
 * @returns Estimated rating change for the selected option
 */
export function estimateRatingChange(
  selectedRating: number,
  otherRatings: number[]
): number {
  let totalChange = 0;
  
  otherRatings.forEach(opponentRating => {
    const expectedScore = calculateExpectedScore(selectedRating, opponentRating);
    totalChange += K_FACTOR * (1 - expectedScore);
  });
  
  return totalChange / otherRatings.length;
}

export { DEFAULT_RATING, K_FACTOR };