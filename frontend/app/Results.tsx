import * as React from 'react';
import { View, Platform, Pressable, Animated } from 'react-native';
import { Text } from '~/components/ui/text';
import { useColorScheme } from '~/lib/useColorScheme';
import { globalFileData } from './FileSelect';
import { BASE_URL } from '~/lib/constants';
import { Ionicons } from '@expo/vector-icons';

export default function Results() {
    const { isDarkColorScheme } = useColorScheme();
    const [copyState, setCopyState] = React.useState<'idle' | 'copying' | 'success'>('idle');
    const [linkCopyState, setLinkCopyState] = React.useState<'idle' | 'copying' | 'success'>('idle');
    const rotationAnim = React.useRef(new Animated.Value(0)).current;
    const fadeAnim = React.useRef(new Animated.Value(1)).current;
    const linkRotationAnim = React.useRef(new Animated.Value(0)).current;
    const linkFadeAnim = React.useRef(new Animated.Value(1)).current;

    // Get the upload result from global data (will be set by Upload component)
    const uploadResult = globalFileData.uploadResult || '';

    const WrapperComponent = Platform.OS === 'web' ? View : View;
    const wrapperProps = Platform.OS === 'web' 
        ? { className: "flex-1 justify-between", style: { userSelect: 'none' } }
        : { 
            className: "flex-1 justify-between", 
            style: { userSelect: 'none' }
          };

    return (
        <WrapperComponent {...wrapperProps}>
            
            <View className="flex-1 px-6 justify-center">
                <View className="rounded-lg border border-border bg-card p-6 gap-4 items-center">
                    {/* Success icon */}
                    <View className="w-12 h-12 rounded-full bg-blue-500 items-center justify-center">
                        <Ionicons name="checkmark" size={24} color="white" />
                    </View>
                    
                    {/* Main status text */}
                    <Text className="text-lg font-semibold text-foreground text-center">
                        Upload complete!
                    </Text>
                    
                    {/* Sub status text */}
                    <Text className="text-sm text-muted-foreground text-center">
                        Your secret is ready to share.
                    </Text>
                    
                    {/* Success message with copy options */}
                    {uploadResult && (
                        <View className="mt-4 w-full gap-3">
                            {/* ID with inline copy button */}
                            <View className="flex-row items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                <Text className="text-sm text-blue-800 dark:text-blue-200 flex-1">
                                    ID: <Text className="font-mono text-blue-800 dark:text-blue-200">{uploadResult}</Text>
                                </Text>
                                <Pressable
                                    className="bg-blue-500 hover:bg-blue-600 active:bg-blue-700 p-2 rounded-md ml-2"
                                    onPress={async () => {
                                        try {
                                            setCopyState('copying');
                                            
                                            // Start rotation and fade animations
                                            Animated.parallel([
                                                Animated.timing(rotationAnim, {
                                                    toValue: 1,
                                                    duration: 400,
                                                    useNativeDriver: true,
                                                }),
                                                Animated.sequence([
                                                    Animated.timing(fadeAnim, {
                                                        toValue: 0,
                                                        duration: 200,
                                                        useNativeDriver: true,
                                                    }),
                                                    Animated.timing(fadeAnim, {
                                                        toValue: 1,
                                                        duration: 200,
                                                        useNativeDriver: true,
                                                    })
                                                ])
                                            ]).start();
                                            
                                            // Wait for half the animation before changing state
                                            setTimeout(() => {
                                                setCopyState('success');
                                            }, 200);
                                            
                                            if (Platform.OS === 'web' && navigator.clipboard) {
                                                await navigator.clipboard.writeText(uploadResult);
                                            }
                                            
                                            console.log('Copied ID to clipboard:', uploadResult);
                                            
                                            // Reset to idle after 2 seconds with fade animation
                                            setTimeout(() => {
                                                // Start fade out and rotation animation back to copy icon
                                                Animated.parallel([
                                                    Animated.timing(rotationAnim, {
                                                        toValue: 2,
                                                        duration: 400,
                                                        useNativeDriver: true,
                                                    }),
                                                    Animated.sequence([
                                                        Animated.timing(fadeAnim, {
                                                            toValue: 0,
                                                            duration: 200,
                                                            useNativeDriver: true,
                                                        }),
                                                        Animated.timing(fadeAnim, {
                                                            toValue: 1,
                                                            duration: 200,
                                                            useNativeDriver: true,
                                                        })
                                                    ])
                                                ]).start(() => {
                                                    // Reset animations after completion
                                                    rotationAnim.setValue(0);
                                                    fadeAnim.setValue(1);
                                                });
                                                
                                                // Change state back during fade
                                                setTimeout(() => {
                                                    setCopyState('idle');
                                                }, 200);
                                            }, 2000);
                                        } catch (error) {
                                            console.error('Failed to copy ID:', error);
                                            setCopyState('idle');
                                            rotationAnim.setValue(0);
                                            fadeAnim.setValue(1);
                                        }
                                    }}
                                >
                                    <Animated.View
                                        style={{
                                            opacity: fadeAnim,
                                            transform: [{
                                                rotate: rotationAnim.interpolate({
                                                    inputRange: [0, 1, 2],
                                                    outputRange: copyState === 'success' ? ['-180deg', '0deg', '180deg'] : ['0deg', '180deg', '360deg'],
                                                })
                                            }]
                                        }}
                                    >
                                        {copyState === 'success' ? (
                                            <Ionicons name="checkmark" size={16} color="white" />
                                        ) : (
                                            <Ionicons name="copy-outline" size={16} color="white" />
                                        )}
                                    </Animated.View>
                                </Pressable>
                            </View>
                            
                            {/* Separator */}
                            <Text className="text-center text-muted-foreground text-sm">or</Text>
                            
                            {/* Copy Link Button */}
                            <Pressable
                                className="bg-blue-500 hover:bg-blue-600 active:bg-blue-700 p-3 rounded-lg items-center justify-center flex-row gap-2"
                                onPress={async () => {
                                    try {
                                        setLinkCopyState('copying');
                                        
                                        // Start rotation and fade animations for link icon
                                        Animated.parallel([
                                            Animated.timing(linkRotationAnim, {
                                                toValue: 1,
                                                duration: 400,
                                                useNativeDriver: true,
                                            }),
                                            Animated.sequence([
                                                Animated.timing(linkFadeAnim, {
                                                    toValue: 0,
                                                    duration: 200,
                                                    useNativeDriver: true,
                                                }),
                                                Animated.timing(linkFadeAnim, {
                                                    toValue: 1,
                                                    duration: 200,
                                                    useNativeDriver: true,
                                                })
                                            ])
                                        ]).start();
                                        
                                        // Wait for half the animation before changing state
                                        setTimeout(() => {
                                            setLinkCopyState('success');
                                        }, 200);
                                        
                                        const shareLink = `${BASE_URL}/${uploadResult}`;
                                        if (Platform.OS === 'web' && navigator.clipboard) {
                                            await navigator.clipboard.writeText(shareLink);
                                        }
                                        console.log('Copied link to clipboard:', shareLink);
                                        
                                        // Reset to idle after 2 seconds with fade animation
                                        setTimeout(() => {
                                            // Start fade out and rotation animation back to link icon
                                            Animated.parallel([
                                                Animated.timing(linkRotationAnim, {
                                                    toValue: 2,
                                                    duration: 400,
                                                    useNativeDriver: true,
                                                }),
                                                Animated.sequence([
                                                    Animated.timing(linkFadeAnim, {
                                                        toValue: 0,
                                                        duration: 200,
                                                        useNativeDriver: true,
                                                    }),
                                                    Animated.timing(linkFadeAnim, {
                                                        toValue: 1,
                                                        duration: 200,
                                                        useNativeDriver: true,
                                                    })
                                                ])
                                            ]).start(() => {
                                                // Reset animations after completion
                                                linkRotationAnim.setValue(0);
                                                linkFadeAnim.setValue(1);
                                            });
                                            
                                            // Change state back during fade
                                            setTimeout(() => {
                                                setLinkCopyState('idle');
                                            }, 200);
                                        }, 2000);
                                    } catch (error) {
                                        console.error('Failed to copy link:', error);
                                        setLinkCopyState('idle');
                                        linkRotationAnim.setValue(0);
                                        linkFadeAnim.setValue(1);
                                    }
                                }}
                            >
                                <Animated.View
                                    style={{
                                        opacity: linkFadeAnim,
                                        transform: [{
                                            rotate: linkRotationAnim.interpolate({
                                                inputRange: [0, 1, 2],
                                                outputRange: linkCopyState === 'success' ? ['-180deg', '0deg', '180deg'] : ['0deg', '180deg', '360deg'],
                                            })
                                        }]
                                    }}
                                >
                                    {linkCopyState === 'success' ? (
                                        <Ionicons name="checkmark" size={16} color="white" />
                                    ) : (
                                        <Ionicons name="link-outline" size={16} color="white" />
                                    )}
                                </Animated.View>
                                <Text className="text-white font-medium">Copy Link</Text>
                            </Pressable>
                        </View>
                    )}
                </View>
            </View>
        </WrapperComponent>
    );
}
