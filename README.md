# Ace Google Map Block

An interactive Google Maps block for the WordPress block editor, with Street View and Places search.

By Shane Rounce / AceMedia.

## Features

- Interactive map inside the block editor, with a droppable marker and editable latitude, longitude and address.
- Google Places Autocomplete search; the address field updates from a chosen place or from reverse geocoding a map click.
- Street View toggle with heading and pitch controls.
- Zoom level, show marker, map style, "Map as Image" and "Map as Background" options per block.
- Per-block switches to disable map movement, zoom and labels.
- Site-wide defaults and your Google Maps API key on a settings page.

## Requirements

- WordPress 6.6 or later
- PHP 7.2 or later
- A Google Maps API key (Maps JavaScript, Places and Street View access enabled in your Google Cloud project)

## Installation

### From a release (recommended)

1. Download the zip from the [latest GitHub Release](https://github.com/AceMedia/Ace-Google-Map-Block/releases/latest).
2. In WordPress go to **Plugins > Add New > Upload Plugin**, choose the zip and click **Install Now**.
3. Click **Activate**.

The plugin also contains an `update.php` that checks this repository's latest GitHub Release for new versions.

### From source

```bash
git clone https://github.com/AceMedia/Ace-Google-Map-Block.git
cd Ace-Google-Map-Block
npm install
npm run build
npm run plugin-zip
```

Upload the generated zip, or copy the folder into `wp-content/plugins/` and activate it. Note that `npm run build` moves the compiled output into `assets/`.

## Usage

1. Go to **Settings > Google Maps Block** and enter your API key.
2. Edit a post or page and add the **Ace Map Block** (block name `acemedia/google-map`).
3. Search for a place or set the coordinates, then adjust options in the block inspector. Use "Is Street View?" to switch to Street View.

## Configuration

Under **Settings > Google Maps Block**: Google Maps API Key, Default City, and map defaults Disable Zoom, Disable Labels, Disable UI Buttons and Disable Map Movement.

## Development

```bash
npm install
npm start          # watch
npm run build      # build and move output to assets/
npm run watch-css
npm run lint:js
npm run lint:css
npm run format
npm run plugin-zip
```

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

## Licence

GPL-2.0-or-later. See [LICENSE](LICENSE) and <https://www.gnu.org/licenses/gpl-2.0.html>.

Author: Shane Rounce / AceMedia. Repository: <https://github.com/AceMedia/Ace-Google-Map-Block>
