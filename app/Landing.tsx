import * as React from 'react';
import { View, Platform, Pressable, Image, Linking } from 'react-native';
import Animated, {
    FadeInUp,
    FadeOutDown,
    FadeInRight,
    FadeOutLeft,
    FadeIn,
    FadeOut,
} from 'react-native-reanimated';
import { Text } from '~/components/ui/text';
import { useColorScheme } from '~/lib/useColorScheme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeToggle } from '~/components/ThemeToggle';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

                    {/* Action Buttons */}
                    <Animated.View 
                        entering={isInitialLoad ? FadeInUp.delay(600).damping(50).stiffness(60) : undefined}
                        className="w-full gap-3 mt-4"
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
                            className="w-full border border-border bg-card hover:bg-muted active:bg-muted/80 p-3 rounded-lg items-center justify-center"
                            onPress={onOpenSecret}
                        >
                            <Text className="text-foreground font-semibold text-base">Open Secret</Text>
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
