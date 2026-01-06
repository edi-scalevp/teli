/**
 * Teli Test Suite
 * Tests for Elo ranking and core functionality
 *
 * Run in browser console or include in test page
 */

const TeliTests = {
    passed: 0,
    failed: 0,
    results: [],

    // Test helper functions
    assert(condition, testName) {
        if (condition) {
            this.passed++;
            this.results.push({ name: testName, status: 'PASS' });
            console.log(`✅ PASS: ${testName}`);
        } else {
            this.failed++;
            this.results.push({ name: testName, status: 'FAIL' });
            console.error(`❌ FAIL: ${testName}`);
        }
    },

    assertEqual(actual, expected, testName) {
        const pass = actual === expected;
        if (!pass) {
            console.error(`   Expected: ${expected}, Got: ${actual}`);
        }
        this.assert(pass, testName);
    },

    assertClose(actual, expected, tolerance, testName) {
        const pass = Math.abs(actual - expected) <= tolerance;
        if (!pass) {
            console.error(`   Expected: ~${expected} (±${tolerance}), Got: ${actual}`);
        }
        this.assert(pass, testName);
    },

    // Run all tests
    runAll() {
        console.log('🧪 Running Teli Test Suite...\n');
        this.passed = 0;
        this.failed = 0;
        this.results = [];

        this.testEloExpectedScore();
        this.testEloNewRatings();
        this.testEloRatingToScore();
        this.testEloInitialRating();
        this.testEloComparisonSelection();
        this.testStorageAddMovie();
        this.testStorageUpdateRating();
        this.testStorageHasMovie();
        this.testFullRankingFlow();
        this.testSocialProfile();
        this.testWatchlist();
        this.testCuratedLists();

        console.log('\n' + '='.repeat(50));
        console.log(`Results: ${this.passed} passed, ${this.failed} failed`);
        console.log('='.repeat(50));

        return { passed: this.passed, failed: this.failed, results: this.results };
    },

    // === ELO RATING TESTS ===

    testEloExpectedScore() {
        console.log('\n--- Elo Expected Score Tests ---');

        // Equal ratings should give 0.5 expected score
        const equal = EloRating.getExpectedScore(1500, 1500);
        this.assertClose(equal, 0.5, 0.001, 'Equal ratings give 0.5 expected score');

        // Higher rated player should have higher expected score
        const higher = EloRating.getExpectedScore(1600, 1400);
        this.assert(higher > 0.5, 'Higher rated player has >0.5 expected score');
        this.assertClose(higher, 0.76, 0.01, 'Rating diff of 200 gives ~0.76 expected');

        // Lower rated player should have lower expected score
        const lower = EloRating.getExpectedScore(1400, 1600);
        this.assert(lower < 0.5, 'Lower rated player has <0.5 expected score');

        // Expected scores should sum to 1
        const sum = higher + lower;
        this.assertClose(sum, 1.0, 0.001, 'Expected scores sum to 1.0');

        // 400 point difference should give ~10x likelihood
        const big = EloRating.getExpectedScore(1900, 1500);
        this.assertClose(big, 0.909, 0.01, '400 point diff gives ~0.91 expected');
    },

    testEloNewRatings() {
        console.log('\n--- Elo New Ratings Tests ---');

        // When higher rated wins (expected outcome)
        const expected1 = EloRating.calculateNewRatings(1600, 1400, 1);
        this.assert(expected1.ratingA > 1600, 'Winner rating increases');
        this.assert(expected1.ratingB < 1400, 'Loser rating decreases');
        this.assert(expected1.ratingA > expected1.ratingB, 'Winner ranks higher than loser');

        // When lower rated wins (upset) - preference constraint kicks in
        const upset = EloRating.calculateNewRatings(1400, 1600, 1);
        this.assert(upset.ratingA > upset.ratingB, 'Upset winner ranks higher (preference constraint)');

        // Draw between equal players
        const draw = EloRating.calculateNewRatings(1500, 1500, 0.5);
        this.assertEqual(draw.ratingA, 1500, 'Draw between equals: A unchanged');
        this.assertEqual(draw.ratingB, 1500, 'Draw between equals: B unchanged');

        // Preference constraint: if A wins, A must rank >= B
        const bigUpset = EloRating.calculateNewRatings(1200, 1800, 1);
        this.assert(bigUpset.ratingA > bigUpset.ratingB, 'Big upset: winner still ranks higher');

        // Preference constraint: if B wins, B must rank >= A
        const preferB = EloRating.calculateNewRatings(1800, 1200, 0);
        this.assert(preferB.ratingB > preferB.ratingA, 'When B preferred, B ranks higher');

        // Minimum rating should be enforced
        const lowRating = EloRating.calculateNewRatings(150, 1800, 0);
        this.assert(lowRating.ratingA >= 100, 'Minimum rating of 100 enforced');
    },

    testEloRatingToScore() {
        console.log('\n--- Elo Rating to Score Tests ---');

        // Single movie should get default score
        const single = EloRating.ratingToScore(1500, 1500, 1500);
        this.assertEqual(single, 7.5, 'Single movie gets 7.5 score');

        // Highest rated should get 10
        const highest = EloRating.ratingToScore(1800, 1200, 1800);
        this.assertEqual(highest, 10, 'Highest rated gets 10');

        // Lowest rated should get 1
        const lowest = EloRating.ratingToScore(1200, 1200, 1800);
        this.assertEqual(lowest, 1, 'Lowest rated gets 1');

        // Middle rated should get ~5.5
        const middle = EloRating.ratingToScore(1500, 1200, 1800);
        this.assertEqual(middle, 5.5, 'Middle rated gets 5.5');

        // Score should be proportional
        const quarter = EloRating.ratingToScore(1350, 1200, 1800);
        this.assertClose(quarter, 3.25, 0.1, 'Quarter point gets ~3.25');
    },

    testEloInitialRating() {
        console.log('\n--- Elo Initial Rating Tests ---');

        // First movie with "liked" should get higher rating
        const likedFirst = EloRating.getInitialRating('liked', []);
        this.assertEqual(likedFirst, 1600, 'First liked movie gets 1600');

        // First movie with "fine" should get base rating
        const fineFirst = EloRating.getInitialRating('fine', []);
        this.assertEqual(fineFirst, 1500, 'First fine movie gets 1500');

        // First movie with "disliked" should get lower rating
        const dislikedFirst = EloRating.getInitialRating('disliked', []);
        this.assertEqual(dislikedFirst, 1400, 'First disliked movie gets 1400');

        // With existing movies, should be relative to average
        const existingMovies = [
            { rating: 1600 },
            { rating: 1400 },
            { rating: 1500 }
        ];
        const avgRating = 1500;

        const likedExisting = EloRating.getInitialRating('liked', existingMovies);
        this.assertEqual(likedExisting, avgRating + 100, 'Liked with existing: avg + 100');

        const fineExisting = EloRating.getInitialRating('fine', existingMovies);
        this.assertEqual(fineExisting, avgRating, 'Fine with existing: avg');

        const dislikedExisting = EloRating.getInitialRating('disliked', existingMovies);
        this.assertEqual(dislikedExisting, avgRating - 100, 'Disliked with existing: avg - 100');
    },

    testEloComparisonSelection() {
        console.log('\n--- Elo Comparison Selection Tests ---');

        // No movies should return empty array
        const empty = EloRating.selectComparisonMovies({ rating: 1500 }, [], 5);
        this.assertEqual(empty.length, 0, 'No existing movies returns empty');

        // Fewer movies than max should return all
        const fewMovies = [
            { id: 1, rating: 1600 },
            { id: 2, rating: 1400 }
        ];
        const few = EloRating.selectComparisonMovies({ rating: 1500 }, fewMovies, 5);
        this.assertEqual(few.length, 2, 'Returns all when fewer than max');

        // Should select strategically from many movies
        const manyMovies = [];
        for (let i = 0; i < 20; i++) {
            manyMovies.push({ id: i, rating: 1200 + i * 40 });
        }
        const selected = EloRating.selectComparisonMovies({ rating: 1500 }, manyMovies, 5);
        this.assertEqual(selected.length, 5, 'Selects exactly max comparisons');

        // Should include highest and lowest
        const ratings = selected.map(m => m.rating);
        this.assert(ratings.includes(1960), 'Includes highest rated');
        this.assert(ratings.includes(1200), 'Includes lowest rated');
    },

    // === STORAGE TESTS ===

    testStorageAddMovie() {
        console.log('\n--- Storage Add Movie Tests ---');

        // Clear storage first
        localStorage.removeItem('teli_movies');

        const movie = {
            id: 'tt9999999',
            title: 'Test Movie',
            year: 2024,
            rating: 1500,
            genres: ['Action']
        };

        Storage.addMovie(movie);
        const movies = Storage.loadMovies();

        this.assertEqual(movies.length, 1, 'Movie was added');
        this.assertEqual(movies[0].id, 'tt9999999', 'Movie ID matches');
        this.assertEqual(movies[0].title, 'Test Movie', 'Movie title matches');
        this.assert(movies[0].addedAt, 'addedAt timestamp exists');

        // Clean up
        localStorage.removeItem('teli_movies');
    },

    testStorageUpdateRating() {
        console.log('\n--- Storage Update Rating Tests ---');

        localStorage.removeItem('teli_movies');

        Storage.addMovie({ id: 'tt1111111', title: 'Movie 1', rating: 1500 });
        Storage.addMovie({ id: 'tt2222222', title: 'Movie 2', rating: 1500 });

        Storage.updateMovieRating('tt1111111', 1600);
        const movies = Storage.loadMovies();

        const movie1 = movies.find(m => m.id === 'tt1111111');
        const movie2 = movies.find(m => m.id === 'tt2222222');

        this.assertEqual(movie1.rating, 1600, 'Movie 1 rating updated');
        this.assertEqual(movie2.rating, 1500, 'Movie 2 rating unchanged');

        localStorage.removeItem('teli_movies');
    },

    testStorageHasMovie() {
        console.log('\n--- Storage Has Movie Tests ---');

        localStorage.removeItem('teli_movies');

        Storage.addMovie({ id: 'tt3333333', title: 'Existing Movie', rating: 1500 });

        this.assert(Storage.hasMovie('tt3333333'), 'hasMovie returns true for existing');
        this.assert(!Storage.hasMovie('tt4444444'), 'hasMovie returns false for non-existing');

        localStorage.removeItem('teli_movies');
    },

    // === INTEGRATION TESTS ===

    testFullRankingFlow() {
        console.log('\n--- Full Ranking Flow Test ---');

        localStorage.removeItem('teli_movies');
        localStorage.removeItem('teli_comparisons');

        // Add first movie (no comparisons needed)
        const movie1 = { id: 'tt0001', title: 'First Movie', rating: 1600, genres: ['Drama'] };
        Storage.addMovie(movie1);

        let movies = Storage.loadMovies();
        this.assertEqual(movies.length, 1, 'First movie added');

        // Add second movie with comparison
        const movie2 = { id: 'tt0002', title: 'Second Movie', rating: 1500, genres: ['Action'] };

        // Simulate: movie2 beats movie1
        const { ratingA, ratingB } = EloRating.calculateNewRatings(movie2.rating, movie1.rating, 1);
        movie2.rating = ratingA;
        Storage.updateMovieRating(movie1.id, ratingB);
        Storage.addMovie(movie2);

        movies = Storage.loadMovies();
        this.assertEqual(movies.length, 2, 'Second movie added');

        // Movie 2 should now have higher rating than movie 1
        const m1 = movies.find(m => m.id === 'tt0001');
        const m2 = movies.find(m => m.id === 'tt0002');
        this.assert(m2.rating > m1.rating, 'Winner has higher rating after comparison');

        // Check scores are calculated correctly
        const moviesWithScores = Storage.getMoviesWithScores();
        this.assertEqual(moviesWithScores[0].id, 'tt0002', 'Higher rated movie is first');
        this.assertEqual(moviesWithScores[0].score, 10, 'Top movie gets score of 10');
        this.assertEqual(moviesWithScores[1].score, 1, 'Bottom movie gets score of 1');

        // Clean up
        localStorage.removeItem('teli_movies');
        localStorage.removeItem('teli_comparisons');
    },

    // === SOCIAL TESTS ===

    testSocialProfile() {
        console.log('\n--- Social Profile Tests ---');

        // Clear profile first
        localStorage.removeItem('teli_profile');

        const profile = Social.getProfile();
        this.assert(profile.id, 'Profile has ID');
        this.assert(profile.username, 'Profile has username');
        this.assert(profile.avatar, 'Profile has avatar');

        // Update profile
        Social.updateProfile('displayName', 'Test User');
        const updated = Social.getProfile();
        this.assertEqual(updated.displayName, 'Test User', 'Profile displayName updated');

        // Clean up
        localStorage.removeItem('teli_profile');
    },

    testWatchlist() {
        console.log('\n--- Watchlist Tests ---');

        // Clear watchlist first
        localStorage.removeItem('teli_watchlist');

        const movie = { id: 'tt1234567', title: 'Test Movie', year: 2024, poster: '' };

        Social.addToWatchlist(movie);
        this.assert(Social.isInWatchlist('tt1234567'), 'Movie added to watchlist');

        const watchlist = Social.getWatchlist();
        this.assertEqual(watchlist.length, 1, 'Watchlist has 1 movie');

        Social.removeFromWatchlist('tt1234567');
        this.assert(!Social.isInWatchlist('tt1234567'), 'Movie removed from watchlist');

        // Clean up
        localStorage.removeItem('teli_watchlist');
    },

    testCuratedLists() {
        console.log('\n--- Curated Lists Tests ---');

        localStorage.removeItem('teli_movies');

        // Add test movies with genres
        const movies = [
            { id: 'tt001', title: 'Action 1', rating: 1800, genres: ['Action'], year: 2020 },
            { id: 'tt002', title: 'Action 2', rating: 1700, genres: ['Action'], year: 2021 },
            { id: 'tt003', title: 'Action 3', rating: 1600, genres: ['Action'], year: 2019 },
            { id: 'tt004', title: 'Drama 1', rating: 1500, genres: ['Drama'], year: 2020 },
            { id: 'tt005', title: 'Drama 2', rating: 1400, genres: ['Drama'], year: 2021 }
        ];

        movies.forEach(m => Storage.addMovie(m));

        const lists = Social.generateCuratedLists();
        this.assert(lists.length > 0, 'Curated lists generated');

        const topList = lists.find(l => l.id === 'top-overall');
        this.assert(topList, 'Top Overall list exists');
        this.assert(topList.movies.length <= 10, 'Top list has max 10 movies');

        // Clean up
        localStorage.removeItem('teli_movies');
    }
};

// Auto-run if in browser
if (typeof window !== 'undefined') {
    window.TeliTests = TeliTests;
    console.log('Teli Tests loaded. Run TeliTests.runAll() to execute tests.');
}
