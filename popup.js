document.addEventListener('DOMContentLoaded', function () {  
  // Elements
  const urlsInput = document.getElementById('urls-input');
  const downloadBtn = document.getElementById('download-btn');
  const resultsContainer = document.getElementById('results');
  const currentVideoContainer = document.getElementById('current-video');

  // Find URLs from current page
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const currentUrl = tabs[0].url;
    console.log('Current URL:', currentUrl);

    if (currentUrl.includes('redgifs.com')) {
      console.log('RedGifs page detected, searching for videos...');
      
      // Send message to content script to get URLs
      chrome.tabs.sendMessage(tabs[0].id, { action: 'getVideoUrls' }, function (response) {
        console.log('Response from content script:', response);
        
        if (response && response.urls && response.urls.length > 0) {
          console.log('Videos found:', response.urls);
          
          // Fill textarea with URLs
          urlsInput.value = response.urls.join('\n');

          // Add information about found videos
          currentVideoContainer.innerHTML = `
            <p class="status-info">Found ${response.urls.length} videos on current page</p>
            <button id="download-all-btn" class="btn primary">Download All</button>
          `;

          // Add event for download all button
          document.getElementById('download-all-btn').addEventListener('click', function () {
            downloadBtn.click();
          });
        } else {
          console.log('No videos found on page');
          currentVideoContainer.innerHTML = `
            <p class="no-video">No RedGifs video detected on current page</p>
          `;
        }
      });
    } else {
      console.log('Not a RedGifs page');
      currentVideoContainer.innerHTML = `
        <p class="no-video">This page is not from RedGifs</p>
      `;
    }
  });

  // Download button click
  downloadBtn.addEventListener('click', function () {
    const urls = urlsInput.value.trim();
    console.log('URLs for download:', urls);

    if (!urls) {
      resultsContainer.innerHTML = `
        <p class="error-message">Please enter at least one URL</p>
      `;
      return;
    }

    // Clear previous results
    resultsContainer.innerHTML = '';

    // Split URLs by newline or semicolon
    const urlList = urls.split(/[\n;]/).map(url => url.trim()).filter(url => url !== '');
    console.log('Processed URL list:', urlList);

    // Process each URL
    urlList.forEach(url => {
      // Extract GIF ID/name from URL
      let gifId = url;

      if (url.includes('/watch/')) {
        gifId = url.split('/watch/').pop().split('?')[0].split('#')[0];
      }
      console.log('GIF ID:', gifId);

      // Create element for the result
      const resultElement = document.createElement('div');
      resultElement.className = 'video-result';

      // Create download URL
      const downloadUrl = `https://redgifsdownloader.net/?url=${encodeURIComponent(url)}`;
      console.log('Download URL:', downloadUrl);

      // Fill content
      resultElement.innerHTML = `
        <div class="video-info">
          <div class="video-title">${gifId}</div>
          <div class="video-actions">
            <a href="${downloadUrl}" target="_blank" class="btn primary">Download</a>
            <a href="${url}" target="_blank" class="btn secondary">View Original</a>
          </div>
        </div>
      `;

      // Add to container
      resultsContainer.appendChild(resultElement);
    });
  });
});

// Function to validate API key
async function validateApiKey(apiKey) {
  try {
    // Make a test request with a single URL
    const testUrl = 'https://www.redgifs.com/watch/example';
    const response = await fetchFromApi(testUrl, apiKey);

    // Check if authentication was successful
    return response &&
      response.authentication &&
      response.authentication.status === 'success';
  } catch (error) {
    console.error('Error validating API key:', error);
    return false;
  }
}

// Function to fetch video info for a single URL
async function fetchVideoInfo(url, apiKey) {
  return fetchFromApi(url, apiKey);
}

// Function to fetch video info for multiple URLs
async function fetchVideosInfo(urls, apiKey) {
  return fetchFromApi(urls.join('\n'), apiKey);
}

