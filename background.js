// Background script for RedGifs Downloader extension

// API key is defined by the backend
const API_KEY = '07327cddd852636a9063dc8fabcffd7fc22ead9b6ab9cc655013952ec2cb818d'; // This key will be replaced by the backend

// Listen for installation
chrome.runtime.onInstalled.addListener(function() {
  console.log('RedGifs Downloader extension installed!');
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'checkForVideos') {
    // Check if we need to show the page action icon
    if (request.hasVideos) {
      chrome.action.setIcon({
        path: {
          "16": "images/icon16_active.png",
          "48": "images/icon48_active.png",
          "128": "images/icon128_active.png"
        },
        tabId: sender.tab.id
      });
      
      // Show a notification about videos found
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'images/icon128_active.png',
        title: 'RedGifs Downloader',
        message: `${request.videoCount} videos detected on this page.`
      });
    }
    
    // Send response
    sendResponse({status: 'ok'});
  }
  
  // Add support for getting video URLs (used by popup)
  if (request.action === 'getVideoUrls') {
    // This message will be forwarded to the content script
    // Just forward the response
    sendResponse(request.urls);
  }
  
  if (request.action === 'downloadVideo') {
    // Fetch video info using backend API key
    fetchVideoInfo(request.url, API_KEY)
      .then(data => {
        sendResponse({status: 'success', data: data});
      })
      .catch(error => {
        sendResponse({status: 'error', message: error.message});
      });
    
    // Return true to indicate that we will send a response asynchronously
    return true;
  }
});

// Function to fetch video info from the API via proxy
async function fetchVideoInfo(url, apiKey) {
  try {
    // Create the complete API URL
    const fullApiUrl = `https://redgifsdownloader.net/api/download/posts%3Furls%3D${encodeURIComponent(url)}%26key%3D${apiKey}`;
    
    // Fully encode the API URL
    const encodedApiUrl = encodeURIComponent(fullApiUrl);
    
    // Create the final URL with the proxy
    const proxyUrl = `https://proxy.redgifsdownloader.net/?url=${encodedApiUrl}`;
    console.log(proxyUrl);
    
    console.log('Final URL for request:', proxyUrl);
    
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check if authentication was successful
    if (!data.authentication || data.authentication.status !== 'success') {
      throw new Error('Invalid API key');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching video info:', error);
    throw error;
  }
}