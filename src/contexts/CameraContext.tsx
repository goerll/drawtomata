import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Camera as CameraClass } from '../rendering/engine/Camera';

interface CameraContextType {
    camera: CameraClass | null;
    currentZoom: number;
    zoomIn: () => void;
    zoomOut: () => void;
    resetCamera: () => void;
}

const CameraContext = createContext<CameraContextType | undefined>(undefined);

export const CameraProvider: React.FC<{ children: React.ReactNode; camera: CameraClass | null }> = ({ children, camera }) => {
    const [currentZoom, setCurrentZoom] = useState(1);

    // Subscribe to camera zoom changes
    useEffect(() => {
        if (!camera) return;

        // Initialize with current camera zoom
        setCurrentZoom(camera.getCurrentZoom());

        // Subscribe to zoom changes
        const unsubscribe = camera.onZoomChanged((newZoom) => {
            setCurrentZoom(newZoom);
        });

        return unsubscribe;
    }, [camera]);

    const zoomIn = () => {
        if (camera) {
            camera.zoomIn();
        }
    };

    const zoomOut = () => {
        if (camera) {
            camera.zoomOut();
        }
    };

    const resetCamera = () => {
        if (camera) {
            camera.resetCamera();
        }
    };

    return (
        <CameraContext.Provider value={{ camera, currentZoom, zoomIn, zoomOut, resetCamera }}>
            {children}
        </CameraContext.Provider>
    );
};

export const useCamera = () => {
    const context = useContext(CameraContext);
    if (!context) {
        throw new Error('useCamera must be used within a CameraProvider');
    }
    return context;
};
