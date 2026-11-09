# Mobile App Project

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://robbepoelsucll.github.io/UCLL-Mobile-Applications-Project-Robbe-Poels/">
    <img src="./public/icons/icon-512.png" alt="Logo" width="100" height="100">
  </a>
  
  <h3 align="center">PathFinder</h3>

  <p align="center">
    Discover new places, one small adventure at a time.
    <br />
    <br />
    <a href="https://robbepoelsucll.github.io/UCLL-Mobile-Applications-Project-Robbe-Poels/">View Demo</a>
    <br />
    <i>Demo login:</i> johndoe@example.com / John123!
  </p>
</div>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->
## About the project

The goal of this project is to create a mobile application that lets users discover new places in their surroundings, but with a twist. After a user selects one or more location themes, they are guided to a randomly selected location without knowing what the picked location is beforehand. This way the destination always remains a surprise until the moment they get there.

<!-- GETTING STARTED -->
## Getting started

### Prerequisites

- Node.js (necessary for running `npm` commands)

### Installation

1. Install project dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file (DO NOT COMMIT):

   ```properties
   EXPO_PUBLIC_SUPABASE_URL = <supabase-url>
   EXPO_PUBLIC_SUPABASE_ANON_KEY = <supabase-pass>
   EXPO_PUBLIC_CARTO_BASEMAP_KEY = <carto-basemap-key>
   ```

   _Get a free CARTO basemaps key at <https://carto.com/basemaps/apikey>._

3. Run the project:

   ```bash
   npx expo start
   ```

## Usage

Once the project is running, open `https://localhost:8081/` in a browser or scan the generated QR code in the [Expo GO app](https://expo.dev/go).

## Roadmap

- [x] Set up Supabase
- [x] Upgrade project to latest Expo SDK (58)
- [X] Add main pages (Home, Friends, Profile)
- [X] Implement location selection & route navigation
- [ ] Add more locations
- [ ] Add ability to add friends
- [ ] Implement XP-system and badges
- [ ] Add guest mode

## Acknowledgments

- [OpenStreetMap](https://www.openstreetmap.org)
- [Carto Basemaps](https://carto.com/basemaps/)
