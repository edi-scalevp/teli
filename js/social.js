/**
 * Social Module for Teli
 * Handles user profiles, friends, and social features
 *
 * Note: This is a client-side simulation. For production,
 * connect to a real backend API for multi-user functionality.
 */

const Social = {
    KEYS: {
        PROFILE: 'teli_profile',
        FRIENDS: 'teli_friends',
        FRIEND_DATA: 'teli_friend_data',
        ACTIVITY: 'teli_activity',
        WATCHLIST: 'teli_watchlist'
    },

    /**
     * Get or create user profile
     * @returns {Object} User profile
     */
    getProfile() {
        try {
            const data = localStorage.getItem(this.KEYS.PROFILE);
            if (data) {
                return JSON.parse(data);
            }
            // Create default profile
            const profile = this.createDefaultProfile();
            this.saveProfile(profile);
            return profile;
        } catch (e) {
            console.error('Error loading profile:', e);
            return this.createDefaultProfile();
        }
    },

    /**
     * Create default profile
     * @returns {Object} Default profile
     */
    createDefaultProfile() {
        return {
            id: this.generateUserId(),
            username: 'MovieFan',
            displayName: 'Movie Fan',
            avatar: '🎬',
            bio: '',
            joinedAt: new Date().toISOString(),
            isPublic: true
        };
    },

    /**
     * Generate a unique user ID
     * @returns {string} User ID
     */
    generateUserId() {
        return 'user_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    },

    /**
     * Save user profile
     * @param {Object} profile - Profile object
     */
    saveProfile(profile) {
        try {
            localStorage.setItem(this.KEYS.PROFILE, JSON.stringify(profile));
        } catch (e) {
            console.error('Error saving profile:', e);
        }
    },

    /**
     * Update profile field
     * @param {string} field - Field name
     * @param {*} value - New value
     */
    updateProfile(field, value) {
        const profile = this.getProfile();
        profile[field] = value;
        this.saveProfile(profile);
        return profile;
    },

    /**
     * Get friends list
     * @returns {Array} List of friend IDs
     */
    getFriends() {
        try {
            const data = localStorage.getItem(this.KEYS.FRIENDS);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    },

    /**
     * Add a friend
     * @param {Object} friendProfile - Friend's profile
     */
    addFriend(friendProfile) {
        const friends = this.getFriends();
        if (!friends.some(f => f.id === friendProfile.id)) {
            friends.push({
                id: friendProfile.id,
                username: friendProfile.username,
                displayName: friendProfile.displayName,
                avatar: friendProfile.avatar,
                addedAt: new Date().toISOString()
            });
            localStorage.setItem(this.KEYS.FRIENDS, JSON.stringify(friends));

            // Record activity
            this.recordActivity({
                type: 'friend_added',
                friendId: friendProfile.id,
                friendName: friendProfile.displayName
            });
        }
        return friends;
    },

    /**
     * Remove a friend
     * @param {string} friendId - Friend's user ID
     */
    removeFriend(friendId) {
        let friends = this.getFriends();
        friends = friends.filter(f => f.id !== friendId);
        localStorage.setItem(this.KEYS.FRIENDS, JSON.stringify(friends));
        return friends;
    },

    /**
     * Get friend's movie data (simulated)
     * In production, this would fetch from a server
     * @param {string} friendId - Friend's user ID
     * @returns {Object|null} Friend's movie data
     */
    getFriendMovies(friendId) {
        try {
            const allFriendData = localStorage.getItem(this.KEYS.FRIEND_DATA);
            const data = allFriendData ? JSON.parse(allFriendData) : {};
            return data[friendId] || null;
        } catch (e) {
            return null;
        }
    },

    /**
     * Get demo friends with sample movie data
     * For testing the social features
     * @returns {Array} Demo friends with movie data
     */
    getDemoFriends() {
        return [
            {
                id: 'demo_alex',
                username: 'alex_movies',
                displayName: 'Alex Chen',
                avatar: '🎭',
                bio: 'Indie film enthusiast',
                movies: [
                    { id: 'tt1375666', title: 'Inception', score: 9.2 },
                    { id: 'tt0468569', title: 'The Dark Knight', score: 9.5 },
                    { id: 'tt0137523', title: 'Fight Club', score: 8.8 },
                    { id: 'tt0816692', title: 'Interstellar', score: 9.0 },
                    { id: 'tt0111161', title: 'The Shawshank Redemption', score: 9.8 }
                ]
            },
            {
                id: 'demo_sam',
                username: 'samantha_r',
                displayName: 'Sam Rodriguez',
                avatar: '🍿',
                bio: 'Classic cinema lover',
                movies: [
                    { id: 'tt0068646', title: 'The Godfather', score: 10.0 },
                    { id: 'tt0071562', title: 'The Godfather Part II', score: 9.5 },
                    { id: 'tt0110912', title: 'Pulp Fiction', score: 9.0 },
                    { id: 'tt0109830', title: 'Forrest Gump', score: 8.5 },
                    { id: 'tt0073486', title: "One Flew Over the Cuckoo's Nest", score: 9.2 }
                ]
            },
            {
                id: 'demo_jordan',
                username: 'jordan_k',
                displayName: 'Jordan Kim',
                avatar: '🎥',
                bio: 'Sci-fi and fantasy nerd',
                movies: [
                    { id: 'tt0133093', title: 'The Matrix', score: 9.5 },
                    { id: 'tt0167260', title: 'LOTR: Return of the King', score: 10.0 },
                    { id: 'tt0120737', title: 'LOTR: Fellowship of the Ring', score: 9.8 },
                    { id: 'tt0080684', title: 'Empire Strikes Back', score: 9.0 },
                    { id: 'tt0245429', title: 'Spirited Away', score: 9.3 }
                ]
            }
        ];
    },

    /**
     * Add demo friends for testing
     */
    addDemoFriends() {
        const demoFriends = this.getDemoFriends();
        const friendData = {};

        demoFriends.forEach(friend => {
            this.addFriend({
                id: friend.id,
                username: friend.username,
                displayName: friend.displayName,
                avatar: friend.avatar
            });
            friendData[friend.id] = {
                profile: friend,
                movies: friend.movies,
                lastActive: new Date().toISOString()
            };
        });

        localStorage.setItem(this.KEYS.FRIEND_DATA, JSON.stringify(friendData));
    },

    /**
     * Get activity feed
     * @param {number} limit - Max items to return
     * @returns {Array} Activity items
     */
    getActivityFeed(limit = 20) {
        try {
            const data = localStorage.getItem(this.KEYS.ACTIVITY);
            const activities = data ? JSON.parse(data) : [];
            return activities.slice(0, limit);
        } catch (e) {
            return [];
        }
    },

    /**
     * Record an activity
     * @param {Object} activity - Activity object
     */
    recordActivity(activity) {
        try {
            const activities = this.getActivityFeed(100);
            activities.unshift({
                ...activity,
                timestamp: new Date().toISOString(),
                userId: this.getProfile().id
            });
            // Keep only last 100 activities
            localStorage.setItem(this.KEYS.ACTIVITY,
                JSON.stringify(activities.slice(0, 100)));
        } catch (e) {
            console.error('Error recording activity:', e);
        }
    },

    /**
     * Record movie rating activity
     * @param {Object} movie - Movie object
     * @param {number} score - Score given
     */
    recordMovieRating(movie, score) {
        this.recordActivity({
            type: 'movie_rated',
            movieId: movie.id,
            movieTitle: movie.title,
            moviePoster: movie.poster,
            score: score
        });
    },

    /**
     * Get combined friends' activity feed
     * In production, this would fetch from server
     * @returns {Array} Combined activity feed
     */
    getFriendsActivityFeed() {
        const friends = this.getFriends();
        const demoFriends = this.getDemoFriends();
        const activities = [];

        // Generate simulated friend activities
        friends.forEach(friend => {
            const demoFriend = demoFriends.find(d => d.id === friend.id);
            if (demoFriend && demoFriend.movies) {
                demoFriend.movies.forEach((movie, idx) => {
                    activities.push({
                        type: 'friend_rated',
                        userId: friend.id,
                        userName: friend.displayName,
                        userAvatar: friend.avatar,
                        movieId: movie.id,
                        movieTitle: movie.title,
                        score: movie.score,
                        timestamp: new Date(Date.now() - (idx * 86400000 * (Math.random() * 5 + 1))).toISOString()
                    });
                });
            }
        });

        // Sort by timestamp
        return activities.sort((a, b) =>
            new Date(b.timestamp) - new Date(a.timestamp)
        ).slice(0, 30);
    },

    /**
     * Get friend's score for a specific movie
     * @param {string} movieId - Movie ID
     * @returns {Object|null} Friend scores data
     */
    getFriendScoresForMovie(movieId) {
        const friends = this.getFriends();
        const demoFriends = this.getDemoFriends();
        const scores = [];

        friends.forEach(friend => {
            const demoFriend = demoFriends.find(d => d.id === friend.id);
            if (demoFriend && demoFriend.movies) {
                const movie = demoFriend.movies.find(m => m.id === movieId);
                if (movie) {
                    scores.push({
                        friendId: friend.id,
                        friendName: friend.displayName,
                        friendAvatar: friend.avatar,
                        score: movie.score
                    });
                }
            }
        });

        if (scores.length === 0) return null;

        const avgScore = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;
        return {
            scores,
            averageScore: Math.round(avgScore * 10) / 10,
            count: scores.length
        };
    },

    // ==================
    // WATCHLIST FEATURES
    // ==================

    /**
     * Get watchlist
     * @returns {Array} Watchlist movies
     */
    getWatchlist() {
        try {
            const data = localStorage.getItem(this.KEYS.WATCHLIST);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    },

    /**
     * Add movie to watchlist
     * @param {Object} movie - Movie object
     */
    addToWatchlist(movie) {
        const watchlist = this.getWatchlist();
        if (!watchlist.some(m => m.id === movie.id)) {
            watchlist.push({
                id: movie.id,
                title: movie.title,
                year: movie.year,
                poster: movie.poster,
                addedAt: new Date().toISOString()
            });
            localStorage.setItem(this.KEYS.WATCHLIST, JSON.stringify(watchlist));

            this.recordActivity({
                type: 'watchlist_added',
                movieId: movie.id,
                movieTitle: movie.title
            });
        }
        return watchlist;
    },

    /**
     * Remove from watchlist
     * @param {string} movieId - Movie ID
     */
    removeFromWatchlist(movieId) {
        let watchlist = this.getWatchlist();
        watchlist = watchlist.filter(m => m.id !== movieId);
        localStorage.setItem(this.KEYS.WATCHLIST, JSON.stringify(watchlist));
        return watchlist;
    },

    /**
     * Check if movie is in watchlist
     * @param {string} movieId - Movie ID
     * @returns {boolean}
     */
    isInWatchlist(movieId) {
        return this.getWatchlist().some(m => m.id === movieId);
    },

    // ==================
    // TASTE PROFILE
    // ==================

    /**
     * Calculate taste profile from user's movies
     * @returns {Object} Taste profile data
     */
    calculateTasteProfile() {
        const movies = Storage.getMoviesWithScores();
        if (movies.length === 0) {
            return null;
        }

        // Genre preferences
        const genreScores = {};
        const genreCounts = {};

        movies.forEach(movie => {
            if (movie.genres) {
                movie.genres.forEach(genre => {
                    if (!genreScores[genre]) {
                        genreScores[genre] = 0;
                        genreCounts[genre] = 0;
                    }
                    genreScores[genre] += movie.score;
                    genreCounts[genre]++;
                });
            }
        });

        // Calculate average scores per genre
        const genrePreferences = Object.entries(genreScores).map(([genre, totalScore]) => ({
            genre,
            avgScore: Math.round((totalScore / genreCounts[genre]) * 10) / 10,
            count: genreCounts[genre]
        })).sort((a, b) => b.avgScore - a.avgScore);

        // Decade preferences
        const decadeScores = {};
        const decadeCounts = {};

        movies.forEach(movie => {
            if (movie.year) {
                const decade = Math.floor(movie.year / 10) * 10;
                if (!decadeScores[decade]) {
                    decadeScores[decade] = 0;
                    decadeCounts[decade] = 0;
                }
                decadeScores[decade] += movie.score;
                decadeCounts[decade]++;
            }
        });

        const decadePreferences = Object.entries(decadeScores).map(([decade, totalScore]) => ({
            decade: decade + 's',
            avgScore: Math.round((totalScore / decadeCounts[decade]) * 10) / 10,
            count: decadeCounts[decade]
        })).sort((a, b) => parseInt(b.decade) - parseInt(a.decade));

        // Rating distribution
        const distribution = {
            excellent: movies.filter(m => m.score >= 8.5).length,
            good: movies.filter(m => m.score >= 7 && m.score < 8.5).length,
            average: movies.filter(m => m.score >= 5.5 && m.score < 7).length,
            belowAverage: movies.filter(m => m.score >= 4 && m.score < 5.5).length,
            poor: movies.filter(m => m.score < 4).length
        };

        // Stats
        const avgRating = movies.reduce((sum, m) => sum + m.score, 0) / movies.length;
        const stats = Storage.loadStats();

        return {
            genrePreferences: genrePreferences.slice(0, 10),
            favoriteGenres: genrePreferences.slice(0, 3).map(g => g.genre),
            decadePreferences,
            distribution,
            avgRating: Math.round(avgRating * 10) / 10,
            totalMovies: movies.length,
            totalComparisons: stats.totalComparisons || 0,
            topRated: movies.slice(0, 5),
            recentlyAdded: [...movies].sort((a, b) =>
                new Date(b.addedAt) - new Date(a.addedAt)
            ).slice(0, 5)
        };
    },

    // ==================
    // SHARING
    // ==================

    /**
     * Generate shareable profile URL (for future backend)
     * @returns {string} Share URL
     */
    getShareUrl() {
        const profile = this.getProfile();
        // In production, this would be a real URL
        return `https://teli.app/u/${profile.username}`;
    },

    /**
     * Generate shareable text for a movie
     * @param {Object} movie - Movie object
     * @param {number} score - User's score
     * @returns {string} Shareable text
     */
    getMovieShareText(movie, score) {
        return `I rated "${movie.title}" (${movie.year}) a ${score}/10 on Teli! 🎬\n\nTeli - Your Personal Movie Rankings`;
    },

    /**
     * Generate shareable text for top movies
     * @param {number} count - Number of movies
     * @returns {string} Shareable text
     */
    getTopMoviesShareText(count = 5) {
        const movies = Storage.getMoviesWithScores().slice(0, count);
        let text = `My Top ${count} Movies on Teli 🎬\n\n`;
        movies.forEach((movie, idx) => {
            text += `${idx + 1}. ${movie.title} (${movie.score}/10)\n`;
        });
        text += `\nTeli - Your Personal Movie Rankings`;
        return text;
    },

    /**
     * Export profile and rankings as shareable data
     * @returns {Object} Shareable data
     */
    exportShareableData() {
        const profile = this.getProfile();
        const movies = Storage.getMoviesWithScores();
        const tasteProfile = this.calculateTasteProfile();

        return {
            profile: {
                displayName: profile.displayName,
                avatar: profile.avatar,
                bio: profile.bio
            },
            stats: {
                totalMovies: movies.length,
                avgRating: tasteProfile?.avgRating
            },
            topMovies: movies.slice(0, 10).map(m => ({
                title: m.title,
                year: m.year,
                score: m.score
            })),
            favoriteGenres: tasteProfile?.favoriteGenres,
            exportedAt: new Date().toISOString()
        };
    },

    // ==================
    // CURATED LISTS
    // ==================

    /**
     * Generate curated lists based on user's movies
     * @returns {Array} Array of curated list objects
     */
    generateCuratedLists() {
        const movies = Storage.getMoviesWithScores();
        if (movies.length < 3) return [];

        const lists = [];

        // Top rated overall
        if (movies.length >= 5) {
            lists.push({
                id: 'top-overall',
                title: 'Your Top Rated',
                description: 'Your highest rated movies',
                icon: '🏆',
                movies: movies.slice(0, 10)
            });
        }

        // By genre
        const genreMovies = {};
        movies.forEach(movie => {
            if (movie.genres) {
                movie.genres.forEach(genre => {
                    if (!genreMovies[genre]) {
                        genreMovies[genre] = [];
                    }
                    genreMovies[genre].push(movie);
                });
            }
        });

        // Top genres with at least 3 movies
        Object.entries(genreMovies)
            .filter(([_, movs]) => movs.length >= 3)
            .sort((a, b) => b[1].length - a[1].length)
            .slice(0, 5)
            .forEach(([genre, genreMovs]) => {
                const sorted = genreMovs.sort((a, b) => b.score - a.score);
                lists.push({
                    id: `genre-${genre.toLowerCase().replace(/\s/g, '-')}`,
                    title: `Best ${genre}`,
                    description: `Your top ${genre} movies`,
                    icon: this.getGenreIcon(genre),
                    movies: sorted.slice(0, 10)
                });
            });

        // By decade
        const decadeMovies = {};
        movies.forEach(movie => {
            if (movie.year) {
                const decade = Math.floor(movie.year / 10) * 10;
                if (!decadeMovies[decade]) {
                    decadeMovies[decade] = [];
                }
                decadeMovies[decade].push(movie);
            }
        });

        Object.entries(decadeMovies)
            .filter(([_, movs]) => movs.length >= 3)
            .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
            .slice(0, 3)
            .forEach(([decade, decMovs]) => {
                const sorted = decMovs.sort((a, b) => b.score - a.score);
                lists.push({
                    id: `decade-${decade}`,
                    title: `Best of the ${decade}s`,
                    description: `Your favorites from ${decade}-${parseInt(decade) + 9}`,
                    icon: '📅',
                    movies: sorted.slice(0, 10)
                });
            });

        // Recently added
        const recent = [...movies]
            .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))
            .slice(0, 10);
        if (recent.length >= 3) {
            lists.push({
                id: 'recently-added',
                title: 'Recently Added',
                description: 'Movies you added recently',
                icon: '🆕',
                movies: recent
            });
        }

        // Hidden gems (lower rated but with tags like "rewatchable" or "classic")
        const taggedMovies = movies.filter(m => m.tags && m.tags.length > 0);
        if (taggedMovies.length >= 3) {
            lists.push({
                id: 'tagged-favorites',
                title: 'Your Tagged Movies',
                description: 'Movies you took time to tag',
                icon: '🏷️',
                movies: taggedMovies.slice(0, 10)
            });
        }

        // Rewatchable
        const rewatchable = movies.filter(m => m.tags && m.tags.includes('rewatchable'));
        if (rewatchable.length >= 3) {
            lists.push({
                id: 'rewatchable',
                title: 'Rewatchable',
                description: 'Movies worth watching again',
                icon: '🔄',
                movies: rewatchable.sort((a, b) => b.score - a.score).slice(0, 10)
            });
        }

        return lists;
    },

    /**
     * Get icon for a genre
     * @param {string} genre - Genre name
     * @returns {string} Emoji icon
     */
    getGenreIcon(genre) {
        const icons = {
            'Action': '💥',
            'Adventure': '🗺️',
            'Animation': '🎨',
            'Biography': '📖',
            'Comedy': '😂',
            'Crime': '🔫',
            'Documentary': '🎥',
            'Drama': '🎭',
            'Family': '👨‍👩‍👧‍👦',
            'Fantasy': '🧙',
            'Film-Noir': '🎩',
            'History': '📜',
            'Horror': '👻',
            'Music': '🎵',
            'Musical': '🎶',
            'Mystery': '🔍',
            'Romance': '❤️',
            'Sci-Fi': '🚀',
            'Sport': '⚽',
            'Thriller': '😱',
            'War': '⚔️',
            'Western': '🤠'
        };
        return icons[genre] || '🎬';
    },

    /**
     * Generate share text for a curated list
     * @param {Object} list - Curated list object
     * @returns {string} Share text
     */
    getListShareText(list) {
        let text = `${list.icon} ${list.title}\n\n`;
        list.movies.forEach((movie, idx) => {
            text += `${idx + 1}. ${movie.title} (${movie.score}/10)\n`;
        });
        text += `\nRanked on Teli`;
        return text;
    }
};

// Make available globally
window.Social = Social;
