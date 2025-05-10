import React, { useState, useRef, useEffect } from "react";
import Measure from "react-measure";
import { useUserMedia } from "../../hooks/useUserMedia";
import { useCardRatio } from "../../hooks/useCardRatio";
import { useOffsets } from "../../hooks/useOffsets";
import { Button } from '@/components/ui/button';
import {
  Video,
  Canvas,
  Wrapper,
  Container,
  Flash,
  Overlay,
} from "./style";

const CAPTURE_OPTIONS = {
  audio: false,
  video: { facingMode: "environment" }
};

interface CameraProps {
  onCapture: (blob: Blob) => void;
  onClear: () => void;
  onConfirm: (confirmed: boolean) => void;
  currentImage?: string;
}

export function Camera({ onCapture, onClear, onConfirm, currentImage }: CameraProps) {
  const canvasRef = useRef<any>(null);
  const videoRef = useRef<any>(null);

  const [container, setContainer] = useState({ width: 0, height: 0 });
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isCanvasEmpty, setIsCanvasEmpty] = useState(true);
  const [isFlashing, setIsFlashing] = useState(false);

  const mediaStream = useUserMedia(CAPTURE_OPTIONS);
  const [aspectRatio, calculateRatio] = useCardRatio(1.586);
  const offsets = useOffsets(
    videoRef.current && videoRef.current.videoWidth,
    videoRef.current && videoRef.current.videoHeight,
    container.width,
    container.height
  );

  // Update canvas with currentImage when provided
  useEffect(() => {
    if (currentImage && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      if (context) {
        const img = new Image();
        img.onload = () => {
          context.drawImage(
            img,
            0,
            0,
            container.width,
            container.height
          );
          setIsCanvasEmpty(false);
        };
        img.src = currentImage;
      }
    }
  }, [currentImage, container.width, container.height]);

  if (mediaStream && videoRef.current && !videoRef.current.srcObject) {
    videoRef.current.srcObject = mediaStream;
  }

  function handleResize(contentRect: any) {
    setContainer({
      width: contentRect.bounds.width,
      height: Math.round(contentRect.bounds.width / aspectRatio)
    });
  }

  function handleCanPlay() {
    calculateRatio(videoRef.current.videoHeight, videoRef.current.videoWidth);
    setIsVideoPlaying(true);
    videoRef.current.play();
  }

  function handleCapture() {
    const context = canvasRef.current.getContext("2d");
    if (!context || !videoRef.current) return;

    context.drawImage(
      videoRef.current,
      offsets.x,
      offsets.y,
      videoRef.current.videoWidth,
      videoRef.current.videoHeight,
      0,
      0,
      videoRef.current.videoWidth,
      videoRef.current.videoHeight,
    );
    
    canvasRef.current.toBlob((blob: Blob | null) => {
      if (blob) {
        onCapture(blob);
      }
    }, "image/jpeg", 1);
    
    setIsCanvasEmpty(false);
    setIsFlashing(true);
  }

  function handleClear() {
    const context = canvasRef.current.getContext("2d");
    if (!context || !canvasRef.current) return;
    
    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setIsCanvasEmpty(true);
    onClear();
  }

  function handleConfirm() {
    onConfirm(true);
  }

  if (!mediaStream) {
    return null;
  }

  return (
    <Measure bounds onResize={handleResize}>
      {({ measureRef }: any) => (
        <Wrapper>
          <Container
            ref={measureRef}
            style={{
              height: `${container.height}px`
            }}
          >
            <Video
              ref={videoRef}
              hidden={!isVideoPlaying}
              onCanPlay={handleCanPlay}
              autoPlay
              playsInline
              muted
            />

            <Overlay hidden={!isVideoPlaying} />

            <Canvas
              ref={canvasRef}
              width={videoRef.current.videoWidth}
              height={videoRef.current.videoHeight}
            />

            <Flash
              flash={isFlashing}
              onAnimationEnd={() => setIsFlashing(false)}
            />
          </Container>

          {isVideoPlaying && (
            <div className="flex justify-center items-center">
              {!isCanvasEmpty && (
                <Button onClick={handleConfirm}>
                  Xác nhận
                </Button>
              )}
              <Button onClick={isCanvasEmpty ? handleCapture : handleClear}
                className="w-full mt-4"
              >
                {isCanvasEmpty ? "Chụp ảnh" : "Chụp lại"}
              </Button>
            </div>
          )}
        </Wrapper>
      )}
    </Measure>
  );
}
