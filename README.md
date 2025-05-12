# RedGifs Downloader Browser Extension

A browser extension that allows you to download videos from RedGifs with a single click. This extension adds download buttons directly to RedGifs pages and provides a popup interface for bulk downloading.

![RedGifs Downloader Logo](images/logo.png)

## Features

- 🚀 One-click video downloads directly from RedGifs pages
- 📦 Batch download support for multiple videos
- 🎯 Download by URL functionality
- 🔄 Automatically detects videos on RedGifs pages
- 📱 Clean, intuitive user interface

## Installation

### Manual Installation (Developer Mode)

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top-right corner
4. Click "Load unpacked" and select the extension directory
5. The extension should now be installed and ready to use

## Usage

### Downloading from RedGifs Pages

1. Visit any RedGifs page
2. Download buttons will be automatically added to each video
3. Click the "Download" button next to any video to save it to your device
4. Use the "Download All Videos" button (fixed in the bottom-right) to batch download all videos on the page

### Using the Popup Interface

1. Click the RedGifs Downloader icon in your browser toolbar
2. If you're on a RedGifs page, the extension will detect videos automatically
3. Otherwise, enter RedGifs URLs (one per line) in the text area
4. Click "Download" to process the URLs
5. Use the download links in the results section to save videos

## Development

### Prerequisites

- Node.js and npm (for building/testing)
- Chrome or compatible browser

### Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/redgifs-downloader.git
   cd redgifs-downloader
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the extension directory

### Building

To build the extension for production:

```
npm run build
```

This will create a `.zip` file in the `dist` directory that can be uploaded to the Chrome Web Store.

## Privacy Policy

This extension only functions on RedGifs websites. It does not collect, store, or transmit any personal data. The extension uses the RedGifsDownloader.net API for video processing, which may log basic usage information.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Credits

- Powered by the [RedGifsDownloader.net](https://redgifsdownloader.net/) API
- Icons and interface designed by RedGifsDownloader.net

## Disclaimer

This extension is not affiliated with RedGifs. It is provided for educational and personal use only. Please respect copyright and terms of service for all content.
