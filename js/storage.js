/**
 * Storage Module for Teli
 * Handles localStorage persistence for movies and user data
 */

const Storage = {
    KEYS: {
        MOVIES: 'teli_movies',
        COMPARISONS: 'teli_comparisons',
        ONBOARDED: 'teli_onboarded',
        STATS: 'teli_stats'
    },

    /**
     * Save movies to localStorage
     * @param {Array} movies - Array of movie objects
     */
    saveMovies(movies) {
        try {
            localStorage.setItem(this.KEYS.MOVIES, JSON.stringify(movies));
        } catch (e) {
            console.error('Error saving movies:', e);
        }
    },

    /**
     * Load movies from localStorage
     * @returns {Array} Array of movie objects
     */
    loadMovies() {
        try {
            const data = localStorage.getItem(this.KEYS.MOVIES);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error loading movies:', e);
            return [];
        }
    },

    /**
     * Add a new movie
     * @param {Object} movie - Movie object with id, title, year, poster, rating, etc.
     */
    addMovie(movie) {
        const movies = this.loadMovies();
        movies.push({
            ...movie,
            addedAt: new Date().toISOString()
        });
        this.saveMovies(movies);
        this.incrementStat('totalMovies');
        return movies;
    },

    /**
     * Update a movie's rating
     * @param {number} movieId - Movie ID
     * @param {number} newRating - New Elo rating
     */
    updateMovieRating(movieId, newRating) {
        const movies = this.loadMovies();
        const movie = movies.find(m => m.id === movieId);
        if (movie) {
            movie.rating = newRating;
            movie.updatedAt = new Date().toISOString();
            this.saveMovies(movies);
        }
        return movies;
    },

    /**
     * Update a movie's notes and tags
     * @param {string} movieId - Movie ID
     * @param {string} notes - Notes text
     * @param {Array} tags - Array of tag strings
     */
    updateMovieNotes(movieId, notes, tags) {
        const movies = this.loadMovies();
        const movie = movies.find(m => m.id === movieId);
        if (movie) {
            movie.notes = notes;
            movie.tags = tags;
            movie.updatedAt = new Date().toISOString();
            this.saveMovies(movies);
        }
        return movies;
    },

    /**
     * Remove a movie
     * @param {number} movieId - Movie ID
     */
    removeMovie(movieId) {
        let movies = this.loadMovies();
        movies = movies.filter(m => m.id !== movieId);
        this.saveMovies(movies);
        return movies;
    },

    /**
     * Check if a movie is already ranked
     * @param {number} movieId - Movie ID
     * @returns {boolean}
     */
    hasMovie(movieId) {
        const movies = this.loadMovies();
        return movies.some(m => m.id === movieId);
    },

    /**
     * Get movie by ID
     * @param {number} movieId - Movie ID
     * @returns {Object|null}
     */
    getMovie(movieId) {
        const movies = this.loadMovies();
        return movies.find(m => m.id === movieId) || null;
    },

    /**
     * Record a comparison
     * @param {Object} comparison - Comparison object
     */
    recordComparison(comparison) {
        try {
            const comparisons = this.loadComparisons();
            comparisons.push({
                ...comparison,
                timestamp: new Date().toISOString()
            });
            localStorage.setItem(this.KEYS.COMPARISONS, JSON.stringify(comparisons));
            this.incrementStat('totalComparisons');
        } catch (e) {
            console.error('Error recording comparison:', e);
        }
    },

    /**
     * Load comparisons from localStorage
     * @returns {Array}
     */
    loadComparisons() {
        try {
            const data = localStorage.getItem(this.KEYS.COMPARISONS);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error loading comparisons:', e);
            return [];
        }
    },

    /**
     * Check if user has completed onboarding
     * @returns {boolean}
     */
    isOnboarded() {
        return localStorage.getItem(this.KEYS.ONBOARDED) === 'true';
    },

    /**
     * Mark onboarding as complete
     */
    completeOnboarding() {
        localStorage.setItem(this.KEYS.ONBOARDED, 'true');
    },

    /**
     * Load stats
     * @returns {Object}
     */
    loadStats() {
        try {
            const data = localStorage.getItem(this.KEYS.STATS);
            return data ? JSON.parse(data) : {
                totalMovies: 0,
                totalComparisons: 0
            };
        } catch (e) {
            return { totalMovies: 0, totalComparisons: 0 };
        }
    },

    /**
     * Increment a stat
     * @param {string} statName - Name of stat to increment
     */
    incrementStat(statName) {
        const stats = this.loadStats();
        stats[statName] = (stats[statName] || 0) + 1;
        localStorage.setItem(this.KEYS.STATS, JSON.stringify(stats));
    },

    /**
     * Export all data as JSON
     * @returns {string} JSON string of all data
     */
    exportData() {
        return JSON.stringify({
            movies: this.loadMovies(),
            comparisons: this.loadComparisons(),
            stats: this.loadStats(),
            exportedAt: new Date().toISOString(),
            version: '1.0'
        }, null, 2);
    },

    /**
     * Import data from JSON
     * @param {string} jsonData - JSON string to import
     * @returns {boolean} Success status
     */
    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);

            if (data.movies && Array.isArray(data.movies)) {
                this.saveMovies(data.movies);
            }

            if (data.comparisons && Array.isArray(data.comparisons)) {
                localStorage.setItem(this.KEYS.COMPARISONS, JSON.stringify(data.comparisons));
            }

            if (data.stats) {
                localStorage.setItem(this.KEYS.STATS, JSON.stringify(data.stats));
            }

            return true;
        } catch (e) {
            console.error('Error importing data:', e);
            return false;
        }
    },

    /**
     * Clear all data
     */
    clearAllData() {
        localStorage.removeItem(this.KEYS.MOVIES);
        localStorage.removeItem(this.KEYS.COMPARISONS);
        localStorage.removeItem(this.KEYS.STATS);
        localStorage.removeItem(this.KEYS.ONBOARDED);
    },

    /**
     * Calculate scores for all movies based on current ratings
     * @returns {Array} Movies with calculated scores
     */
    getMoviesWithScores() {
        const movies = this.loadMovies();

        if (movies.length === 0) return [];

        // Find min and max ratings
        const ratings = movies.map(m => m.rating);
        const minRating = Math.min(...ratings);
        const maxRating = Math.max(...ratings);

        // Calculate scores and sort by rating
        return movies
            .map(movie => ({
                ...movie,
                score: EloRating.ratingToScore(movie.rating, minRating, maxRating),
                scoreClass: EloRating.getScoreClass(
                    EloRating.ratingToScore(movie.rating, minRating, maxRating)
                )
            }))
            .sort((a, b) => b.rating - a.rating);
    },

    /**
     * Get top genres from user's movies
     * @returns {Array} Top genres sorted by count
     */
    getTopGenres() {
        const movies = this.loadMovies();
        const genreCounts = {};

        movies.forEach(movie => {
            if (movie.genres) {
                movie.genres.forEach(genre => {
                    genreCounts[genre] = (genreCounts[genre] || 0) + 1;
                });
            }
        });

        return Object.entries(genreCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([genre, count]) => ({ genre, count }));
    }
};

// Make available globally
window.Storage = Storage;
