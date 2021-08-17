# TVStream
IPTV system that randomly selects episodes to play from disk.

## Notes
- Requires WEBM media.

## Setup
1. Install requirements:  
    `npm install`
2. Change the `SHOWDIR` path in `index.js` to where your shows are stored

## Known issues
- Database is refreshed on every restart, erasing manual changes
- Show names, episode names/numbers, and season numbers are ignored
- Channel orders are regenerated on every refresh, rather than being consistent between users + refreshes
- Probably has security issues, idk I don't like webdev

## Todo
- Fix all known issues
- Add TV guide that displays show names and timelines for every channel
- Refresh channel list rather than looping when finishing channel