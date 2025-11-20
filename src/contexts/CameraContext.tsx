import React, { createContext, useContext, useState } from 'react';
import { Camera } from 'three';

interface CameraContextType {
    camera: Camera | null;
    currentZoom: number;
    zoomIn: () => void;
    zoomOut: () => void;
}

const CameraContext = createContext<CameraContextType | undefined>(undefined);

export const CameraProvider: React.FC<{ children: React.ReactNode; camera: Camera | null }> = ({ children, camera }) => {
    const [currentZoom, setCurrentZoom] = useState(1);

    const zoomIn = () => {
        setCurrentZoom((prev) => Math.min(prev + 0.1, 2));
        // Implement actual camera zoom logic here if needed, or just expose the state
    };

    const zoomOut = () => {
        setCurrentZoom((prev) => Math.max(prev - 0.1, 0.1));
    };

    return (
        <CameraContext.Provider value={{ camera, currentZoom, zoomIn, zoomOut }}>
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
