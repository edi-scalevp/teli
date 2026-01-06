/**
 * Movies API Module for Teli
 * Uses OMDb API (Open Movie Database) which sources from IMDB
 *
 * Get your free API key at: https://www.omdbapi.com/apikey.aspx
 */

const MoviesAPI = {
    // OMDb API configuration
    API_KEY: '51b04bd9', // Your OMDb API key
    BASE_URL: 'https://www.omdbapi.com',

    // Default placeholder poster
    PLACEHOLDER_POSTER: 'data:image/svg+xml,' + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="185" height="278" viewBox="0 0 185 278">
            <rect fill="#252540" width="185" height="278"/>
            <text fill="#71717a" font-family="sans-serif" font-size="48" x="50%" y="50%" text-anchor="middle" dominant-baseline="middle">🎬</text>
        </svg>
    `),

    /**
     * Set the API key
     * @param {string} key - OMDb API key
     */
    setApiKey(key) {
        this.API_KEY = key;
        localStorage.setItem('teli_omdb_key', key);
    },

    /**
     * Load API key from storage (or use default)
     */
    loadApiKey() {
        const storedKey = localStorage.getItem('teli_omdb_key');
        if (storedKey) {
            this.API_KEY = storedKey;
        }
        // Keep the hardcoded key if no stored key
    },

    /**
     * Check if API key is configured
     * @returns {boolean}
     */
    hasApiKey() {
        return this.API_KEY && this.API_KEY.length > 0;
    },

    /**
     * Get poster URL (OMDb provides full URLs)
     * @param {string} posterUrl - Poster URL from OMDb
     * @returns {string} Poster URL or placeholder
     */
    getPosterUrl(posterUrl) {
        if (!posterUrl || posterUrl === 'N/A') return this.PLACEHOLDER_POSTER;
        return posterUrl;
    },

    /**
     * Search for movies
     * @param {string} query - Search query
     * @param {number} page - Page number
     * @returns {Promise<Array>} Array of movie results
     */
    async searchMovies(query, page = 1) {
        if (!query || query.trim().length < 2) return [];

        // If no API key, use demo data
        if (!this.hasApiKey()) {
            return this.getDemoSearchResults(query);
        }

        try {
            const response = await fetch(
                `${this.BASE_URL}/?apikey=${this.API_KEY}&s=${encodeURIComponent(query)}&type=movie&page=${page}`
            );

            if (!response.ok) {
                throw new Error('API request failed');
            }

            const data = await response.json();

            if (data.Response === 'False') {
                return [];
            }

            return data.Search.map(movie => this.transformSearchResult(movie));
        } catch (error) {
            console.error('Error searching movies:', error);
            return this.getDemoSearchResults(query);
        }
    },

    /**
     * Get movie details by IMDB ID
     * @param {string} imdbId - IMDB movie ID (e.g., "tt0111161")
     * @returns {Promise<Object>} Movie details
     */
    async getMovieDetails(imdbId) {
        if (!this.hasApiKey()) {
            return this.getDemoMovie(imdbId);
        }

        try {
            const response = await fetch(
                `${this.BASE_URL}/?apikey=${this.API_KEY}&i=${imdbId}&plot=short`
            );

            if (!response.ok) {
                throw new Error('API request failed');
            }

            const movie = await response.json();

            if (movie.Response === 'False') {
                return null;
            }

            return this.transformMovie(movie);
        } catch (error) {
            console.error('Error getting movie details:', error);
            return null;
        }
    },

    /**
     * Transform OMDb search result to app format
     * @param {Object} movie - OMDb search result
     * @returns {Object} Transformed movie
     */
    transformSearchResult(movie) {
        return {
            id: movie.imdbID,
            imdbId: movie.imdbID,
            title: movie.Title,
            year: movie.Year ? parseInt(movie.Year) : null,
            poster: this.getPosterUrl(movie.Poster),
            type: movie.Type
        };
    },

    /**
     * Transform OMDb full movie to app format
     * @param {Object} movie - OMDb movie object
     * @returns {Object} Transformed movie
     */
    transformMovie(movie) {
        return {
            id: movie.imdbID,
            imdbId: movie.imdbID,
            title: movie.Title,
            year: movie.Year ? parseInt(movie.Year) : null,
            poster: this.getPosterUrl(movie.Poster),
            overview: movie.Plot !== 'N/A' ? movie.Plot : '',
            genres: movie.Genre !== 'N/A' ? movie.Genre.split(', ') : [],
            director: movie.Director !== 'N/A' ? movie.Director : '',
            actors: movie.Actors !== 'N/A' ? movie.Actors : '',
            imdbRating: movie.imdbRating !== 'N/A' ? parseFloat(movie.imdbRating) : null,
            rottenTomatoes: this.getRottenTomatoesRating(movie.Ratings),
            runtime: movie.Runtime !== 'N/A' ? movie.Runtime : ''
        };
    },

    /**
     * Extract Rotten Tomatoes rating from ratings array
     * @param {Array} ratings - OMDb ratings array
     * @returns {string|null} RT rating or null
     */
    getRottenTomatoesRating(ratings) {
        if (!ratings) return null;
        const rt = ratings.find(r => r.Source === 'Rotten Tomatoes');
        return rt ? rt.Value : null;
    },

    /**
     * Demo movies data (popular IMDB movies)
     */
    getDemoMovies() {
        return [
            { id: 'tt0111161', imdbId: 'tt0111161', title: 'The Shawshank Redemption', year: 1994, poster: this.PLACEHOLDER_POSTER, genres: ['Drama'], imdbRating: 9.3 },
            { id: 'tt0068646', imdbId: 'tt0068646', title: 'The Godfather', year: 1972, poster: this.PLACEHOLDER_POSTER, genres: ['Crime', 'Drama'], imdbRating: 9.2 },
            { id: 'tt0468569', imdbId: 'tt0468569', title: 'The Dark Knight', year: 2008, poster: this.PLACEHOLDER_POSTER, genres: ['Action', 'Crime', 'Drama'], imdbRating: 9.0 },
            { id: 'tt0071562', imdbId: 'tt0071562', title: 'The Godfather Part II', year: 1974, poster: this.PLACEHOLDER_POSTER, genres: ['Crime', 'Drama'], imdbRating: 9.0 },
            { id: 'tt0050083', imdbId: 'tt0050083', title: '12 Angry Men', year: 1957, poster: this.PLACEHOLDER_POSTER, genres: ['Crime', 'Drama'], imdbRating: 9.0 },
            { id: 'tt0108052', imdbId: 'tt0108052', title: "Schindler's List", year: 1993, poster: this.PLACEHOLDER_POSTER, genres: ['Biography', 'Drama', 'History'], imdbRating: 9.0 },
            { id: 'tt0167260', imdbId: 'tt0167260', title: 'The Lord of the Rings: The Return of the King', year: 2003, poster: this.PLACEHOLDER_POSTER, genres: ['Action', 'Adventure', 'Drama'], imdbRating: 9.0 },
            { id: 'tt0110912', imdbId: 'tt0110912', title: 'Pulp Fiction', year: 1994, poster: this.PLACEHOLDER_POSTER, genres: ['Crime', 'Drama'], imdbRating: 8.9 },
            { id: 'tt0120737', imdbId: 'tt0120737', title: 'The Lord of the Rings: The Fellowship of the Ring', year: 2001, poster: this.PLACEHOLDER_POSTER, genres: ['Action', 'Adventure', 'Drama'], imdbRating: 8.8 },
            { id: 'tt0109830', imdbId: 'tt0109830', title: 'Forrest Gump', year: 1994, poster: this.PLACEHOLDER_POSTER, genres: ['Drama', 'Romance'], imdbRating: 8.8 },
            { id: 'tt0137523', imdbId: 'tt0137523', title: 'Fight Club', year: 1999, poster: this.PLACEHOLDER_POSTER, genres: ['Drama'], imdbRating: 8.8 },
            { id: 'tt1375666', imdbId: 'tt1375666', title: 'Inception', year: 2010, poster: this.PLACEHOLDER_POSTER, genres: ['Action', 'Adventure', 'Sci-Fi'], imdbRating: 8.8 },
            { id: 'tt0167261', imdbId: 'tt0167261', title: 'The Lord of the Rings: The Two Towers', year: 2002, poster: this.PLACEHOLDER_POSTER, genres: ['Action', 'Adventure', 'Drama'], imdbRating: 8.8 },
            { id: 'tt0080684', imdbId: 'tt0080684', title: 'Star Wars: Episode V - The Empire Strikes Back', year: 1980, poster: this.PLACEHOLDER_POSTER, genres: ['Action', 'Adventure', 'Fantasy'], imdbRating: 8.7 },
            { id: 'tt0133093', imdbId: 'tt0133093', title: 'The Matrix', year: 1999, poster: this.PLACEHOLDER_POSTER, genres: ['Action', 'Sci-Fi'], imdbRating: 8.7 },
            { id: 'tt0099685', imdbId: 'tt0099685', title: 'Goodfellas', year: 1990, poster: this.PLACEHOLDER_POSTER, genres: ['Biography', 'Crime', 'Drama'], imdbRating: 8.7 },
            { id: 'tt0073486', imdbId: 'tt0073486', title: "One Flew Over the Cuckoo's Nest", year: 1975, poster: this.PLACEHOLDER_POSTER, genres: ['Drama'], imdbRating: 8.7 },
            { id: 'tt0114369', imdbId: 'tt0114369', title: 'Se7en', year: 1995, poster: this.PLACEHOLDER_POSTER, genres: ['Crime', 'Drama', 'Mystery'], imdbRating: 8.6 },
            { id: 'tt0816692', imdbId: 'tt0816692', title: 'Interstellar', year: 2014, poster: this.PLACEHOLDER_POSTER, genres: ['Adventure', 'Drama', 'Sci-Fi'], imdbRating: 8.6 },
            { id: 'tt0245429', imdbId: 'tt0245429', title: 'Spirited Away', year: 2001, poster: this.PLACEHOLDER_POSTER, genres: ['Animation', 'Adventure', 'Family'], imdbRating: 8.6 },
            { id: 'tt6751668', imdbId: 'tt6751668', title: 'Parasite', year: 2019, poster: this.PLACEHOLDER_POSTER, genres: ['Drama', 'Thriller'], imdbRating: 8.5 },
            { id: 'tt0482571', imdbId: 'tt0482571', title: 'The Prestige', year: 2006, poster: this.PLACEHOLDER_POSTER, genres: ['Drama', 'Mystery', 'Sci-Fi'], imdbRating: 8.5 },
            { id: 'tt2582802', imdbId: 'tt2582802', title: 'Whiplash', year: 2014, poster: this.PLACEHOLDER_POSTER, genres: ['Drama', 'Music'], imdbRating: 8.5 },
            { id: 'tt0114814', imdbId: 'tt0114814', title: 'The Usual Suspects', year: 1995, poster: this.PLACEHOLDER_POSTER, genres: ['Crime', 'Drama', 'Mystery'], imdbRating: 8.5 },
            { id: 'tt0120689', imdbId: 'tt0120689', title: 'The Green Mile', year: 1999, poster: this.PLACEHOLDER_POSTER, genres: ['Crime', 'Drama', 'Fantasy'], imdbRating: 8.6 },
            { id: 'tt0253474', imdbId: 'tt0253474', title: 'The Pianist', year: 2002, poster: this.PLACEHOLDER_POSTER, genres: ['Biography', 'Drama', 'Music'], imdbRating: 8.5 },
            { id: 'tt0047478', imdbId: 'tt0047478', title: 'Seven Samurai', year: 1954, poster: this.PLACEHOLDER_POSTER, genres: ['Action', 'Drama'], imdbRating: 8.6 },
            { id: 'tt0407887', imdbId: 'tt0407887', title: 'The Departed', year: 2006, poster: this.PLACEHOLDER_POSTER, genres: ['Crime', 'Drama', 'Thriller'], imdbRating: 8.5 },
            { id: 'tt0172495', imdbId: 'tt0172495', title: 'Gladiator', year: 2000, poster: this.PLACEHOLDER_POSTER, genres: ['Action', 'Adventure', 'Drama'], imdbRating: 8.5 },
            { id: 'tt0088763', imdbId: 'tt0088763', title: 'Back to the Future', year: 1985, poster: this.PLACEHOLDER_POSTER, genres: ['Adventure', 'Comedy', 'Sci-Fi'], imdbRating: 8.5 },
        ];
    },

    getDemoSearchResults(query) {
        const allMovies = this.getDemoMovies();
        const lowerQuery = query.toLowerCase();
        return allMovies.filter(m =>
            m.title.toLowerCase().includes(lowerQuery)
        );
    },

    getDemoMovie(id) {
        const movies = this.getDemoMovies();
        return movies.find(m => m.id === id) || null;
    }
};

// Load API key on module load
MoviesAPI.loadApiKey();

// Make available globally
window.MoviesAPI = MoviesAPI;
