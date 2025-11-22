// Generate notification sound using Web Audio API
export const playNotificationSound = (volume: number, repeatCount: number) => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  const playBeep = async () => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Set volume (0-1)
    gainNode.gain.value = volume / 100;
    
    // Set frequency for a pleasant notification sound
    oscillator.frequency.value = 800;
    oscillator.type = "sine";
    
    const now = audioContext.currentTime;
    oscillator.start(now);
    
    // Create envelope for smooth sound
    gainNode.gain.setValueAtTime(volume / 100, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    
    oscillator.stop(now + 0.3);
    
    // Wait for the beep to finish before next iteration
    await new Promise(resolve => setTimeout(resolve, 500));
  };
  
  // Play the beep multiple times
  const playSequence = async () => {
    for (let i = 0; i < repeatCount; i++) {
      await playBeep();
    }
  };
  
  playSequence();
};
