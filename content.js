// Content script for RedGifs Downloader extension
// This script is injected into RedGifs pages

(function () {
  // API key is defined by the backend
  const API_KEY = '07327cddd852636a9063dc8fabcffd7fc22ead9b6ab9cc655013952ec2cb818d'; // This key will be replaced by the backend

  // Style elements for download buttons
  const style = document.createElement('style');
  style.textContent = `
    .rg-downloader-button {
      background-color: #fd3164;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 6px 10px;
      font-size: 13px;
      font-weight: bold;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.2s;
      margin-top: 5px;
      width: 100%;
      position: relative;
      z-index: 1000;
    }
    
    .rg-downloader-button:hover {
      background-color: #ff4778;
    }
    
    .rg-downloader-button.loading {
      background-color: #888;
      cursor: wait;
    }
    
    .rg-downloader-button.success {
      background-color: #4caf50;
    }
    
    .rg-downloader-icon {
      margin-right: 5px;
      display: inline-flex;
    }
    
    .rg-downloader-fixed-button {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 10000;
      padding: 10px 15px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    }
  `;
  document.head.appendChild(style);

  // Function to extract video ID from URL or element
  function getVideoId(url) {
    if (!url) return null;

    // If it's a complete URL
    if (url.includes('/watch/')) {
      return url.split('/watch/').pop().split('?')[0].split('#')[0];
    }

    // If it's just the ID
    return url;
  }

  // Function to get video URL from an element
  function getVideoUrlFromElement(element) {
    // Check if it has an id attribute with the gif name
    const gifId = element.id;
    if (gifId && gifId.startsWith('gif_')) {
      const videoId = gifId.replace('gif_', '');
      return `https://www.redgifs.com/watch/${videoId}`;
    }

    // Look for a link to the video page
    const linkElement = element.querySelector('a[href*="/watch/"]');
    if (linkElement) {
      return linkElement.href;
    }

    // Try to find link in user info area
    const userInfoLink = element.querySelector('.UserInfo-Date[href*="/watch/"]');
    if (userInfoLink) {
      return userInfoLink.href;
    }

    // Check if there's a video or media element with URL
    const videoElement = element.querySelector('video');
    if (videoElement && videoElement.src) {
      const blobUrl = videoElement.src;
      // We can't use blob URLs directly
      // Let's try to find the video ID in other attributes

      // Check the parent element for classes that might contain the ID
      const parent = element.closest('[id]');
      if (parent && parent.id) {
        const idMatch = parent.id.match(/gif_(.+)/);
        if (idMatch && idMatch[1]) {
          return `https://www.redgifs.com/watch/${idMatch[1]}`;
        }
      }
    }

    return null;
  }

  // Function to create download button
  function createDownloadButton(videoUrl) {
    const button = document.createElement('button');
    button.className = 'rg-downloader-button';
    button.dataset.videoUrl = videoUrl;

    // Download icon
    const iconSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 5px;">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
    `;

    const iconSpan = document.createElement('span');
    iconSpan.className = 'rg-downloader-icon';
    iconSpan.innerHTML = iconSvg;

    const textSpan = document.createElement('span');
    textSpan.textContent = 'Download';

    button.appendChild(iconSpan);
    button.appendChild(textSpan);

    // Add click event
    button.addEventListener('click', handleDownloadButtonClick);

    return button;
  }

  // Function to create fixed download all button
  function createFixedDownloadAllButton() {
    const button = document.createElement('button');
    button.className = 'rg-downloader-button rg-downloader-fixed-button';
    button.textContent = 'Download All Videos';
    button.addEventListener('click', handleDownloadAllButtonClick);
    return button;
  }

  // Function to handle download button click
  function handleDownloadButtonClick(event) {
    event.preventDefault();
    event.stopPropagation();

    const button = event.currentTarget;
    const videoUrl = button.dataset.videoUrl;

    if (!videoUrl) {
      console.error('Video URL not found');
      return;
    }

    // Update button state
    button.disabled = true;
    button.classList.add('loading');
    const originalText = button.textContent;
    button.innerHTML = `
      <span class="rg-downloader-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite;">
          <circle cx="12" cy="12" r="10" stroke-dasharray="40" stroke-dashoffset="20"></circle>
        </svg>
      </span>
      <span>Processing...</span>
    `;

    // Make request to download the video
    downloadVideo(videoUrl, button);
  }

  // Function to handle download all videos
  function handleDownloadAllButtonClick() {
    const allButtons = document.querySelectorAll('.rg-downloader-button:not(.rg-downloader-fixed-button)');

    // Simulate click on each button with a small delay to avoid overloading
    let delay = 0;
    allButtons.forEach((button) => {
      setTimeout(() => {
        if (!button.disabled) {
          button.click();
        }
      }, delay);
      delay += 1000; // 1 second interval between downloads
    });
  }

  // Function to download video using the API
  async function downloadVideo(videoUrl, button) {
    try {
      // Create API URL and fully encode it
      const baseApiUrl = `https://redgifsdownloader.net/api/download/posts%3Furls%3D${encodeURIComponent(videoUrl)}%26key%3D${API_KEY}`;
      const apiUrl = `https://proxy.redgifsdownloader.net?url=${baseApiUrl}`;

      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data && data.posts && data.posts.length > 0) {
        const post = data.posts[0];

        if (post.status === 'success' && post.content && post.content.file) {
          // MODIFICATION HERE: Use the proxy URL for download instead of direct link
          const fileName = post.content.file.split('/').pop() || 'redgifs_video.mp4';
          const downloadUrl = `https://download.redgifsdownloader.net/?url=${encodeURIComponent(post.content.file)}&filename=${encodeURIComponent(fileName)}`;

          // Create download link and configure to open in new tab
          const downloadLink = document.createElement('a');
          downloadLink.href = downloadUrl;
          downloadLink.target = '_blank'; // MODIFICATION: Open in new tab
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);

          // Update button to success
          button.classList.remove('loading');
          button.classList.add('success');
          button.innerHTML = `
          <span class="rg-downloader-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 6L9 17l-5-5"></path>
            </svg>
          </span>
          <span>Downloaded</span>
        `;

          // Reset button after 2 seconds
          setTimeout(() => {
            resetButton(button);
          }, 2000);

          return true;
        } else {
          throw new Error(post.message || 'Failed to process video');
        }
      } else {
        throw new Error('Invalid API response');
      }
    } catch (error) {
      console.error('Error downloading video:', error);

      // Update button to error
      button.classList.remove('loading');
      button.innerHTML = `
      <span class="rg-downloader-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
      </span>
      <span>Error</span>
    `;

      // Reset button after 2 seconds
      setTimeout(() => {
        resetButton(button);
      }, 2000);

      return false;
    }
  }

  // Function to reset button
  function resetButton(button) {
    if (!button) return;

    button.disabled = false;
    button.classList.remove('loading', 'success');
    button.innerHTML = `
      <span class="rg-downloader-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
      </span>
      <span>Download</span>
    `;
  }

  // Add download buttons to all videos on the page
  function addDownloadButtonsToVideos() {
    // Look for RedGifs video elements
    const videoElements = document.querySelectorAll('.GifPreview');
    let videosFound = 0;

    videoElements.forEach((element) => {
      // Check if it already has a download button
      if (element.querySelector('.rg-downloader-button')) {
        return;
      }

      // Get video URL
      const videoUrl = getVideoUrlFromElement(element);

      if (videoUrl) {
        // Find where to insert the button
        let insertLocation = element.querySelector('.MetaInfo') ||
          element.querySelector('.GifPreview-MetaInfo') ||
          element;

        // Create download button
        const downloadButton = createDownloadButton(videoUrl);

        // Add button to element
        insertLocation.appendChild(downloadButton);
        videosFound++;
      }
    });

    // Add fixed button to download all videos if found videos
    if (videosFound > 0 && !document.querySelector('.rg-downloader-fixed-button')) {
      const downloadAllButton = createFixedDownloadAllButton();
      document.body.appendChild(downloadAllButton);
    }

    return videosFound;
  }

  // Run when page is loaded
  function initialize() {
    // Add buttons to videos
    const videosFound = addDownloadButtonsToVideos();
    console.log(`RedGifs Downloader: ${videosFound} videos found`);

    // Create a MutationObserver to detect new videos loaded dynamically
    const observer = new MutationObserver(function (mutations) {
      let shouldAddButtons = false;

      mutations.forEach(function (mutation) {
        if (mutation.addedNodes.length > 0) {
          for (let i = 0; i < mutation.addedNodes.length; i++) {
            const node = mutation.addedNodes[i];
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Check if added element or its children contain video elements
              if (node.classList && (
                node.classList.contains('GifPreview') ||
                node.querySelector('.GifPreview'))
              ) {
                shouldAddButtons = true;
                break;
              }
            }
          }
        }
      });

      if (shouldAddButtons) {
        const newVideosFound = addDownloadButtonsToVideos();
        if (newVideosFound > 0) {
          console.log(`RedGifs Downloader: ${newVideosFound} new videos found`);
        }
      }
    });

    // Start observing DOM changes
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Also check again after scrolling (for lazy loading)
    let scrollTimeout;
    window.addEventListener('scroll', function () {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(function () {
        addDownloadButtonsToVideos();
      }, 500);
    });
  }

  // Run initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.action === 'getVideoUrls') {
      // Collect all video URLs from the page
      const videoElements = document.querySelectorAll('.GifPreview');
      const urls = [];

      videoElements.forEach((element) => {
        const videoUrl = getVideoUrlFromElement(element);
        if (videoUrl) {
          urls.push(videoUrl);
        }
      });

      sendResponse({ urls: urls });
    }
  });
})();