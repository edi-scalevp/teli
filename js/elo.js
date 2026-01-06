/**
 * Elo Rating System for Teli
 * Adapted from chess Elo system for movie comparisons
 */

const EloRating = {
    // K-factor determines how much ratings change after each comparison
    // Higher K = more volatile ratings
    K_FACTOR: 32,

    // Base rating for new movies
    BASE_RATING: 1500,

    /**
     * Calculate expected score (probability of winning)
     * @param {number} ratingA - Rating of movie A
     * @param {number} ratingB - Rating of movie B
     * @returns {number} Expected score between 0 and 1
     */
    getExpectedScore(ratingA, ratingB) {
        return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
    },

    /**
     * Calculate new ratings after a comparison
     * @param {number} ratingA - Current rating of movie A (the new movie being rated)
     * @param {number} ratingB - Current rating of movie B (the existing movie)
     * @param {number} scoreA - Actual score for A (1 = win/prefer A, 0.5 = draw, 0 = loss/prefer B)
     * @returns {Object} New ratings for both movies
     */
    calculateNewRatings(ratingA, ratingB, scoreA) {
        const expectedA = this.getExpectedScore(ratingA, ratingB);
        const expectedB = 1 - expectedA;
        const scoreB = 1 - scoreA;

        let newRatingA = Math.round(ratingA + this.K_FACTOR * (scoreA - expectedA));
        let newRatingB = Math.round(ratingB + this.K_FACTOR * (scoreB - expectedB));

        // Enforce preference constraint: if user prefers A, A must rank >= B
        // This makes rankings feel more intuitive for movie comparisons
        if (scoreA === 1 && newRatingA < newRatingB) {
            // User said A is better, so A should be ranked higher
            const avg = Math.round((newRatingA + newRatingB) / 2);
            newRatingA = avg + 1;
            newRatingB = avg - 1;
        } else if (scoreA === 0 && newRatingA > newRatingB) {
            // User said B is better, so B should be ranked higher
            const avg = Math.round((newRatingA + newRatingB) / 2);
            newRatingA = avg - 1;
            newRatingB = avg + 1;
        }

        return {
            ratingA: Math.max(100, newRatingA),
            ratingB: Math.max(100, newRatingB)
        };
    },

    /**
     * Convert Elo rating to a 1-10 display score
     * Based on the user's range of ratings
     * @param {number} rating - Elo rating
     * @param {number} minRating - Minimum rating in user's collection
     * @param {number} maxRating - Maximum rating in user's collection
     * @returns {number} Score from 1 to 10
     */
    ratingToScore(rating, minRating, maxRating) {
        if (minRating === maxRating) {
            return 7.5; // Default mid-high score for single movie
        }

        // Map rating to 1-10 scale
        const normalized = (rating - minRating) / (maxRating - minRating);
        const score = 1 + normalized * 9;

        // Round to 1 decimal place
        return Math.round(score * 10) / 10;
    },

    /**
     * Get initial rating based on user's quick rating
     * @param {string} quickRating - 'liked', 'fine', or 'disliked'
     * @param {Array} existingMovies - User's existing movies
     * @returns {number} Initial Elo rating
     */
    getInitialRating(quickRating, existingMovies) {
        if (existingMovies.length === 0) {
            // First movie gets different starting ratings based on opinion
            switch (quickRating) {
                case 'liked': return 1600;
                case 'fine': return 1500;
                case 'disliked': return 1400;
                default: return this.BASE_RATING;
            }
        }

        // Calculate average rating
        const avgRating = existingMovies.reduce((sum, m) => sum + m.rating, 0) / existingMovies.length;

        // Offset based on quick rating
        switch (quickRating) {
            case 'liked': return Math.round(avgRating + 100);
            case 'fine': return Math.round(avgRating);
            case 'disliked': return Math.round(avgRating - 100);
            default: return Math.round(avgRating);
        }
    },

    /**
     * Select movies for comparison using binary search approach
     * Picks movies at strategic rating points for faster convergence
     * @param {Object} newMovie - The new movie being rated
     * @param {Array} existingMovies - User's existing rated movies
     * @param {number} maxComparisons - Maximum number of comparisons
     * @returns {Array} Movies to compare against
     */
    selectComparisonMovies(newMovie, existingMovies, maxComparisons = 5) {
        if (existingMovies.length === 0) return [];

        // Sort by rating
        const sorted = [...existingMovies].sort((a, b) => b.rating - a.rating);

        if (sorted.length <= maxComparisons) {
            return sorted;
        }

        // Binary search style selection - pick movies at different rating levels
        const selected = [];
        const indices = this.getBinarySearchIndices(sorted.length, maxComparisons);

        for (const idx of indices) {
            selected.push(sorted[idx]);
        }

        return selected;
    },

    /**
     * Get indices for binary search style comparison selection
     * @param {number} totalCount - Total number of movies
     * @param {number} selectCount - Number to select
     * @returns {Array} Array of indices
     */
    getBinarySearchIndices(totalCount, selectCount) {
        const indices = [];

        // Always include top and bottom
        if (selectCount >= 1) indices.push(0);
        if (selectCount >= 2) indices.push(totalCount - 1);

        // Add middle points
        if (selectCount >= 3) indices.push(Math.floor(totalCount / 2));
        if (selectCount >= 4) indices.push(Math.floor(totalCount / 4));
        if (selectCount >= 5) indices.push(Math.floor(3 * totalCount / 4));

        // Sort and remove duplicates
        return [...new Set(indices)].sort((a, b) => a - b).slice(0, selectCount);
    },

    /**
     * Get color class for a score
     * @param {number} score - Score from 1-10
     * @returns {string} CSS class name
     */
    getScoreClass(score) {
        if (score >= 8.5) return 'excellent';
        if (score >= 7) return 'good';
        if (score >= 5.5) return 'average';
        if (score >= 4) return 'below';
        return 'poor';
    },

    /**
     * Recalculate all scores based on current ratings
     * Useful when re-normalizing after many comparisons
     * @param {Array} movies - Array of movies with ratings
     * @returns {Array} Movies with updated scores
     */
    recalculateAllScores(movies) {
        if (movies.length === 0) return movies;

        const ratings = movies.map(m => m.rating);
        const minRating = Math.min(...ratings);
        const maxRating = Math.max(...ratings);

        return movies.map(movie => ({
            ...movie,
            score: this.ratingToScore(movie.rating, minRating, maxRating),
            scoreClass: this.getScoreClass(
                this.ratingToScore(movie.rating, minRating, maxRating)
            )
        })).sort((a, b) => b.rating - a.rating);
    },

    /**
     * Calculate confidence level based on number of comparisons
     * @param {number} comparisons - Number of comparisons for this movie
     * @param {number} totalMovies - Total movies in the list
     * @returns {number} Confidence percentage (0-100)
     */
    getConfidence(comparisons, totalMovies) {
        // Perfect confidence would be comparing against every other movie
        const idealComparisons = Math.log2(totalMovies + 1) * 3;
        return Math.min(100, Math.round((comparisons / idealComparisons) * 100));
    }
};

// Make available globally
window.EloRating = EloRating;
