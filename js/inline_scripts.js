
function getUrlParam(name) {
            var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)"); 
            var r = window.location.search.substr(1).match(reg);
            if (r != null) return unescape(r[2]);
            return null; 
        }

        var mpd = getUrlParam('mpd');
        var keyId = getUrlParam('keyId');
        var key = getUrlParam('key');
        
        




document.addEventListener('DOMContentLoaded', async () => {
  shaka.polyfill.installAll();


  

  const video = document.querySelector('video');
  const player = new shaka.Player();
  
const manualPlayButton = document.getElementById('manualPlayButton');
  
  await player.attach(video);
const container = document.querySelector('.shaka-video-container');
  const ui = new shaka.ui.Overlay(player, container, video);
  
  // Custom UI configuration with seek bar colors
  const config = {
    'seekBarColors': {
      base: 'rgba(255,255,255,.2)',
      buffered: 'rgba(255,255,255,.4)',
      played: 'rgb(255,0,0)',
    },
    'controlPanelElements': [
      'play_pause',
      'time_and_duration',
      'mute',
      'volume',
      'spacer',
      'captions',
      'quality',
      'language',
      'picture_in_picture',
      'fullscreen',
      'overflow_menu'
    ]
  };
  
  ui.configure(config);


 player.configure({  
                            drm: {  
                                clearKeys: {  
                                    [keyId]: key  
                                }  
                            }  
                        });  
    
  const controls = ui.getControls();

  // Optimized player configuration
  player.configure({
        
       streaming: {
  bufferingGoal: 120,// Increased from 30s to 120s
  rebufferingGoal: 15,       // Increased from 5s to 15s
  bufferBehind: 60,          // Increased from 30s to 60s
  retryParameters: {
    timeout: 15000,
    maxAttempts: 3,
    baseDelay: 500,        
    backoffFactor: 1.5
  },
  segmentRequestTimeout: 10000,
  useNativeHlsOnSafari: true
    },
    manifest: {
      retryParameters: {
        timeout: 10000,
        maxAttempts: 2
      }
    }


  });
  // Enhanced autoplay function
  const attemptAutoplay = async () => {
    try {
      // Ensure video is muted for autoplay
      video.muted = true;
      video.volume = 0.8; // Set volume for when unmuted
      
      // Multiple autoplay attempts
      const playPromise = video.play();
      
      if (playPromise !== undefined) {
        await playPromise;
        console.log('Autoplay successful');
        return true;
      }
    } catch (error) {
      console.log('Autoplay failed:', error.name, error.message);
      
      // Show manual play button if autoplay fails
      manualPlayButton.style.display = 'block';
      return false;
    }
  };

  // Manual play button handler
  manualPlayButton.addEventListener('click', async () => {
    try {
      video.muted = false; // Unmute for manual play
      await video.play();
      manualPlayButton.style.display = 'none';
      console.log('Manual play successful');
    } catch (error) {
      console.error('Manual play failed:', error);
    }
  });

  // Auto-unmute after first user interaction (if started muted)
  let hasUserInteracted = false;
  const enableSoundOnInteraction = () => {
    if (!hasUserInteracted && video.muted && !video.paused) {
      video.muted = false;
      hasUserInteracted = true;
      console.log('Sound enabled after user interaction');
    }
  };

  // Listen for user interactions to enable sound
  ['click', 'touchstart', 'keydown'].forEach(event => {
    document.addEventListener(event, enableSoundOnInteraction, { once: true });
  });

  // Error handling
  player.addEventListener('error', (event) => {
    console.error('Shaka Player Error:', event.detail);
  });

  // Video event handlers
  video.addEventListener('loadstart', () => {
    console.log('Video loading started');
    video.muted = true; // Ensure muted for autoplay
  });

  video.addEventListener('loadedmetadata', () => {
    console.log('Video metadata loaded');
  });

  video.addEventListener('canplay', async () => {
    console.log('Video can start playing');
    if (video.paused) {
      await attemptAutoplay();
    }
  });

  video.addEventListener('play', () => {
    console.log('Video started playing');
    manualPlayButton.style.display = 'none';
  });

  video.addEventListener('pause', () => {
    console.log('Video paused');
  });

  // Handle visibility change (resume when tab becomes visible)
  document.addEventListener('visibilitychange', async () => {
    if (!document.hidden && video.paused) {
      console.log('Tab visible, attempting to resume playback');
      await attemptAutoplay();
    }
  });



  // Load stream and setup autoplay
  try {
    console.log('Loading stream:', mpd);
    await player.load(mpd);


    
    // Immediate autoplay attempt
    setTimeout(async () => {
      if (video.paused) {
        await attemptAutoplay();
      }
    }, 500);
    
    // Fallback autoplay attempt
    setTimeout(async () => {
      if (video.paused) {
        console.log('Fallback autoplay attempt');
        await attemptAutoplay();
      }
    }, 2000);
    
  } catch (error) {
    console.error('Load error:', error);
    manualPlayButton.style.display = 'block';
  }

  
// Handle media session (for better mobile experience)
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: "",
      artist: 'Live TV',
      artwork: []
    });
  
  }
});