// Function to make request to the API via proxy
async function fetchFromApi(urls, apiKey) {
  try {
    // Create complete API URL with correct encoding
    const apiParams = `urls=${encodeURIComponent(urls)}&key=${apiKey}`;
    const fullApiUrl = `https://redgifsdownloader.net/api/download/posts?${apiParams}`;

    // Encode URL for proxy
    const encodedApiUrl = encodeURIComponent(fullApiUrl);

    // Create final URL with proxy
    const proxyUrl = `https://proxy.redgifsdownloader.net/?url=${encodedApiUrl}`;

    console.log('Final URL for request:', proxyUrl);

    const response = await fetch(proxyUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error making request:', error);
    throw error;
  }
}

// Function to render a video card
function renderVideoCard(post, container, isCurrent) {
  // Clear container if it's the current video
  if (isCurrent) {
    container.innerHTML = '';
    container.className = 'current-video has-video';
  }

  // Create thumbnail element
  const thumbnailElement = document.createElement('div');
  thumbnailElement.className = 'video-thumbnail';
  thumbnailElement.style.backgroundImage = `url('${post.thumbnail}')`;

  // Create info element
  const infoElement = document.createElement('div');
  infoElement.className = 'video-info';

  // Create title
  const titleElement = document.createElement('div');
  titleElement.className = 'video-title';
  titleElement.textContent = post.caption || 'Untitled';

  // Create author
  const authorElement = document.createElement('div');
  authorElement.className = 'video-author';
  authorElement.textContent = `by ${post.author?.name || 'anonymous'}`;

  // Create actions
  const actionsElement = document.createElement('div');
  actionsElement.className = 'video-actions';

  // Filename to be downloaded
  const fileName = post.content.file.split('/').pop() || 'redgifs_video.mp4';

  // Method 1: Download button that triggers fetch
  const downloadButton = document.createElement('button');
  downloadButton.className = 'btn primary';
  downloadButton.textContent = 'Download';
  downloadButton.addEventListener('click', async function () {
    try {
      // Show loading state
      downloadButton.textContent = 'Downloading...';
      downloadButton.disabled = true;

      // Download file using fetch
      const videoResponse = await fetch(post.content.file);
      const blob = await videoResponse.blob();

      // Create URL from blob object
      const blobUrl = URL.createObjectURL(blob);

      // Create link element and force download
      const downloadLink = document.createElement('a');
      downloadLink.href = blobUrl;
      downloadLink.download = fileName;
      downloadLink.style.display = 'none';
      document.body.appendChild(downloadLink);

      // Click link to start download
      downloadLink.click();

      // Clean up after download
      setTimeout(() => {
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(blobUrl);
        downloadButton.textContent = 'Downloaded!';

        // Reset after 2 seconds
        setTimeout(() => {
          downloadButton.textContent = 'Download';
          downloadButton.disabled = false;
        }, 2000);
      }, 100);
    } catch (error) {
      console.error('Error downloading via fetch:', error);
      downloadButton.textContent = 'Error';

      // Fallback: open with alternative method
      const downloadUrl = `https://download.redgifsdownloader.net/?url=${encodeURIComponent(post.content.file)}&filename=${encodeURIComponent(fileName)}`;
      window.open(downloadUrl, '_blank');

      // Reset after 2 seconds
      setTimeout(() => {
        downloadButton.textContent = 'Download';
        downloadButton.disabled = false;
      }, 2000);
    }
  });

  // Method 2: Button for alternative download
  const altDownloadButton = document.createElement('a');
  altDownloadButton.className = 'btn secondary';
  altDownloadButton.textContent = 'Download Alt';
  altDownloadButton.href = `https://download.redgifsdownloader.net/?url=${encodeURIComponent(post.content.file)}&filename=${encodeURIComponent(fileName)}`;
  altDownloadButton.target = '_blank';

  // Button to view video
  const viewButton = document.createElement('a');
  viewButton.className = 'btn secondary';
  viewButton.textContent = 'View Video';
  viewButton.href = post.content.file;
  viewButton.target = '_blank';

  // Button to see original page
  const originalButton = document.createElement('a');
  originalButton.className = 'btn secondary';
  originalButton.textContent = 'View Original';
  originalButton.href = post.link;
  originalButton.target = '_blank';

  // Append elements
  infoElement.appendChild(titleElement);
  infoElement.appendChild(authorElement);
  actionsElement.appendChild(downloadButton);
  actionsElement.appendChild(altDownloadButton);
  actionsElement.appendChild(viewButton);
  actionsElement.appendChild(originalButton);
  infoElement.appendChild(actionsElement);

  container.appendChild(thumbnailElement);
  container.appendChild(infoElement);
}