# Les Bleus - France World Cup Squad

A single-page web application displaying FIFA Ultimate Team-style player cards for the France national team, built for the Interface Development final project.

## Overview

This project visualizes the France World Cup 2026 squad using EA FC 25 player ratings. Interactive FUT-style cards are positioned on a soccer pitch in a 4-3-3 formation. Users can click any card to view the player's biography, detailed stats, and a radar chart breakdown.

## Tech Stack

- **HTML/CSS/JS** with Flexbox-based responsive layout
- **Chart.js** for radar chart stat visualization (PAC, SHO, PAS, DRI, DEF, PHY)
- **GSAP** for intro animation, card entrance effects, and modal transitions
- **DiceBear** for pixel-art player avatars (URL-based, avoids copyright issues)
- **Fetch API** with async/await for JSON data loading

## Project Structure

```
fut-worldcup/
├── index.html        # Main page structure
├── style.css         # All styles
├── script.js         # Application logic
├── players.json      # France squad dataset (EA FC 25 ratings)
└── README.md
```

## Features

- Animated intro sequence: FFF crest fades in, then the pitch and cards emerge
- 4-3-3 formation layout on a styled soccer pitch
- 11 starting players + 3 substitutes
- Click any card to open a detail modal with bio, stats, and radar chart
- Goalkeeper uses separate stat categories (DIV, HAN, KIC, REF, SPD, POS)
- Responsive layout for desktop and mobile
- Semantic HTML and ARIA labels for accessibility

## Data Source

Player ratings from EA Sports FC 25 base gold cards via FUTBIN. Squad selection reflects France's likely World Cup 2026 roster.

## Live Demo

[GitHub Pages link]
