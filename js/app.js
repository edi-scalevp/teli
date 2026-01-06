/**
 * Teli - Main Application
 * Movie Rankings App inspired by Beli
 */

const App = {
    // State
    currentView: 'list-view',
    selectedMovie: null,
    comparisonQueue: [],
    comparisonIndex: 0,
    quickRating: null,
    searchDebounce: null,
    selectedAvatar: null,
    selectedTags: [],
    currentFriend: null,
    currentList: null,

    /**
     * Initialize the application
     */
    init() {
        // Show loading screen briefly
        setTimeout(() => {
            this.hideLoading();

            // Check if onboarded
            if (Storage.isOnboarded()) {
                this.showMainApp();
            } else {
                this.showOnboarding();
            }
        }, 1000);

        this.bindEvents();
        this.checkApiKey();
        this.loadProfile();
    },

    /**
     * Hide loading screen
     */
    hideLoading() {
        document.getElementById('loading-screen').classList.remove('active');
    },

    /**
     * Show onboarding
     */
    showOnboarding() {
        document.getElementById('onboarding-screen').classList.add('active');
    },

    /**
     * Show main app
     */
    showMainApp() {
        document.getElementById('main-app').classList.add('active');
        this.refreshMovieList();
        this.updateStats();
        this.refreshWatchlist();
        this.updateProfileDisplay();
    },

    /**
     * Check and prompt for API key if needed
     */
    checkApiKey() {
        // Load stored API key first
        MoviesAPI.loadApiKey();

        if (!MoviesAPI.hasApiKey()) {
            console.log('No OMDb API key configured. Using demo data.');
            console.log('Get your free API key at: https://www.omdbapi.com/apikey.aspx');
        }
    },

    /**
     * Load user profile
     */
    loadProfile() {
        const profile = Social.getProfile();
        this.selectedAvatar = profile.avatar;
    },

    /**
     * Update profile display
     */
    updateProfileDisplay() {
        const profile = Social.getProfile();
        document.getElementById('profile-avatar-display').textContent = profile.avatar;
        document.getElementById('profile-name-display').textContent = profile.displayName;
        document.getElementById('profile-username').textContent = '@' + profile.username;
    },

    /**
     * Bind all event listeners
     */
    bindEvents() {
        // Onboarding
        document.getElementById('onboarding-next').addEventListener('click', () => this.handleOnboardingNext());
        document.getElementById('onboarding-skip').addEventListener('click', () => this.completeOnboarding());

        // Onboarding dots
        document.querySelectorAll('.onboarding-dots .dot').forEach(dot => {
            dot.addEventListener('click', (e) => this.goToSlide(parseInt(e.target.dataset.slide)));
        });

        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchView(e.currentTarget.dataset.view));
        });

        // Search
        const searchInput = document.getElementById('movie-search');
        searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        searchInput.addEventListener('focus', () => this.switchView('search-view'));

        document.getElementById('clear-search').addEventListener('click', () => {
            searchInput.value = '';
            document.getElementById('clear-search').classList.add('hidden');
            this.clearSearchResults();
        });

        // Filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleFilter(e.target.dataset.filter));
        });

        // Initial rating modal
        document.getElementById('close-initial-rating').addEventListener('click', () => this.closeModal('initial-rating-modal'));
        document.querySelectorAll('.rating-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleQuickRating(e.currentTarget.dataset.rating));
        });

        // Comparison modal
        document.getElementById('prefer-new').addEventListener('click', () => this.handleComparison(1));
        document.getElementById('prefer-equal').addEventListener('click', () => this.handleComparison(0.5));
        document.getElementById('prefer-existing').addEventListener('click', () => this.handleComparison(0));

        // Movie detail modal
        document.getElementById('close-movie-detail').addEventListener('click', () => this.closeModal('movie-detail-modal'));
        document.getElementById('recompare-btn').addEventListener('click', () => this.startRecompare());
        document.getElementById('remove-movie-btn').addEventListener('click', () => this.removeCurrentMovie());
        document.getElementById('add-notes-btn').addEventListener('click', () => this.openNotesModal());
        document.getElementById('share-movie-btn').addEventListener('click', () => this.shareCurrentMovie());

        // Profile actions
        document.getElementById('setup-api').addEventListener('click', () => this.showApiKeyModal());
        document.getElementById('export-data').addEventListener('click', () => this.exportData());
        document.getElementById('import-data').addEventListener('click', () => document.getElementById('import-file').click());
        document.getElementById('import-file').addEventListener('change', (e) => this.importData(e));
        document.getElementById('clear-data').addEventListener('click', () => this.clearData());
        document.getElementById('edit-profile-btn').addEventListener('click', () => this.openProfileEditModal());
        document.getElementById('share-top-movies').addEventListener('click', () => this.shareTopMovies());
        document.getElementById('copy-profile-link').addEventListener('click', () => this.copyProfileLink());

        // API Key modal
        document.getElementById('close-api-modal').addEventListener('click', () => this.closeModal('api-key-modal'));
        document.getElementById('save-api-key').addEventListener('click', () => this.saveApiKey());

        // Profile edit modal
        document.getElementById('close-profile-edit').addEventListener('click', () => this.closeModal('profile-edit-modal'));
        document.getElementById('save-profile').addEventListener('click', () => this.saveProfile());
        document.querySelectorAll('.avatar-option').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectAvatar(e.currentTarget.dataset.avatar));
        });

        // Movie notes modal
        document.getElementById('close-movie-notes').addEventListener('click', () => this.closeModal('movie-notes-modal'));
        document.getElementById('save-movie-notes').addEventListener('click', () => this.saveMovieNotes());
        document.querySelectorAll('.tag-option').forEach(btn => {
            btn.addEventListener('click', (e) => this.toggleTag(e.currentTarget.dataset.tag));
        });

        // Friend profile modal
        document.getElementById('close-friend-profile').addEventListener('click', () => this.closeModal('friend-profile-modal'));
        document.getElementById('remove-friend-btn').addEventListener('click', () => this.removeCurrentFriend());

        // List detail modal
        document.getElementById('close-list-detail').addEventListener('click', () => this.closeModal('list-detail-modal'));
        document.getElementById('share-list-btn').addEventListener('click', () => this.shareCurrentList());

        // Friends view
        document.getElementById('add-demo-friends').addEventListener('click', () => this.addDemoFriends());
        document.querySelectorAll('.friends-tabs .tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchFriendsTab(e.target.dataset.tab));
        });

        // Close modals on backdrop click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });
    },

    /**
     * Handle onboarding next button
     */
    handleOnboardingNext() {
        const currentSlide = document.querySelector('.onboarding-slide.active');
        const currentNum = parseInt(currentSlide.dataset.slide);

        if (currentNum < 3) {
            this.goToSlide(currentNum + 1);
        } else {
            this.completeOnboarding();
        }
    },

    /**
     * Go to specific onboarding slide
     */
    goToSlide(slideNum) {
        document.querySelectorAll('.onboarding-slide').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.onboarding-dots .dot').forEach(d => d.classList.remove('active'));

        document.querySelector(`.onboarding-slide[data-slide="${slideNum}"]`).classList.add('active');
        document.querySelector(`.dot[data-slide="${slideNum}"]`).classList.add('active');

        const nextBtn = document.getElementById('onboarding-next');
        nextBtn.textContent = slideNum === 3 ? 'Get Started' : 'Next';
    },

    /**
     * Complete onboarding
     */
    completeOnboarding() {
        Storage.completeOnboarding();
        document.getElementById('onboarding-screen').classList.remove('active');
        this.showMainApp();
    },

    /**
     * Switch between views
     */
    switchView(viewId) {
        // Update views
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById(viewId).classList.add('active');

        // Update nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === viewId);
        });

        this.currentView = viewId;

        // Refresh data when switching views
        if (viewId === 'list-view') {
            this.refreshMovieList();
        } else if (viewId === 'profile-view') {
            this.updateStats();
            this.updateGenres();
            this.updateTasteProfile();
            this.updateProfileDisplay();
        } else if (viewId === 'friends-view') {
            this.refreshFriendsView();
        } else if (viewId === 'watchlist-view') {
            this.refreshWatchlist();
        }
    },

    /**
     * Handle search input
     */
    handleSearch(query) {
        clearTimeout(this.searchDebounce);

        const clearBtn = document.getElementById('clear-search');
        clearBtn.classList.toggle('hidden', !query);

        if (query.length < 2) {
            this.clearSearchResults();
            return;
        }

        this.searchDebounce = setTimeout(async () => {
            const resultsContainer = document.getElementById('search-results');
            resultsContainer.innerHTML = '<div class="search-prompt"><p>Searching...</p></div>';

            const results = await MoviesAPI.searchMovies(query);
            this.displaySearchResults(results);
        }, 300);
    },

    /**
     * Display search results
     */
    displaySearchResults(movies) {
        const container = document.getElementById('search-results');

        if (movies.length === 0) {
            container.innerHTML = '<div class="search-prompt"><p>No movies found</p></div>';
            return;
        }

        container.innerHTML = movies.map(movie => {
            const inWatchlist = Social.isInWatchlist(movie.id);
            const hasMovie = Storage.hasMovie(movie.id);
            return `
                <div class="search-result" data-movie-id="${movie.id}">
                    <img src="${movie.poster}" alt="${movie.title}" class="movie-poster" loading="lazy">
                    <div class="movie-info">
                        <div class="movie-title">${movie.title}</div>
                        <div class="movie-year">${movie.year || 'Unknown'}</div>
                    </div>
                    <div class="search-result-actions">
                        <button class="watchlist-add-btn ${inWatchlist ? 'in-watchlist' : ''}"
                                data-movie='${JSON.stringify(movie).replace(/'/g, "&#39;")}'
                                title="${inWatchlist ? 'In watchlist' : 'Add to watchlist'}">
                            ${inWatchlist ? '🎯' : '🎯'}
                        </button>
                        ${hasMovie
                            ? '<span class="add-icon">✓</span>'
                            : '<span class="add-icon add-movie-btn">+</span>'
                        }
                    </div>
                </div>
            `;
        }).join('');

        // Bind click events for adding movies
        container.querySelectorAll('.search-result').forEach(result => {
            const addBtn = result.querySelector('.add-movie-btn');
            if (addBtn) {
                addBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const movieId = result.dataset.movieId;
                    const movie = movies.find(m => m.id === movieId);
                    this.selectMovieToAdd(movie);
                });
            }

            // Click on result to view details or add
            result.addEventListener('click', (e) => {
                if (e.target.classList.contains('watchlist-add-btn')) return;
                const movieId = result.dataset.movieId;
                if (Storage.hasMovie(movieId)) {
                    this.showToast('Movie already in your list');
                } else {
                    const movie = movies.find(m => m.id === movieId);
                    this.selectMovieToAdd(movie);
                }
            });
        });

        // Bind watchlist buttons
        container.querySelectorAll('.watchlist-add-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const movie = JSON.parse(btn.dataset.movie.replace(/&#39;/g, "'"));
                this.toggleWatchlist(movie, btn);
            });
        });
    },

    /**
     * Toggle movie in watchlist
     */
    toggleWatchlist(movie, btn) {
        if (Social.isInWatchlist(movie.id)) {
            Social.removeFromWatchlist(movie.id);
            btn.classList.remove('in-watchlist');
            this.showToast('Removed from watchlist');
        } else {
            Social.addToWatchlist(movie);
            btn.classList.add('in-watchlist');
            this.showToast('Added to watchlist!', 'success');
        }
        this.refreshWatchlist();
    },

    /**
     * Clear search results
     */
    clearSearchResults() {
        const hasApiKey = MoviesAPI.hasApiKey();
        document.getElementById('search-results').innerHTML = `
            <div class="search-prompt">
                <p>Search for any movie from IMDB</p>
                ${hasApiKey
                    ? '<p class="search-hint">Search millions of movies</p>'
                    : '<p class="search-hint">Try: "Dark Knight", "Inception", "Matrix"<br><small>Add API key in Profile for full IMDB search</small></p>'
                }
            </div>
        `;
    },

    /**
     * Select a movie to add
     */
    selectMovieToAdd(movie) {
        this.selectedMovie = movie;

        // Show initial rating modal
        document.getElementById('initial-movie-poster').src = movie.poster;
        document.getElementById('initial-movie-title').textContent = movie.title;
        document.getElementById('initial-movie-year').textContent = movie.year || '';

        this.openModal('initial-rating-modal');
    },

    /**
     * Handle quick rating selection
     */
    handleQuickRating(rating) {
        this.quickRating = rating;
        this.closeModal('initial-rating-modal');

        const existingMovies = Storage.loadMovies();

        if (existingMovies.length === 0) {
            // First movie - add directly with initial rating
            this.addMovieWithRating();
        } else {
            // Start comparison process
            this.startComparison();
        }
    },

    /**
     * Add movie with calculated rating (no comparison needed)
     */
    addMovieWithRating() {
        const initialRating = EloRating.getInitialRating(this.quickRating, []);

        const movieToAdd = {
            ...this.selectedMovie,
            rating: initialRating,
            quickRating: this.quickRating
        };

        // Add genres from API
        if (this.selectedMovie.genreIds) {
            movieToAdd.genres = MoviesAPI.getGenreNames(this.selectedMovie.genreIds);
        }

        Storage.addMovie(movieToAdd);

        // Record activity
        const moviesWithScores = Storage.getMoviesWithScores();
        const addedMovie = moviesWithScores.find(m => m.id === movieToAdd.id);
        if (addedMovie) {
            Social.recordMovieRating(addedMovie, addedMovie.score);
        }

        this.refreshMovieList();
        this.updateStats();

        // Remove from watchlist if present
        if (Social.isInWatchlist(this.selectedMovie.id)) {
            Social.removeFromWatchlist(this.selectedMovie.id);
            this.refreshWatchlist();
        }

        this.showToast(`Added "${this.selectedMovie.title}" to your list!`, 'success');
        this.switchView('list-view');

        // Clear search
        document.getElementById('movie-search').value = '';
        this.clearSearchResults();
    },

    /**
     * Start comparison process
     */
    startComparison() {
        const existingMovies = Storage.loadMovies();
        const initialRating = EloRating.getInitialRating(this.quickRating, existingMovies);

        // Set initial rating on selected movie
        this.selectedMovie.rating = initialRating;

        // Select movies to compare against
        this.comparisonQueue = EloRating.selectComparisonMovies(
            this.selectedMovie,
            existingMovies,
            Math.min(5, existingMovies.length)
        );

        if (this.comparisonQueue.length === 0) {
            this.addMovieWithRating();
            return;
        }

        this.comparisonIndex = 0;
        this.showComparisonModal();
    },

    /**
     * Show comparison modal with current comparison
     */
    showComparisonModal() {
        const compareMovie = this.comparisonQueue[this.comparisonIndex];
        const movies = Storage.getMoviesWithScores();
        const compareWithScore = movies.find(m => m.id === compareMovie.id);

        // Update progress
        const progress = ((this.comparisonIndex + 1) / this.comparisonQueue.length) * 100;
        document.getElementById('comparison-progress-fill').style.width = `${progress}%`;
        document.getElementById('comparison-count').textContent =
            `${this.comparisonIndex + 1} of ${this.comparisonQueue.length}`;

        // Update new movie card
        document.getElementById('new-movie-poster').src = this.selectedMovie.poster;
        document.getElementById('new-movie-title').textContent = this.selectedMovie.title;
        document.getElementById('new-movie-year').textContent = this.selectedMovie.year || '';

        // Update comparison movie card
        document.getElementById('compare-movie-poster').src = compareMovie.poster;
        document.getElementById('compare-movie-title').textContent = compareMovie.title;
        document.getElementById('compare-movie-year').textContent = compareMovie.year || '';
        document.getElementById('compare-movie-score').textContent =
            compareWithScore ? compareWithScore.score.toFixed(1) : '-';

        this.openModal('comparison-modal');
    },

    /**
     * Handle comparison choice
     * @param {number} score - 1 (prefer new), 0.5 (equal), 0 (prefer existing)
     */
    handleComparison(score) {
        const compareMovie = this.comparisonQueue[this.comparisonIndex];

        // Calculate new ratings
        const { ratingA, ratingB } = EloRating.calculateNewRatings(
            this.selectedMovie.rating,
            compareMovie.rating,
            score
        );

        // Update ratings
        this.selectedMovie.rating = ratingA;
        Storage.updateMovieRating(compareMovie.id, ratingB);

        // Record comparison
        Storage.recordComparison({
            newMovieId: this.selectedMovie.id,
            comparedMovieId: compareMovie.id,
            result: score
        });

        // Move to next comparison or finish
        this.comparisonIndex++;

        if (this.comparisonIndex < this.comparisonQueue.length) {
            this.showComparisonModal();
        } else {
            this.finishAddingMovie();
        }
    },

    /**
     * Finish adding movie after comparisons
     */
    finishAddingMovie() {
        this.closeModal('comparison-modal');

        const movieToAdd = {
            ...this.selectedMovie,
            quickRating: this.quickRating
        };

        // Add genres from API
        if (this.selectedMovie.genreIds) {
            movieToAdd.genres = MoviesAPI.getGenreNames(this.selectedMovie.genreIds);
        }

        Storage.addMovie(movieToAdd);

        // Record activity
        const moviesWithScores = Storage.getMoviesWithScores();
        const addedMovie = moviesWithScores.find(m => m.id === movieToAdd.id);
        if (addedMovie) {
            Social.recordMovieRating(addedMovie, addedMovie.score);
        }

        this.refreshMovieList();
        this.updateStats();

        // Remove from watchlist if present
        if (Social.isInWatchlist(this.selectedMovie.id)) {
            Social.removeFromWatchlist(this.selectedMovie.id);
            this.refreshWatchlist();
        }

        this.showToast(`Added "${this.selectedMovie.title}" to your rankings!`, 'success');
        this.switchView('list-view');

        // Clear search
        document.getElementById('movie-search').value = '';
        this.clearSearchResults();

        // Reset state
        this.selectedMovie = null;
        this.comparisonQueue = [];
        this.comparisonIndex = 0;
        this.quickRating = null;
    },

    /**
     * Refresh the movie list display
     */
    refreshMovieList(filter = 'all') {
        const container = document.getElementById('ranked-movies');
        let movies = Storage.getMoviesWithScores();

        // Apply filters
        if (filter === 'recent') {
            movies = movies.sort((a, b) =>
                new Date(b.addedAt) - new Date(a.addedAt)
            ).slice(0, 10);
        } else if (filter === 'top') {
            movies = movies.slice(0, 10);
        }

        // Update header count
        document.getElementById('movie-count').textContent = Storage.loadMovies().length;

        if (movies.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🎬</div>
                    <h3>No movies ranked yet</h3>
                    <p>Tap + to add your first movie</p>
                </div>
            `;
            return;
        }

        container.innerHTML = movies.map((movie, index) => `
            <div class="movie-card" data-movie-id="${movie.id}">
                <span class="movie-rank">#${index + 1}</span>
                <img src="${movie.poster}" alt="${movie.title}" class="movie-poster" loading="lazy">
                <div class="movie-info">
                    <div class="movie-title">${movie.title}</div>
                    <div class="movie-year">${movie.year || ''}</div>
                </div>
                <div class="movie-score ${movie.scoreClass}">${movie.score.toFixed(1)}</div>
            </div>
        `).join('');

        // Bind click events
        container.querySelectorAll('.movie-card').forEach(card => {
            card.addEventListener('click', () => {
                const movieId = card.dataset.movieId;
                this.showMovieDetail(movieId);
            });
        });
    },

    /**
     * Handle filter selection
     */
    handleFilter(filter) {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        this.refreshMovieList(filter);
    },

    /**
     * Show movie detail modal
     */
    showMovieDetail(movieId) {
        const movies = Storage.getMoviesWithScores();
        const movie = movies.find(m => m.id === movieId);
        const rank = movies.findIndex(m => m.id === movieId) + 1;

        if (!movie) return;

        this.selectedMovie = movie;

        document.getElementById('detail-poster').src = movie.poster;
        document.getElementById('detail-title').textContent = movie.title;
        document.getElementById('detail-year').textContent = movie.year || '';
        document.getElementById('detail-genres').textContent =
            movie.genres ? movie.genres.join(', ') : '';
        document.getElementById('detail-score').textContent = movie.score.toFixed(1);
        document.getElementById('detail-rank').textContent = `#${rank}`;
        document.getElementById('detail-overview').textContent =
            movie.overview || 'No overview available.';

        // Display friend scores if available
        const friendScores = Social.getFriendScoresForMovie(movieId);
        const friendScoreSection = document.getElementById('friends-score-section');
        if (friendScores && friendScores.count > 0) {
            friendScoreSection.style.display = 'block';
            document.getElementById('detail-friends-score').textContent =
                `${friendScores.averageScore} (${friendScores.count})`;
        } else {
            friendScoreSection.style.display = 'none';
        }

        // Display tags
        const tagsContainer = document.getElementById('movie-tags');
        if (movie.tags && movie.tags.length > 0) {
            tagsContainer.innerHTML = movie.tags.map(tag =>
                `<span class="movie-tag">${tag}</span>`
            ).join('');
            tagsContainer.style.display = 'flex';
        } else {
            tagsContainer.style.display = 'none';
        }

        // Display notes
        const notesDisplay = document.getElementById('movie-notes-display');
        if (movie.notes) {
            document.getElementById('detail-notes').textContent = movie.notes;
            notesDisplay.style.display = 'block';
        } else {
            notesDisplay.style.display = 'none';
        }

        this.openModal('movie-detail-modal');
    },

    /**
     * Start re-comparing a movie
     */
    startRecompare() {
        this.closeModal('movie-detail-modal');
        this.quickRating = this.selectedMovie.quickRating || 'fine';

        // Remove movie from storage temporarily
        const movieToRecompare = { ...this.selectedMovie };
        Storage.removeMovie(this.selectedMovie.id);

        this.selectedMovie = movieToRecompare;
        this.startComparison();
    },

    /**
     * Remove current movie from list
     */
    removeCurrentMovie() {
        if (!this.selectedMovie) return;

        if (confirm(`Remove "${this.selectedMovie.title}" from your list?`)) {
            Storage.removeMovie(this.selectedMovie.id);
            this.closeModal('movie-detail-modal');
            this.refreshMovieList();
            this.updateStats();
            this.showToast('Movie removed from your list');
        }
    },

    /**
     * Open notes modal for current movie
     */
    openNotesModal() {
        if (!this.selectedMovie) return;

        document.getElementById('notes-movie-title').textContent = this.selectedMovie.title;
        document.getElementById('movie-notes-input').value = this.selectedMovie.notes || '';

        // Reset tag selection
        this.selectedTags = this.selectedMovie.tags ? [...this.selectedMovie.tags] : [];
        document.querySelectorAll('.tag-option').forEach(btn => {
            btn.classList.toggle('selected', this.selectedTags.includes(btn.dataset.tag));
        });

        this.closeModal('movie-detail-modal');
        this.openModal('movie-notes-modal');
    },

    /**
     * Toggle tag selection
     */
    toggleTag(tag) {
        const idx = this.selectedTags.indexOf(tag);
        if (idx > -1) {
            this.selectedTags.splice(idx, 1);
        } else {
            this.selectedTags.push(tag);
        }
        document.querySelector(`.tag-option[data-tag="${tag}"]`).classList.toggle('selected');
    },

    /**
     * Save movie notes
     */
    saveMovieNotes() {
        if (!this.selectedMovie) return;

        const notes = document.getElementById('movie-notes-input').value.trim();
        Storage.updateMovieNotes(this.selectedMovie.id, notes, this.selectedTags);

        this.closeModal('movie-notes-modal');
        this.showToast('Notes saved!', 'success');
        this.refreshMovieList();
    },

    /**
     * Share current movie
     */
    shareCurrentMovie() {
        if (!this.selectedMovie) return;

        const text = Social.getMovieShareText(this.selectedMovie, this.selectedMovie.score);

        if (navigator.share) {
            navigator.share({
                title: `${this.selectedMovie.title} - Teli`,
                text: text
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(text).then(() => {
                this.showToast('Copied to clipboard!', 'success');
            });
        }
    },

    /**
     * Update stats display
     */
    updateStats() {
        const movies = Storage.loadMovies();
        const stats = Storage.loadStats();

        document.getElementById('total-movies').textContent = movies.length;
        document.getElementById('comparisons-made').textContent = stats.totalComparisons || 0;

        if (movies.length > 0) {
            const moviesWithScores = Storage.getMoviesWithScores();
            const avgScore = moviesWithScores.reduce((sum, m) => sum + m.score, 0) / moviesWithScores.length;
            document.getElementById('avg-score').textContent = avgScore.toFixed(1);
        } else {
            document.getElementById('avg-score').textContent = '-';
        }
    },

    /**
     * Update genres display
     */
    updateGenres() {
        const topGenres = Storage.getTopGenres();
        const container = document.getElementById('top-genres');

        if (topGenres.length === 0) {
            container.innerHTML = '<p class="muted">Rate more movies to see your preferences</p>';
            return;
        }

        container.innerHTML = topGenres.map(({ genre, count }) =>
            `<span class="genre-tag">${genre} (${count})</span>`
        ).join('');
    },

    /**
     * Update taste profile display
     */
    updateTasteProfile() {
        const tasteProfile = Social.calculateTasteProfile();

        // Taste Profile section
        const tasteContainer = document.getElementById('taste-profile');
        if (!tasteProfile) {
            tasteContainer.innerHTML = '<p class="muted">Rate more movies to see your taste profile</p>';
        } else {
            tasteContainer.innerHTML = `
                <div class="taste-summary">
                    <div class="taste-item">
                        <div class="taste-label">Movies</div>
                        <div class="taste-value">${tasteProfile.totalMovies}</div>
                    </div>
                    <div class="taste-item">
                        <div class="taste-label">Avg Rating</div>
                        <div class="taste-value">${tasteProfile.avgRating}</div>
                    </div>
                    <div class="taste-item">
                        <div class="taste-label">Comparisons</div>
                        <div class="taste-value">${tasteProfile.totalComparisons}</div>
                    </div>
                    <div class="taste-item">
                        <div class="taste-label">Top Genre</div>
                        <div class="taste-value">${tasteProfile.favoriteGenres[0] || '-'}</div>
                    </div>
                </div>
                ${tasteProfile.favoriteGenres.length > 0 ? `
                <div class="taste-genres">
                    <div class="taste-genres-label">Favorite Genres</div>
                    <div class="taste-genres-list">
                        ${tasteProfile.favoriteGenres.map(g => `<span class="genre-tag">${g}</span>`).join('')}
                    </div>
                </div>
                ` : ''}
            `;
        }

        // Rating distribution
        const distContainer = document.getElementById('rating-distribution');
        if (!tasteProfile) {
            distContainer.innerHTML = '<p class="muted">Rate movies to see your distribution</p>';
        } else {
            const total = tasteProfile.totalMovies;
            const dist = tasteProfile.distribution;
            distContainer.innerHTML = `
                <div class="distribution-bar">
                    <span class="distribution-label">Excellent</span>
                    <div class="distribution-track">
                        <div class="distribution-fill excellent" style="width: ${(dist.excellent / total) * 100}%"></div>
                    </div>
                    <span class="distribution-count">${dist.excellent}</span>
                </div>
                <div class="distribution-bar">
                    <span class="distribution-label">Good</span>
                    <div class="distribution-track">
                        <div class="distribution-fill good" style="width: ${(dist.good / total) * 100}%"></div>
                    </div>
                    <span class="distribution-count">${dist.good}</span>
                </div>
                <div class="distribution-bar">
                    <span class="distribution-label">Average</span>
                    <div class="distribution-track">
                        <div class="distribution-fill average" style="width: ${(dist.average / total) * 100}%"></div>
                    </div>
                    <span class="distribution-count">${dist.average}</span>
                </div>
                <div class="distribution-bar">
                    <span class="distribution-label">Below Avg</span>
                    <div class="distribution-track">
                        <div class="distribution-fill below" style="width: ${(dist.belowAverage / total) * 100}%"></div>
                    </div>
                    <span class="distribution-count">${dist.belowAverage}</span>
                </div>
                <div class="distribution-bar">
                    <span class="distribution-label">Poor</span>
                    <div class="distribution-track">
                        <div class="distribution-fill poor" style="width: ${(dist.poor / total) * 100}%"></div>
                    </div>
                    <span class="distribution-count">${dist.poor}</span>
                </div>
            `;
        }

        // Decade preferences
        const decadeContainer = document.getElementById('decade-preferences');
        if (!tasteProfile || tasteProfile.decadePreferences.length === 0) {
            decadeContainer.innerHTML = '<p class="muted">Rate more movies to see decade preferences</p>';
        } else {
            decadeContainer.innerHTML = tasteProfile.decadePreferences.map(d => `
                <span class="decade-tag">
                    <span class="decade-name">${d.decade}</span>
                    <span class="decade-score">${d.avgScore}</span>
                </span>
            `).join('');
        }

        // Update curated lists
        this.updateCuratedLists();
    },

    /**
     * Update curated lists display
     */
    updateCuratedLists() {
        const container = document.getElementById('curated-lists');
        const lists = Social.generateCuratedLists();

        if (lists.length === 0) {
            container.innerHTML = '<p class="muted">Rate more movies to generate curated lists</p>';
            return;
        }

        container.innerHTML = lists.map(list => `
            <div class="curated-list-card" data-list-id="${list.id}">
                <span class="curated-list-icon">${list.icon}</span>
                <div class="curated-list-info">
                    <div class="curated-list-title">${list.title}</div>
                    <div class="curated-list-description">${list.description}</div>
                </div>
                <span class="curated-list-count">${list.movies.length}</span>
            </div>
        `).join('');

        // Bind click events
        container.querySelectorAll('.curated-list-card').forEach(card => {
            card.addEventListener('click', () => {
                const listId = card.dataset.listId;
                const list = lists.find(l => l.id === listId);
                this.showListDetail(list);
            });
        });
    },

    /**
     * Show list detail modal
     */
    showListDetail(list) {
        if (!list) return;

        this.currentList = list;

        document.getElementById('list-detail-icon').textContent = list.icon;
        document.getElementById('list-detail-title').textContent = list.title;
        document.getElementById('list-detail-description').textContent = list.description;

        const moviesContainer = document.getElementById('list-detail-movies');
        moviesContainer.innerHTML = list.movies.map((movie, idx) => `
            <div class="list-movie-item">
                <span class="list-movie-rank">${idx + 1}</span>
                <img src="${movie.poster}" alt="${movie.title}" class="list-movie-poster" loading="lazy">
                <div class="list-movie-info">
                    <div class="list-movie-title">${movie.title}</div>
                    <div class="list-movie-year">${movie.year || ''}</div>
                </div>
                <span class="list-movie-score ${movie.scoreClass}">${movie.score.toFixed(1)}</span>
            </div>
        `).join('');

        this.openModal('list-detail-modal');
    },

    /**
     * Share current list
     */
    shareCurrentList() {
        if (!this.currentList) return;

        const text = Social.getListShareText(this.currentList);

        if (navigator.share) {
            navigator.share({
                title: `${this.currentList.title} - Teli`,
                text: text
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(text).then(() => {
                this.showToast('List copied to clipboard!', 'success');
            });
        }
    },

    // ==================
    // Friends Features
    // ==================

    /**
     * Refresh friends view
     */
    refreshFriendsView() {
        this.refreshActivityFeed();
        this.refreshFriendsList();
    },

    /**
     * Switch friends tab
     */
    switchFriendsTab(tab) {
        document.querySelectorAll('.friends-tabs .tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tab}-tab`).classList.add('active');
    },

    /**
     * Add demo friends
     */
    addDemoFriends() {
        Social.addDemoFriends();
        this.refreshFriendsView();
        this.showToast('Demo friends added!', 'success');
    },

    /**
     * Refresh activity feed
     */
    refreshActivityFeed() {
        const container = document.getElementById('friends-activity');
        const activities = Social.getFriendsActivityFeed();

        if (activities.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">👥</div>
                    <h3>No friends yet</h3>
                    <p>Add friends to see their movie ratings</p>
                </div>
            `;
            return;
        }

        container.innerHTML = activities.map(activity => {
            const scoreClass = EloRating.getScoreClass(activity.score);
            const timeAgo = this.getTimeAgo(activity.timestamp);
            return `
                <div class="activity-item">
                    <div class="activity-avatar">${activity.userAvatar}</div>
                    <div class="activity-content">
                        <span class="activity-user">${activity.userName}</span>
                        <p class="activity-text">
                            rated <span class="activity-movie">${activity.movieTitle}</span>
                            <span class="activity-score ${scoreClass}">${activity.score}</span>
                        </p>
                        <span class="activity-time">${timeAgo}</span>
                    </div>
                </div>
            `;
        }).join('');
    },

    /**
     * Refresh friends list
     */
    refreshFriendsList() {
        const container = document.getElementById('friends-list');
        const friends = Social.getFriends();

        if (friends.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">👥</div>
                    <h3>No friends yet</h3>
                    <p>Click "Add Demo Friends" to try the social features</p>
                </div>
            `;
            return;
        }

        container.innerHTML = friends.map(friend => `
            <div class="friend-card" data-friend-id="${friend.id}">
                <div class="friend-card-avatar">${friend.avatar}</div>
                <div class="friend-card-info">
                    <div class="friend-card-name">${friend.displayName}</div>
                    <div class="friend-card-username">@${friend.username}</div>
                </div>
            </div>
        `).join('');

        // Bind click events
        container.querySelectorAll('.friend-card').forEach(card => {
            card.addEventListener('click', () => {
                this.showFriendProfile(card.dataset.friendId);
            });
        });
    },

    /**
     * Show friend profile modal
     */
    showFriendProfile(friendId) {
        const friends = Social.getFriends();
        const friend = friends.find(f => f.id === friendId);
        const demoFriends = Social.getDemoFriends();
        const demoFriend = demoFriends.find(d => d.id === friendId);

        if (!friend) return;

        this.currentFriend = friend;

        document.getElementById('friend-avatar').textContent = friend.avatar;
        document.getElementById('friend-name').textContent = friend.displayName;
        document.getElementById('friend-bio').textContent = demoFriend?.bio || '';
        document.getElementById('friend-movie-count').textContent =
            demoFriend?.movies?.length || 0;

        // Display friend's top movies
        const moviesContainer = document.getElementById('friend-top-movies');
        if (demoFriend && demoFriend.movies) {
            moviesContainer.innerHTML = demoFriend.movies.map(movie => `
                <div class="friend-movie-item">
                    <span class="movie-title">${movie.title}</span>
                    <span class="friend-movie-score">${movie.score}</span>
                </div>
            `).join('');
        } else {
            moviesContainer.innerHTML = '<p class="muted">No movies rated yet</p>';
        }

        this.openModal('friend-profile-modal');
    },

    /**
     * Remove current friend
     */
    removeCurrentFriend() {
        if (!this.currentFriend) return;

        if (confirm(`Remove ${this.currentFriend.displayName} from friends?`)) {
            Social.removeFriend(this.currentFriend.id);
            this.closeModal('friend-profile-modal');
            this.refreshFriendsView();
            this.showToast('Friend removed');
        }
    },

    // ==================
    // Watchlist Features
    // ==================

    /**
     * Refresh watchlist display
     */
    refreshWatchlist() {
        const container = document.getElementById('watchlist-movies');
        const watchlist = Social.getWatchlist();

        document.getElementById('watchlist-count').textContent = watchlist.length;

        if (watchlist.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🎯</div>
                    <h3>Your watchlist is empty</h3>
                    <p>Save movies you want to watch later</p>
                </div>
            `;
            return;
        }

        container.innerHTML = watchlist.map(movie => `
            <div class="watchlist-item" data-movie-id="${movie.id}">
                <img src="${movie.poster}" alt="${movie.title}" class="movie-poster" loading="lazy">
                <div class="movie-info">
                    <div class="movie-title">${movie.title}</div>
                    <div class="movie-year">${movie.year || ''}</div>
                </div>
                <div class="watchlist-actions">
                    <button class="watchlist-btn rate-btn" data-movie='${JSON.stringify(movie).replace(/'/g, "&#39;")}'>Rate</button>
                    <button class="watchlist-btn remove" data-movie-id="${movie.id}">×</button>
                </div>
            </div>
        `).join('');

        // Bind click events
        container.querySelectorAll('.rate-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const movie = JSON.parse(btn.dataset.movie.replace(/&#39;/g, "'"));
                if (!Storage.hasMovie(movie.id)) {
                    this.selectMovieToAdd(movie);
                } else {
                    this.showToast('Movie already in your rankings');
                }
            });
        });

        container.querySelectorAll('.watchlist-btn.remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                Social.removeFromWatchlist(btn.dataset.movieId);
                this.refreshWatchlist();
                this.showToast('Removed from watchlist');
            });
        });
    },

    // ==================
    // Profile Features
    // ==================

    /**
     * Open profile edit modal
     */
    openProfileEditModal() {
        const profile = Social.getProfile();

        document.getElementById('edit-display-name').value = profile.displayName;
        document.getElementById('edit-username').value = profile.username;
        document.getElementById('edit-bio').value = profile.bio || '';

        // Select current avatar
        this.selectedAvatar = profile.avatar;
        document.querySelectorAll('.avatar-option').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.avatar === this.selectedAvatar);
        });

        this.openModal('profile-edit-modal');
    },

    /**
     * Select avatar
     */
    selectAvatar(avatar) {
        this.selectedAvatar = avatar;
        document.querySelectorAll('.avatar-option').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.avatar === avatar);
        });
    },

    /**
     * Save profile
     */
    saveProfile() {
        const displayName = document.getElementById('edit-display-name').value.trim();
        const username = document.getElementById('edit-username').value.trim().replace(/[^a-zA-Z0-9_]/g, '');
        const bio = document.getElementById('edit-bio').value.trim();

        if (!displayName) {
            this.showToast('Please enter a display name', 'error');
            return;
        }

        if (!username) {
            this.showToast('Please enter a username', 'error');
            return;
        }

        Social.updateProfile('displayName', displayName);
        Social.updateProfile('username', username);
        Social.updateProfile('avatar', this.selectedAvatar);
        Social.updateProfile('bio', bio);

        this.updateProfileDisplay();
        this.closeModal('profile-edit-modal');
        this.showToast('Profile updated!', 'success');
    },

    /**
     * Share top movies
     */
    shareTopMovies() {
        const text = Social.getTopMoviesShareText(5);

        if (navigator.share) {
            navigator.share({
                title: 'My Top Movies - Teli',
                text: text
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(text).then(() => {
                this.showToast('Copied to clipboard!', 'success');
            });
        }
    },

    /**
     * Copy profile link
     */
    copyProfileLink() {
        const url = Social.getShareUrl();
        navigator.clipboard.writeText(url).then(() => {
            this.showToast('Profile link copied!', 'success');
        });
    },

    // ==================
    // Data Management
    // ==================

    /**
     * Export data
     */
    exportData() {
        const data = Storage.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `teli-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();

        URL.revokeObjectURL(url);
        this.showToast('Data exported successfully!', 'success');
    },

    /**
     * Import data
     */
    importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const success = Storage.importData(e.target.result);
            if (success) {
                this.refreshMovieList();
                this.updateStats();
                this.showToast('Data imported successfully!', 'success');
            } else {
                this.showToast('Failed to import data. Invalid format.', 'error');
            }
        };
        reader.readAsText(file);

        // Reset file input
        event.target.value = '';
    },

    /**
     * Clear all data
     */
    clearData() {
        if (confirm('Are you sure you want to delete all your data? This cannot be undone.')) {
            Storage.clearAllData();
            this.refreshMovieList();
            this.updateStats();
            this.updateGenres();
            this.refreshWatchlist();
            this.showToast('All data cleared');
        }
    },

    /**
     * Show API key setup modal
     */
    showApiKeyModal() {
        const input = document.getElementById('api-key-input');
        const status = document.getElementById('api-status');

        // Pre-fill if key exists
        if (MoviesAPI.hasApiKey()) {
            input.value = MoviesAPI.API_KEY;
            status.textContent = 'API key is configured';
            status.className = 'api-status success';
        } else {
            input.value = '';
            status.textContent = '';
            status.className = 'api-status';
        }

        this.openModal('api-key-modal');
    },

    /**
     * Save API key
     */
    async saveApiKey() {
        const input = document.getElementById('api-key-input');
        const status = document.getElementById('api-status');
        const key = input.value.trim();

        if (!key) {
            status.textContent = 'Please enter an API key';
            status.className = 'api-status error';
            return;
        }

        status.textContent = 'Testing API key...';
        status.className = 'api-status';

        // Test the API key with OMDb
        try {
            const response = await fetch(
                `https://www.omdbapi.com/?apikey=${key}&i=tt0111161`
            );

            const data = await response.json();

            if (data.Response === 'True') {
                MoviesAPI.setApiKey(key);
                status.textContent = 'API key saved successfully!';
                status.className = 'api-status success';
                this.showToast('API key configured! You can now search IMDB.', 'success');

                setTimeout(() => {
                    this.closeModal('api-key-modal');
                }, 1000);
            } else {
                status.textContent = data.Error || 'Invalid API key. Please check and try again.';
                status.className = 'api-status error';
            }
        } catch (error) {
            status.textContent = 'Could not verify key. Check your connection.';
            status.className = 'api-status error';
        }
    },

    // ==================
    // Utilities
    // ==================

    /**
     * Get relative time string
     */
    getTimeAgo(timestamp) {
        const now = new Date();
        const then = new Date(timestamp);
        const diff = Math.floor((now - then) / 1000);

        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
        return then.toLocaleDateString();
    },

    /**
     * Open a modal
     */
    openModal(modalId) {
        document.getElementById(modalId).classList.add('active');
        document.body.style.overflow = 'hidden';
    },

    /**
     * Close a modal
     */
    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
        document.body.style.overflow = '';
    },

    /**
     * Show toast notification
     */
    showToast(message, type = '') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());

// Make App available globally for debugging
window.App = App;
