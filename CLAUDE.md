# Teli - Project Context

## Overview
Teli is a Beli-inspired movie ranking app that uses an ELO-based comparison system instead of arbitrary 1-10 ratings. Users compare movies head-to-head, and the app calculates rankings based on these comparisons.

## Tech Stack
- **Vanilla HTML/CSS/JavaScript** - No frameworks, no build step
- **OMDb API** - Movie search (IMDB data)
- **localStorage** - Client-side data persistence
- **Service Worker** - PWA/offline support

## File Structure
```
teli/
├── index.html          # Main app (518 lines)
├── manifest.json       # PWA manifest
├── sw.js               # Service worker
├── netlify.toml        # Netlify deployment config
├── vercel.json         # Vercel deployment config
├── css/
│   └── styles.css      # All styles (~1958 lines)
├── js/
│   ├── app.js          # Main application logic (~1526 lines)
│   ├── elo.js          # ELO rating algorithm (209 lines)
│   ├── storage.js      # localStorage handling (295 lines)
│   ├── movies.js       # OMDb API integration (232 lines)
│   ├── social.js       # Friends, profiles, watchlist (737 lines)
│   └── tests.js        # Test suite (392 lines)
├── icons/
│   └── generate-icons.html  # PWA icon generator
└── tests.html          # Test runner page
```

## Key Modules

### js/elo.js
- `EloRating.getExpectedScore(ratingA, ratingB)` - Calculate win probability
- `EloRating.calculateNewRatings(ratingA, ratingB, scoreA)` - Update ratings after comparison
- `EloRating.ratingToScore(rating, min, max)` - Convert ELO to 1-10 scale
- `EloRating.selectComparisonMovies(newMovie, existing, max)` - Binary search selection

### js/storage.js
- `Storage.loadMovies()` / `Storage.saveMovies(movies)`
- `Storage.addMovie(movie)` / `Storage.removeMovie(id)`
- `Storage.getMoviesWithScores()` - Movies with calculated 1-10 scores
- `Storage.exportData()` / `Storage.importData(json)`

### js/movies.js
- `MoviesAPI.searchMovies(query)` - Search OMDb/IMDB
- `MoviesAPI.getMovieDetails(id)` - Get full movie info
- 30 demo movies available without API key

### js/social.js
- `Social.getProfile()` / `Social.updateProfile(field, value)`
- `Social.getFriends()` / `Social.addFriend(profile)`
- `Social.getWatchlist()` / `Social.addToWatchlist(movie)`
- `Social.calculateTasteProfile()` - Genre/decade preferences
- `Social.generateCuratedLists()` - Auto-generated lists

### js/app.js
- Main application controller
- View switching, modal handling
- Movie comparison flow
- Event binding

## Views (in index.html)
1. `#list-view` - Ranked movies list
2. `#search-view` - Add new movies
3. `#friends-view` - Friends & activity feed
4. `#watchlist-view` - Movies to watch
5. `#profile-view` - Profile, stats, settings

## Modals
- `#comparison-modal` - Compare two movies
- `#initial-rating-modal` - Quick "liked/fine/disliked"
- `#movie-detail-modal` - View movie details
- `#profile-edit-modal` - Edit profile
- `#movie-notes-modal` - Add notes/tags
- `#friend-profile-modal` - View friend
- `#list-detail-modal` - View curated list
- `#api-key-modal` - Configure OMDb API key

## Running Locally
```bash
python3 -m http.server 8000
# Open http://localhost:8000
```

## Deployment
- **Netlify**: Drag & drop folder (easiest)
- **Vercel**: Run `vercel` in directory
- **GitHub Pages**: Push to repo, enable Pages

## Testing
Open `tests.html` in browser or run `TeliTests.runAll()` in console.

## API Key (Optional)
Get free OMDb key at https://www.omdbapi.com/apikey.aspx
Configure in app: Profile > Setup IMDB API Key
