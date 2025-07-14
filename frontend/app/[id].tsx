import * as React from "react";
import { View, ActivityIndicator, Text, Platform, Pressable, Keyboard, Image, TextInput } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router"; // or use your router's hook
import { BASE_URL, API_BASE_URL } from "~/lib/constants";
import { Ionicons } from "@expo/vector-icons";
import {SafeAreaView} from 'react-native-safe-area-context';


import OpenLoading from "./OpenLoading";
import OpenError from "./OpenError";


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
    const [password, setPassword] = React.useState('');
    const [showSecret, setShowSecret] = React.useState(false);
    const { id } = useLocalSearchParams(); // gets the dynamic id from the URL
    const [loading, setLoading] = React.useState(true);
    const [secret, setSecret] = React.useState(null);
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
        }, 3000);
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
            <View className="w-full items-center justify-center gap-4">
                <Text className="text-xl font-bold text-foreground mb-2">Enter password to unlock secret</Text>
                <View className="w-full items-center gap-2">
                    <View className="w-full max-w-xs">
                        <Text className="text-base text-muted-foreground mb-1">Password</Text>
                        <View className="border border-border rounded-lg p-2 w-full">
                            <TextInput
                                secureTextEntry
                                value={password}
                                onChangeText={setPassword}
                                placeholder="Enter password"
                                className="text-base text-foreground"
                                style={{ width: '100%' }}
                            />
                        </View>
                    </View>
                    <Pressable
                        className="mt-4 px-4 py-2 bg-primary rounded-lg"
                        style={{ opacity: password.length > 0 ? 1 : 0.5 }}
                        disabled={password.length === 0}
                        onPress={() => {
                            setShowSecret(true);
                            setDisplayedStep('secret');
                        }}
                    >
                        <Text className="text-base text-white font-bold">Unlock</Text>
                    </Pressable>
                </View>
            </View>
        );
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
        // If secret is set, go to password step unless showSecret is true
        if (secret && !showSecret) return 'password';
        if (secret && showSecret) return 'secret';
        return 'loading';
    }

    // Animate card content transitions (fade/slide) with exit animation before step change
    React.useEffect(() => {
        const nextStep = getStepString();
        if (nextStep === displayedStep) return;

        // Animate out
        cardOpacity.value = withTiming(0, { duration: 150 });
        cardTranslateX.value = withTiming(nextStep === 'loading' ? 20 : -20, { duration: 150 });

        const timeout = setTimeout(() => {
            setDisplayedStep(nextStep);
            // Animate in
            cardTranslateX.value = nextStep === 'loading' ? -20 : 20;
            cardOpacity.value = withTiming(1, { duration: 150 });
            cardTranslateX.value = withTiming(0, { duration: 150 });
        }, 150);

        return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading, error, checkResult, secret]);

    return (
        <Animated.View style={[animatedBgStyle]} className="flex-1 justify-center items-center gap-5">
            <Animated.View className="w-full max-w-sm mx-4">
                <Animated.View style={[animatedCardStyle]} className="w-full max-w-sm rounded-2xl">
                    <CardHeader className="pb-3.5 flex-row justify-between items-center">
                        <CardTitle className="text-4xl">Open Secret</CardTitle>
                        <Image
                            source={require('~/icons/web/icon.png')}
                            style={{ width: 48, height: 48, borderRadius: 12 }}
                            resizeMode="contain"
                        />
                    </CardHeader>
                    <Animated.View style={[cardContentStyle]} className="min-h-[350px] sm:min-h-[300px] ">
                        {cardStep}
                    </Animated.View>
                </Animated.View>
            </Animated.View>
        </Animated.View>
    );
}
