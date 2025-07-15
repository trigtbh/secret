import * as React from "react";
import { View, ActivityIndicator, Text, Platform, Pressable, Keyboard, Image, TextInput } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router"; // or use your router's hook
import { BASE_URL, API_BASE_URL } from "~/lib/constants";
import { Ionicons } from "@expo/vector-icons";
import {SafeAreaView} from 'react-native-safe-area-context';


import OpenLoading from "./OpenLoading";
import OpenError from "./OpenError";
import OpenPassword from "./OpenPassword";
import OpenDecrypting from "./OpenDecrypting";
import OpenFileView from "./OpenFileView";


import Animated, {
    FadeInUp,
    FadeOutDown,
    FadeInRight,
    FadeOutLeft,
    FadeIn,
    FadeOut,
    LayoutAnimationConfig,
    useAnimatedProps,
    useAnimatedStyle,
    useSharedValue,       
    withTiming,
    withSpring
} from 'react-native-reanimated';

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from '~/components/ui/card';
import { useColorScheme } from '~/lib/useColorScheme';


export default function SecretPage() {
  const { isDarkColorScheme } = useColorScheme();
      
    // Use project-defined default colors (from global.css or tailwind config)
    // bg-background: #18181b, bg-card: #1e1e21, border-border: #27272a
    const bgColor = useSharedValue(isDarkColorScheme ? '#070708' : '#969090'); // bg-background
    const cardColor = useSharedValue(isDarkColorScheme ? '#070708' : '#ffffff'); // bg-card
    const borderColor = useSharedValue(isDarkColorScheme ? '#5e5e5e' : '#969696'); // border-border

    // Animated styles for background and card
    const animatedBgStyle = useAnimatedStyle(() => ({
        backgroundColor: bgColor.value,
    }));
    const animatedCardStyle = useAnimatedStyle(() => ({
        backgroundColor: cardColor.value,
        borderColor: borderColor.value,
        borderWidth: 1,
    }));
    // Password state for the new step
    
    const [showSecret, setShowSecret] = React.useState(false);
    const [unlockPassword, setUnlockPassword] = React.useState<string | null>(null);
    const [pendingStep, setPendingStep] = React.useState<string | null>(null);
    const { id } = useLocalSearchParams(); // gets the dynamic id from the URL
    const [loading, setLoading] = React.useState(true);
    const [secret, setSecret] = React.useState<any>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [checkResult, setCheckResult] = React.useState<{
        exists: boolean;
        time: boolean;
        downloads: boolean;
    } | null>(null);

    // Track which step is currently displayed (for animation)
    const [displayedStep, setDisplayedStep] = React.useState('loading');


// Card content animation values
    const cardOpacity = useSharedValue(0); // Start at 0 for initial animation
    const cardTranslateX = useSharedValue(20); // Start slightly right


    React.useEffect(() => {
        if (!id) return;
        setTimeout(() => {
            setLoading(true);
            // First, check the validity of the link
            fetch(`${API_BASE_URL}/check/${id}`)
                .then((res) => res.json())
                .then((check) => {
                    setCheckResult(check);
                    if (!check.exists || !check.time || !check.downloads) {
                        setLoading(false);
                        return;
                    }
                    // If valid, fetch the secret
                    fetch(`${API_BASE_URL}/get/${id}`)
                        .then((res) => res.json())
                        .then((data) => {
                            setSecret(data);
                            setLoading(false);
                            // Animate colors if present in secret
                            if (data && data.settings.selectedColors.background && data.settings.selectedColors.foreground && data.settings.selectedColors.accent) {
                                bgColor.value = withTiming(data.settings.selectedColors.background, { duration: 400 });
                                cardColor.value = withTiming(data.settings.selectedColors.foreground, { duration: 400 });
                                borderColor.value = withTiming(data.settings.selectedColors.accent, { duration: 400 });
                            }
                        })
                        .catch((err) => {
                            setError("Failed to load secret");
                            setLoading(false);
                        });
                })
                .catch((err) => {
                    setError("Failed to check link");
                    setLoading(false);
                });
        }, 0);
    }, [id, API_BASE_URL]);


    const WrapperComponent = Platform.OS === 'web' ? View : Pressable;
    const wrapperProps = Platform.OS === 'web' 
        ? { className: "flex-1 justify-between", style: { userSelect: 'none' } }
        : { 
            className: "flex-1 justify-between", 
            style: { userSelect: 'none' },
            onPress: () => Keyboard.dismiss()
          };



    const cardContentStyle = useAnimatedStyle(() => {
            return {
                opacity: cardOpacity.value,
                transform: [
                    { translateX: cardTranslateX.value }
                ]
            };
        });

    // Initial animation on mount
        React.useEffect(() => {
            cardOpacity.value = withTiming(1, { duration: 300 });
            cardTranslateX.value = withTiming(0, { duration: 300 });
            
            
        }, []);


    // Card step logic for content
    let cardStep = null;
    if (displayedStep === 'loading') {
        cardStep = <OpenLoading />;
    } else if (displayedStep === 'error') {
        cardStep = <OpenError errormsg={error || ''} />;
    } else if (displayedStep === 'invalid') {
        cardStep = <OpenError errormsg={
            !checkResult?.exists
                ? "This link does not exist."
                : !checkResult?.time
                ? "This link has expired."
                : "This link has reached its download/view limit."
        } />;
    } else if (displayedStep === 'nosecret') {
        cardStep = (
            <Text className="text-lg font-bold text-foreground mb-2">
                No secret found.
            </Text>
        );
    } else if (displayedStep === 'password') {
        cardStep = (
            <OpenPassword
                hash={secret.passwordHash}
                callback={(password) => {
                    setUnlockPassword(password);
                    setPendingStep('decrypting');
                }}
            />
        );
    } else if (displayedStep === 'decrypting') {
        cardStep = (
            <OpenDecrypting
                secret={secret}
                password={unlockPassword ?? ''}
                onComplete={(decryptedSecret) => {
                    setSecret(decryptedSecret);
                    setPendingStep('fileview');
                }}
            />
        );
    } else if (displayedStep === 'fileview') {
        // Show the OpenFileView with the decrypted secret
        const OpenFileView = require('./OpenFileView').default;
        cardStep = <OpenFileView secret={secret} />;
    } else if (displayedStep === 'secret') {
        cardStep = (
            <>
                <Text className="text-2xl font-bold text-foreground mb-2">
                    Secret: {id}
                </Text>
                <Text className="text-base text-muted-foreground text-center break-words">
                    {JSON.stringify(secret, null, 2)}
                </Text>
            </>
        );
    }

    // Determine the current step string
    function getStepString() {
        if (loading) return 'loading';
        if (error) return 'error';
        if (checkResult && (!checkResult.exists || !checkResult.time || !checkResult.downloads)) return 'invalid';
        if (!secret && checkResult && checkResult.exists && checkResult.time && checkResult.downloads) return 'nosecret';
        // Persist fileview step if currently displayed
        if (displayedStep === 'fileview') return 'fileview';
        if (secret && displayedStep === 'decrypting') return 'decrypting';
        if (secret && !showSecret) return 'password';
        if (secret && showSecret) return 'secret';
        return 'loading';
    }

    // Animate card content transitions (fade/slide) with exit animation before step change
    React.useEffect(() => {
        // If a pending step is set, use it for the next transition
        const nextStep = pendingStep || getStepString();
        if (nextStep === displayedStep) return;

        // Animate out
        cardOpacity.value = withTiming(0, { duration: 150 });
        cardTranslateX.value = withTiming(nextStep === 'loading' ? 20 : -20, { duration: 150 });

        const timeout = setTimeout(() => {
            setDisplayedStep(nextStep);
            setPendingStep(null);
            // Animate in
            cardTranslateX.value = nextStep === 'loading' ? -20 : 20;
            cardOpacity.value = withTiming(1, { duration: 150 });
            cardTranslateX.value = withTiming(0, { duration: 150 });
        }, 150);

        return () => clearTimeout(timeout);
    // Add showSecret to dependencies so secret step fades in after unlock
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading, error, checkResult, secret, showSecret, pendingStep]);

    // Determine the card title based on step and secret
    let cardTitle = 'Open Secret';
    if (secret && secret.settings.title) {
        cardTitle = secret.settings.title;
    }

    return (
        <Animated.View style={[animatedBgStyle]} className="flex-1 justify-center items-center gap-5">
            <Animated.View className="w-full max-w-sm mx-4">
                <Animated.View style={[animatedCardStyle]} className="w-full max-w-sm rounded-2xl">
                    <CardHeader className="pb-3.5 flex-row justify-between items-center">
                        <CardTitle className="text-4xl">{cardTitle}</CardTitle>
                        <Image
                            source={require('~/icons/web/icon.png')}
                            style={{ width: 48, height: 48, borderRadius: 12 }}
                            resizeMode="contain"
                        />
                    </CardHeader>
                    {/* Description always visible inside card, above animated content */}
                    {secret?.settings?.description && (
                        <View className="w-full mb-2 px-2">
                            <Text className="text-base text-muted-foreground text-center">
                                {secret.settings.description}
                            </Text>
                        </View>
                    )}
                    <Animated.View style={[cardContentStyle]} className="min-h-[350px] sm:min-h-[300px] ">
                        {cardStep}
                    </Animated.View>
                </Animated.View>
            </Animated.View>
        </Animated.View>
    );
}
