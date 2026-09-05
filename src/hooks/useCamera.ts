import { useState, useRef, useCallback, useEffect } from 'react';

export interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  status: 'idle' | 'requesting' | 'active' | 'denied' | 'unavailable' | 'error';
  facingMode: 'user' | 'environment';
  capture: () => Blob | null;
  switchCamera: () => void;
  stop: () => void;
  start: () => void;
  errorMessage: string | null;
  hasMultipleCameras: boolean;
}

export function useCamera(): UseCameraReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const facingModeRef = useRef<'user' | 'environment'>('environment');

  const [status, setStatus] = useState<UseCameraReturn['status']>('idle');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasMultipleCameras, setHasMultipleCameras] = useState<boolean>(false);

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStatus('idle');
  }, []);

  const startWithFacing = useCallback(async (facing: 'user' | 'environment') => {
    // Stop any existing stream first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setStatus('requesting');
    setErrorMessage(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatus('unavailable');
      setErrorMessage('Camera API is not supported on this browser or non-HTTPS origin.');
      return;
    }

    try {
      // Check available devices
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((d) => d.kind === 'videoinput');
        setHasMultipleCameras(videoDevices.length > 1);
      } catch {}

      // Try with specific facing mode first, then fall back to any camera
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });
      } catch {
        // Fallback: accept any video stream
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Wait for metadata to load before playing
        await new Promise<void>((resolve) => {
          const video = videoRef.current!;
          if (video.readyState >= 2) {
            resolve();
          } else {
            video.onloadedmetadata = () => resolve();
          }
        });
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('Video play error:', playErr);
        }
      }

      setStatus('active');
    } catch (err: any) {
      console.error('Camera access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setStatus('denied');
        setErrorMessage('Camera access permission was denied. Please allow camera permissions in your browser settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setStatus('unavailable');
        setErrorMessage('No video camera device detected on this device.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setStatus('error');
        setErrorMessage('Camera is in use by another application. Close other apps using the camera and try again.');
      } else {
        setStatus('error');
        setErrorMessage(err.message || 'Failed to initialize camera.');
      }
    }
  }, []);

  const start = useCallback(() => {
    startWithFacing(facingModeRef.current);
  }, [startWithFacing]);

  const switchCamera = useCallback(() => {
    const newMode = facingModeRef.current === 'environment' ? 'user' : 'environment';
    facingModeRef.current = newMode;
    setFacingMode(newMode);
    // Restart camera with new facing mode
    startWithFacing(newMode);
  }, [startWithFacing]);

  const capture = useCallback((): Blob | null => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      console.warn('Video not ready for capture');
      return null;
    }

    const width = video.videoWidth;
    const height = video.videoHeight;

    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, width, height);

    try {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      const arr = dataUrl.split(',');
      const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new Blob([u8arr], { type: mime });
    } catch (err) {
      console.error('Canvas snapshot error:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  return {
    videoRef,
    canvasRef,
    status,
    facingMode,
    capture,
    switchCamera,
    stop,
    start,
    errorMessage,
    hasMultipleCameras,
  };
}
