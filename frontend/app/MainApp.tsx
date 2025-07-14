import * as React from 'react';
import Landing from './Landing';
import CreateSecret from './CreateSecret';
import OpenSecret from './OpenSecret';

type AppState = 'landing' | 'create' | 'open';

export default function App() {
    const [appState, setAppState] = React.useState<AppState>('landing');
    const [showContent, setShowContent] = React.useState(true);
    const [isInitialLoad, setIsInitialLoad] = React.useState(true);

    const handleCreateSecret = () => {
        // Mark that we've left the initial load
        setIsInitialLoad(false);
        // First fade out current content
        setShowContent(false);
        // Then change state and fade in new content
        setTimeout(() => {
            setAppState('create');
            setShowContent(true);
        }, 300);
    };

    const handleOpenSecret = () => {
        setIsInitialLoad(false);
        setShowContent(false);
        setTimeout(() => {
            setAppState('open');
            setShowContent(true);
        }, 300);
    };

    const handleBackToLanding = () => {
        // Keep isInitialLoad as false when returning to landing
        setShowContent(false);
        setTimeout(() => {
            setAppState('landing');
            setShowContent(true);
        }, 300);
    };

    switch (appState) {
        case 'landing':
            return (
                <Landing 
                    onCreateSecret={handleCreateSecret}
                    onOpenSecret={handleOpenSecret}
                    showContent={showContent}
                    isInitialLoad={isInitialLoad}
                />
            );
        case 'create':
            return <CreateSecret onBack={handleBackToLanding} showContent={showContent} />;
        case 'open':
            return <OpenSecret onBack={handleBackToLanding} showContent={showContent} />;
        default:
            return (
                <Landing 
                    onCreateSecret={handleCreateSecret}
                    onOpenSecret={handleOpenSecret}
                    showContent={showContent}
                    isInitialLoad={isInitialLoad}
                />
            );
    }
}
