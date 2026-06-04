import { useState, useRef, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Camera, MapPin, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

interface AttendanceRecord {
  id: number;
  userId: string;
  date: string;
  punchInTime: string | null;
  punchOutTime: string | null;
  punchInAddress: string | null;
  punchOutAddress: string | null;
  workingHours: string | null;
  status: string;
}

export function PunchInOutButton() {
  const [showDialog, setShowDialog] = useState(false);
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number; address: string } | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: todayAttendance, isLoading } = useQuery<AttendanceRecord | null>({
    queryKey: ["/api/hr/attendance/today"],
  });

  const { data: dayOffInfo } = useQuery<{
    isWeekend: boolean;
    isHoliday: boolean;
    holidayName: string | null;
    isDayOff: boolean;
  }>({
    queryKey: ["/api/hr/is-day-off", format(new Date(), "yyyy-MM-dd")],
    queryFn: async () => {
      const today = format(new Date(), "yyyy-MM-dd");
      const response = await fetch(`/api/hr/is-day-off?date=${today}`);
      return response.json();
    },
  });

  const isPunchedIn = todayAttendance?.punchInTime && !todayAttendance?.punchOutTime;
  const isPunchedOut = todayAttendance?.punchOutTime;
  const canPunchIn = !todayAttendance?.punchInTime;
  const isDayOff = dayOffInfo?.isDayOff || false;

  const punchInMutation = useMutation({
    mutationFn: async (data: { photoBase64: string; latitude: number; longitude: number; address: string }) => {
      return apiRequest("/api/hr/attendance/punch-in", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({ title: "Punched In Successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/hr/attendance/today"] });
      handleClose();
    },
    onError: (error: Error) => {
      toast({ title: "Punch In Failed", description: error.message, variant: "destructive" });
    },
  });

  const punchOutMutation = useMutation({
    mutationFn: async (data: { photoBase64: string; latitude: number; longitude: number; address: string }) => {
      return apiRequest("/api/hr/attendance/punch-out", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({ title: "Punched Out Successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/hr/attendance/today"] });
      handleClose();
    },
    onError: (error: Error) => {
      toast({ title: "Punch Out Failed", description: error.message, variant: "destructive" });
    },
  });

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Camera error:", error);
      toast({ title: "Camera Error", description: "Please allow camera access", variant: "destructive" });
    }
  }, [toast]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return;

    setIsCapturing(true);
    // Downscale to a fixed max dimension so the uploaded photo stays small
    // regardless of the device camera resolution. Large payloads can be
    // rejected at the deployment edge (403) before reaching the server.
    const MAX_DIMENSION = 640;
    const srcWidth = videoRef.current.videoWidth || 640;
    const srcHeight = videoRef.current.videoHeight || 480;
    const scale = Math.min(1, MAX_DIMENSION / Math.max(srcWidth, srcHeight));
    const targetWidth = Math.round(srcWidth * scale);
    const targetHeight = Math.round(srcHeight * scale);

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, targetWidth, targetHeight);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
      setPhotoData(dataUrl);
    }
    stopCamera();
    setIsCapturing(false);
  }, [stopCamera]);

  const getLocation = useCallback(async () => {
    setIsFetchingLocation(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const { latitude, longitude } = position.coords;
      
      // Try to get address from coordinates using reverse geocoding
      let address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
        );
        const data = await response.json();
        if (data.display_name) {
          address = data.display_name;
        }
      } catch (e) {
        console.log("Geocoding failed, using coordinates");
      }

      setLocation({ latitude, longitude, address });
    } catch (error) {
      console.error("Location error:", error);
      toast({ 
        title: "Location Error", 
        description: "Please allow location access for attendance", 
        variant: "destructive" 
      });
    } finally {
      setIsFetchingLocation(false);
    }
  }, [toast]);

  const handleOpen = async () => {
    setShowDialog(true);
    setPhotoData(null);
    setLocation(null);
    await Promise.all([startCamera(), getLocation()]);
  };

  const handleClose = () => {
    setShowDialog(false);
    stopCamera();
    setPhotoData(null);
    setLocation(null);
  };

  const handleSubmit = () => {
    if (!photoData || !location) {
      toast({ 
        title: "Missing Information", 
        description: "Please capture photo and enable location", 
        variant: "destructive" 
      });
      return;
    }

    const data = {
      photoBase64: photoData,
      latitude: location.latitude,
      longitude: location.longitude,
      address: location.address,
    };

    if (canPunchIn) {
      punchInMutation.mutate(data);
    } else if (isPunchedIn) {
      punchOutMutation.mutate(data);
    }
  };

  const isSubmitting = punchInMutation.isPending || punchOutMutation.isPending;

  if (isLoading) {
    return (
      <Button variant="outline" disabled className="gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading...
      </Button>
    );
  }

  return (
    <>
      {isDayOff && !todayAttendance?.punchInTime ? (
        <div className="flex items-center gap-2 text-sm bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-md">
          <Clock className="h-4 w-4 text-amber-600" />
          <span className="text-amber-700 dark:text-amber-300">
            {dayOffInfo?.isWeekend ? "Weekend Off" : dayOffInfo?.holidayName || "Holiday"}
          </span>
        </div>
      ) : isPunchedOut ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-md">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span>
            Completed: {todayAttendance?.workingHours ? `${todayAttendance.workingHours}h` : "Done"}
          </span>
        </div>
      ) : (
        <Button
          onClick={handleOpen}
          variant={isPunchedIn ? "destructive" : "default"}
          className="gap-2"
        >
          <Clock className="h-4 w-4" />
          {canPunchIn ? "Punch In" : "Punch Out"}
        </Button>
      )}

      <Dialog open={showDialog} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{canPunchIn ? "Punch In" : "Punch Out"}</DialogTitle>
            <DialogDescription>
              Please capture your photo and allow location access
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
              {!photoData ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <img src={photoData} alt="Captured" className="w-full h-full object-cover" />
              )}
            </div>

            {!photoData ? (
              <Button onClick={capturePhoto} className="w-full gap-2" disabled={isCapturing}>
                <Camera className="h-4 w-4" />
                Capture Photo
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={async () => {
                  setPhotoData(null);
                  await startCamera();
                }} className="flex-1">
                  Retake
                </Button>
              </div>
            )}

            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              {isFetchingLocation ? (
                <span className="text-sm text-muted-foreground">Fetching location...</span>
              ) : location ? (
                <div className="text-sm">
                  <p className="font-medium text-green-600">Location captured</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{location.address}</p>
                </div>
              ) : (
                <Button variant="link" size="sm" onClick={getLocation} className="p-0 h-auto">
                  Get Location
                </Button>
              )}
            </div>

            <Button 
              onClick={handleSubmit} 
              className="w-full" 
              disabled={!photoData || !location || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>Confirm {canPunchIn ? "Punch In" : "Punch Out"}</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
