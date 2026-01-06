# Teli - Your Personal Movie Rankings

A Beli-inspired app for tracking and ranking movies you've seen. Instead of arbitrary 1-10 ratings, Teli uses a comparison-based Elo system to determine your true preferences.

## Features

### Core Features
- **Comparison-based ranking** - Instead of picking arbitrary numbers, compare movies to each other
- **Elo rating system** - Your rankings evolve with every comparison, just like chess ratings
- **Color-coded scores** - Green for excellent, red for poor - see your preferences at a glance
- **IMDB integration** - Search millions of movies via OMDb API
- **30 demo movies** - Works out of the box without any API key

### Social Features (Like Beli!)
- **User profiles** - Customize your avatar, username, and bio
- **Friends system** - Add friends and see their movie ratings
- **Activity feed** - See what movies your friends are rating
- **Friend score averaging** - See how your friends rated the same movies

### Personal Features
- **Watchlist** - Save movies you want to watch later
- **Movie notes** - Write reviews and tag movies (rewatchable, emotional, etc.)
- **Taste profile** - See your genre preferences, rating distribution, and decade preferences
- **Share rankings** - Share your top movies or individual ratings

### Technical Features
- **Progressive Web App (PWA)** - Install on your phone like a native app
- **Offline support** - Works without internet after first load
- **Export/Import** - Backup and restore your data
- **No backend required** - Everything stored locally in your browser

## How It Works

1. **Add a Movie** - Search for any movie and give a quick impression ("I liked it!", "It was fine", "Didn't like it")
2. **Compare** - Teli asks you to compare the new movie against 3-5 movies you've already ranked
3. **Get Your Score** - Based on your comparisons, Teli calculates a 1-10 score using an Elo rating system

The more movies you rate and compare, the more accurate your rankings become!

## Quick Deploy

### Option 1: Netlify (Easiest - Drag & Drop)

1. Go to [netlify.com](https://netlify.com) and sign up (free)
2. Drag and drop the entire `teli` folder onto the Netlify dashboard
3. Done! Your app is live with a URL like `random-name.netlify.app`

**To get a custom domain:**
- In Netlify, go to Domain settings > Add custom domain

### Option 2: Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in this folder
3. Follow the prompts (hit Enter for defaults)
4. Your site is live!

### Option 3: GitHub Pages (Free)

1. Create a new GitHub repository
2. Upload all files to the repo
3. Go to Settings > Pages
4. Under "Source", select "Deploy from a branch" and choose `main`
5. Your site will be live at `https://yourusername.github.io/repo-name`

**Note:** For GitHub Pages, update `sw.js` to use relative paths:
```javascript
const STATIC_ASSETS = [
    './',
    './index.html',
    './css/styles.css',
    // ... etc
];
```

### Option 4: Any Static Host

Just upload all files to any web server. No build step required! Works with:
- AWS S3 + CloudFront
- Google Cloud Storage
- DigitalOcean Spaces
- Firebase Hosting
- Surge.sh
- Render
- Railway

## Setting Up IMDB Search (Optional but Recommended)

The app includes 30 popular demo movies that work without any setup. For full IMDB search:

1. Go to [omdbapi.com/apikey.aspx](https://www.omdbapi.com/apikey.aspx)
2. Request a FREE API key (select "Free" tier - 1,000 requests/day)
3. Check your email and activate the key
4. In the app, go to **Profile > Setup IMDB API Key**
5. Paste your key and save

Now you can search any movie from IMDB!

## Installing as a PWA (Add to Home Screen)

### On iPhone/iPad:
1. Open the app in Safari
2. Tap the Share button (square with arrow)
3. Tap "Add to Home Screen"
4. Tap "Add"

### On Android:
1. Open the app in Chrome
2. Tap the menu (three dots)
3. Tap "Add to Home screen" or "Install app"

### On Desktop:
1. In Chrome, click the install icon in the address bar
2. Or go to Menu > "Install Teli"

## File Structure

```
teli/
├── index.html          # Main HTML file
├── manifest.json       # PWA manifest
├── sw.js               # Service worker for offline support
├── css/
│   └── styles.css      # All styles (~1800 lines)
├── js/
│   ├── elo.js          # Elo rating algorithm
│   ├── storage.js      # localStorage handling
│   ├── movies.js       # OMDb/IMDB API integration
│   ├── social.js       # Friends, watchlist, profiles
│   └── app.js          # Main application logic (~1400 lines)
├── icons/
│   └── generate-icons.html  # Icon generator
├── netlify.toml        # Netlify config with security headers
├── vercel.json         # Vercel config with clean URLs
└── README.md           # This file
```

## Generating PWA Icons

1. Open `icons/generate-icons.html` in a browser
2. Click "Generate All Icons"
3. Right-click each canvas and "Save image as..." with the filename shown
4. Save all icons in the `icons/` folder

Or use any icon generator service like:
- [realfavicongenerator.net](https://realfavicongenerator.net/)
- [maskable.app](https://maskable.app/) for maskable icons

## Tech Stack

- **Vanilla HTML, CSS, JavaScript** - No frameworks, no build step!
- **OMDb API** - Open Movie Database (IMDB data)
- **Elo rating system** - Same algorithm used in chess rankings
- **localStorage** - Client-side data persistence
- **Service Workers** - PWA offline support

## How the Elo System Works

The Elo rating system was originally designed for chess. In Teli:

1. Every movie starts with a base rating of 1500
2. When you compare two movies, the winner gains points and the loser loses points
3. The amount gained/lost depends on the "expected" outcome
4. If a low-rated movie beats a high-rated one, it gains MORE points (upset bonus)
5. Ratings are converted to a 1-10 scale based on your personal min/max ratings

This means your rankings are always relative to YOUR preferences, not some absolute scale.

## Demo Movies (No API Key Required)

Search for any of these movies without an API key:
- The Shawshank Redemption, The Godfather, The Dark Knight
- Pulp Fiction, Forrest Gump, Fight Club, Inception
- The Matrix, Interstellar, Parasite, Whiplash
- The Lord of the Rings trilogy, Star Wars
- And 15 more classics...

## Privacy

- All your data is stored locally in your browser
- No accounts, no servers, no tracking
- Export your data anytime as JSON
- Your ratings never leave your device

## Inspired By

- [Beli App](https://beliapp.com/) - The original restaurant ranking app
- [Elo Rating System](https://en.wikipedia.org/wiki/Elo_rating_system) - Chess rating algorithm
- [OMDb API](https://www.omdbapi.com/) - Open Movie Database (IMDB data)
- [Letterboxd](https://letterboxd.com/) - Social movie tracking

## Contributing

Feel free to fork, modify, and submit PRs! Some ideas:

- [ ] Backend integration for real multi-user social features
- [ ] More comparison algorithms (TrueSkill, Glicko-2)
- [ ] Movie recommendations based on taste profile
- [ ] TV show support
- [ ] Lists and collections feature
- [ ] Dark/light theme toggle

## License

MIT - Feel free to modify and use however you like!

---

Made with popcorn and passion. Happy ranking!
