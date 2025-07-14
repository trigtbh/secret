import * as React from 'react';
import { View, Platform, Pressable, Image, Linking, TextInput } from 'react-native';
import Animated, {
    FadeInUp,
    FadeOutDown,
    FadeInRight,
    FadeOutLeft,
    FadeIn,
    FadeOut,
    useSharedValue,
    useAnimatedStyle,
    withTiming,
} from 'react-native-reanimated';
import { Text } from '~/components/ui/text';
import { useColorScheme } from '~/lib/useColorScheme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeToggle } from '~/components/ThemeToggle';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

interface LandingProps {
    onCreateSecret: () => void;
    onOpenSecret: () => void;
    showContent?: boolean;
    isInitialLoad?: boolean;
}


export default function Landing({ onCreateSecret, onOpenSecret, showContent = true, isInitialLoad = false }: LandingProps) {
    const { isDarkColorScheme } = useColorScheme();
    const buildVersion = process.env.EXPO_PUBLIC_BUILD || 'dev';

    const openGitHub = () => {
        Linking.openURL('https://github.com/trigtbh/secret');
    };

    const openTrigProfile = () => {
        Linking.openURL('https://trigtbh.dev');
    };

    const [openSecretPressed, setOpenSecretPressed] = React.useState(false);
    const [showSecretInput, setShowSecretInput] = React.useState(false);
    const [secretCode, setSecretCode] = React.useState("");
    const openSecretOpacity = useSharedValue(1);
    const secretInputOpacity = useSharedValue(0);
    const openSecretAnimatedStyle = useAnimatedStyle(() => ({
        opacity: openSecretOpacity.value,
    }));
    const secretInputAnimatedStyle = useAnimatedStyle(() => ({
        opacity: secretInputOpacity.value,
    }));

    React.useEffect(() => {
        if (showSecretInput) {
            secretInputOpacity.value = withTiming(1, { duration: 400 });
        }
    }, [showSecretInput]);

    const handleCloseSecretInput = React.useCallback(() => {
        secretInputOpacity.value = withTiming(0, { duration: 400 });
        setTimeout(() => {
            setShowSecretInput(false);
            setOpenSecretPressed(false);
            openSecretOpacity.value = withTiming(1, { duration: 400 });
        }, 400);
    }, [secretInputOpacity, openSecretOpacity]);

    const handleCheckmark = React.useCallback(() => {
        if (secretCode.trim()) {
            const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://secret.trigtbh.dev";
            Linking.openURL(`${baseUrl}/${secretCode.trim()}`);
        }
    }, [secretCode]);

    return (
        <SafeAreaView className="flex-1 justify-center items-center gap-5 bg-background">
            {/* Theme toggle in top right - only on web */}
            {Platform.OS === 'web' && (
                <View className="absolute top-4 right-4 z-10">
                    <ThemeToggle />
                </View>
            )}

            {showContent && (
                <Animated.View 
                    entering={FadeIn.duration(300)}
                    exiting={FadeOut.duration(300)}
                    className="w-full max-w-sm mx-4"
                >
                <View className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 items-center gap-6">
                    {/* App Icon */}
                    <Animated.View 
                        entering={isInitialLoad ? FadeInUp.delay(200).damping(50).stiffness(60) : undefined}
                        className="items-center"
                    >
                        <Image 
                            source={require('~/icons/web/icon.png')} 
                            style={{ width: 80, height: 80, borderRadius: 20 }}
                            resizeMode="contain"
                        />
                    </Animated.View>

                    {/* App Title */}
                    <Animated.View 
                        entering={isInitialLoad ? FadeInUp.delay(400).damping(50).stiffness(60) : undefined}
                        className="items-center gap-2"
                    >
                        <Text className="text-4xl font-bold text-foreground">Secret</Text>
                        <Text className="text-base text-muted-foreground text-center">
                            Share your files quickly and privately
                        </Text>
                    </Animated.View>

                    {/* Feature Circles and Blurb */}
                    <Animated.View 
                        entering={isInitialLoad ? FadeInUp.delay(500).damping(50).stiffness(60) : FadeIn.duration(300)}
                        className="w-full"
                    >
                        <View className="flex-row justify-between items-center mb-4">
                            <View style={{ alignItems: 'center', flex: 1 }}>
                                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isDarkColorScheme ? '#1f2937' : '#e0e7ef', justifyContent: 'center', alignItems: 'center', marginBottom: 4 }}>
                                    <Ionicons name="key" size={22} color={isDarkColorScheme ? "#9ca3af" : "#6b7280"} />
                                </View>
                                <View style={{ height: 32, justifyContent: 'flex-start' }}>
                                    <Text className="text-xs text-center text-muted-foreground" style={{ maxWidth: 70 }}>Complete in-transit encryption</Text>
                                </View>
                            </View>
                            <View style={{ alignItems: 'center', flex: 1 }}>
                                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isDarkColorScheme ? '#1f2937' : '#e0e7ef', justifyContent: 'center', alignItems: 'center', marginBottom: 4 }}>
                                    <Ionicons name="flash" size={22} color={isDarkColorScheme ? "#9ca3af" : "#6b7280"} />
                                </View>
                                <View style={{ height: 32, justifyContent: 'flex-start' }}>
                                    <Text className="text-xs text-center text-muted-foreground" style={{ maxWidth: 70 }}>Quick and easy to set up</Text>
                                </View>
                            </View>
                            <View style={{ alignItems: 'center', flex: 1 }}>
                                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isDarkColorScheme ? '#1f2937' : '#e0e7ef', justifyContent: 'center', alignItems: 'center', marginBottom: 4 }}>
                                    <Ionicons name="brush" size={22} color={isDarkColorScheme ? "#9ca3af" : "#6b7280"} />
                                </View>
                                <View style={{ height: 32, justifyContent: 'flex-start' }}>
                                    <Text className="text-xs text-center text-muted-foreground" style={{ maxWidth: 70 }}>Highly customizable</Text>
                                </View>
                            </View>
                        </View>
                    </Animated.View>

                    {/* Action Buttons */}
                    <Animated.View 
                        entering={isInitialLoad ? FadeInUp.delay(600).damping(50).stiffness(60) : undefined}
                        className="w-full gap-3"
                    >
                        {/* Create Secret Button */}
                        <Pressable
                            className="w-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 p-3 rounded-lg items-center justify-center"
                            onPress={onCreateSecret}
                        >
                            <Text className="text-white font-semibold text-base">Create Secret</Text>
                        </Pressable>

                        {/* Open Secret Button */}
                        <Pressable
                            className={`w-full border border-border bg-card rounded-lg items-center justify-center${showSecretInput ? '' : ' hover:bg-muted active:bg-muted/80 p-3'}`}
                            style={{ minHeight: 24 }}
                            onPress={() => {
                                if (!openSecretPressed && !showSecretInput) {
                                    setOpenSecretPressed(true);
                                    openSecretOpacity.value = withTiming(0, { duration: 400 });
                                    setTimeout(() => {
                                        setShowSecretInput(true);
                                    }, 400);
                                }
                            }}
                            disabled={showSecretInput}
                        >
                            {!showSecretInput && (
                                <Animated.Text
                                    className="text-foreground font-semibold text-base"
                                    style={[openSecretAnimatedStyle, { minHeight: 24, textAlign: 'center' }]}
                                >
                                    {'Open Secret'}
                                </Animated.Text>
                            )}
                            {showSecretInput && (
                                <Animated.View style={[secretInputAnimatedStyle, { width: '100%', alignItems: 'center', flexDirection: 'row', gap: 8, minHeight: 48 }]}> 
                                    <Pressable style={{ marginHorizontal: 16 }} onPress={handleCloseSecretInput}>
                                        <Text style={{ fontSize: 20, color: '#e53e3e' }}>✕</Text>
                                    </Pressable>
                                    <View style={{ flex: 1 }}>
                                        <TextInput
                                            placeholder="Enter secret code..."
                                            value={secretCode}
                                            onChangeText={setSecretCode}
                                            style={[
                                                {
                                                    backgroundColor: 'transparent',
                                                    paddingHorizontal: 8,
                                                    paddingVertical: 2,
                                                    fontSize: 13,
                                                    borderWidth: 0,
                                                },
                                                Platform.OS === 'web' && {
                                                    outlineStyle: 'none' as any,
                                                    outlineColor: 'transparent' as any,
                                                },
                                            ]}
                                            className="text-muted-foreground"
                                        />
                                    </View>
                                    <Pressable style={{ marginHorizontal: 16 }} onPress={handleCheckmark}>
                                        <Text style={{ fontSize: 20, color: '#38a169' }}>✓</Text>
                                    </Pressable>
                                </Animated.View>
                            )}
                        </Pressable>
                    </Animated.View>

                    {/* Footer text */}
                    <Animated.View 
                        entering={isInitialLoad ? FadeInUp.delay(800).damping(50).stiffness(60) : undefined}
                        className="mt-2"
                    >
                        <Text className="text-sm text-muted-foreground text-center">
                            Build <Text className="font-mono text-sm">{buildVersion}</Text> • <Text className="text-blue-500 text-sm" onPress={openGitHub}>View on Github</Text> • Made by <Text className="text-blue-500 text-sm" onPress={openTrigProfile}>trig</Text>
                        </Text>
                    </Animated.View>
                </View>
            </Animated.View>
            )}
        </SafeAreaView>
    );
}
