import * as React from 'react';
import {Pressable, View, Image} from 'react-native';
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
import {Info} from '~/lib/icons/Info';
import {Avatar, AvatarFallback, AvatarImage} from '~/components/ui/avatar';
import {Button} from '~/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from '~/components/ui/card';
import {Progress} from '~/components/ui/progress';
import {Text} from '~/components/ui/text';
import {Tooltip, TooltipContent, TooltipTrigger} from '~/components/ui/tooltip';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ThemeToggle} from '~/components/ThemeToggle';
import {useColorScheme} from '~/lib/useColorScheme';
import Ionicon from "@expo/vector-icons/Ionicons";


import FileSelect, { globalFileData } from '~/app/FileSelect';
import Options from '~/app/Options';
import Display from '~/app/Display';
import Confirm from '~/app/Confirm';
import Upload from '~/app/Upload';
import Results from '~/app/Results';
import { Separator } from '~/components/ui/separator';


// Suppress text warnings
const originalWarn = console.warn;
console.warn = (...args) => {
    if (args[0] && args[0].includes('Text strings must be rendered within a <Text> component')) {
        return;
    }
    originalWarn(...args);
};

const AIcon = Animated.createAnimatedComponent(Ionicon);

// Progress Dots Component to avoid conditional hook calls
function ProgressDots({ dotColors, dotOpacities }: { dotColors: any[], dotOpacities: any[] }) {
    return (
        <View className="flex-row items-center gap-2">
            {Array.from({ length: 3 }, (_, index) => {
                const dotStyle = useAnimatedStyle(() => {
                    return {
                        backgroundColor: dotColors[index].value,
                        opacity: dotOpacities[index].value,
                    };
                });
                
                return (
                    <Animated.View
                        key={index}
                        entering={FadeIn.delay(index * 50)}
                        style={dotStyle}
                        className="w-2 h-2 rounded-full"
                    />
                );
            })}
        </View>
    );
}

const STEPS = 6;
const rotationOffset = 180;

export default function Screen() {
    const { isDarkColorScheme } = useColorScheme();
    const [step, setStep] = React.useState(0);
    const [canProceed, setCanProceed] = React.useState(false);
    const [canProceedOptions, setCanProceedOptions] = React.useState(false);
    const leftOpacity = useSharedValue(0.3);
    const leftColor = useSharedValue(isDarkColorScheme ? "#1f2937" : "#4b5563");
    const rightColor = useSharedValue(isDarkColorScheme ? "#1f2937" : "#4b5563");
    const rightWidth = useSharedValue(48);

    const rightBorder = useSharedValue("#ababab");
    
    const rotation = useSharedValue(0);
    const checkOpacity = useSharedValue(0);
    const arrowOpacity = useSharedValue(1);
    
    // Scale values for hover and press animations
    const leftScale = useSharedValue(1);
    const rightScale = useSharedValue(1);
    
    // Card content animation values
    const cardOpacity = useSharedValue(0); // Start at 0 for initial animation
    const cardTranslateX = useSharedValue(20); // Start slightly right
    
    // Progress dots animation values - only 3 dots
    const dotColors = Array.from({ length: 3 }, () => useSharedValue(isDarkColorScheme ? "#374151" : "#9ca3af"));
    const dotOpacities = Array.from({ length: 3 }, () => useSharedValue(1));
    
    const arrowStyle = useAnimatedStyle(() => {
        return {
            transform: [
                {
                    rotate: rotation.value + 'deg'
                }
            ],
            opacity: arrowOpacity.value
        };
    });

    const checkStyle = useAnimatedStyle(() => {
        return {
            transform: [
                {
                    rotate: (rotation.value - 125) + 'deg'
                }
            ],
            opacity: checkOpacity.value,
            position: 'absolute'
        };
    });

    // Card content animation style
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
        
        // Initialize dot colors based on current step
        dotColors.forEach((dotColor, index) => {
            if (index <= step) {
                dotColor.value = withTiming(isDarkColorScheme ? "#3b82f6" : "#000000ff", { duration: 300 });
            } else {
                dotColor.value = withTiming(isDarkColorScheme ? "#374151" : "#cfdaecff", { duration: 300 });
            }
        });
    }, []);

    // Update dot colors when step changes
    React.useEffect(() => {
        dotColors.forEach((dotColor, index) => {
            if (index <= step) {
                dotColor.value = withTiming(isDarkColorScheme ? "#3b82f6" : "#000000ff", { duration: 200 });
            } else {
                dotColor.value = withTiming(isDarkColorScheme ? "#374151" : "#cfdaecff", { duration: 200 });
            }
        });
        
        // Fade out dots on confirm step (step 3) and beyond
        dotOpacities.forEach((dotOpacity) => {
            if (step >= 3) {
                dotOpacity.value = withTiming(0, { duration: 300 });
            } else {
                dotOpacity.value = withTiming(1, { duration: 300 });
            }
        });
    }, [step, isDarkColorScheme]);

    // Monitor file data changes to enable/disable navigation
    React.useEffect(() => {
        const checkFileData = () => {
            const hasFiles = globalFileData.files.length > 0;
            setCanProceed(hasFiles);
        };
        
        // Initial check
        checkFileData();
        
        // Set up interval to periodically check for changes
        const interval = setInterval(checkFileData, 500);
        
        return () => clearInterval(interval);
    }, []);

    // Monitor password changes to enable/disable navigation from Options
    React.useEffect(() => {
        const checkPassword = () => {
            const hasPassword = globalFileData.password.trim().length > 0;
            setCanProceedOptions(hasPassword);
        };
        
        // Initial check
        checkPassword();
        
        // Set up interval to periodically check for changes
        const interval = setInterval(checkPassword, 500);
        
        return () => clearInterval(interval);
    }, []);

    function decrement() {
        if (step > 0) {
            // Animate card out
            cardOpacity.value = withTiming(0, { duration: 150 });
            cardTranslateX.value = withTiming(20, { duration: 150 });
            
            setTimeout(() => {
                const newStep = step - 1;
                setStep(newStep);
                
                // Animate card back in
                cardTranslateX.value = -20;
                cardOpacity.value = withTiming(1, { duration: 150 });
                cardTranslateX.value = withTiming(0, { duration: 150 });
                
                // Handle left button opacity
                if (newStep === 0) {
                    leftOpacity.value = withSpring(0.3);
                    leftColor.value = withTiming(isDarkColorScheme ? "#1f2937" : "#4b5563");
                }
                
                // Handle right button when going back to confirm step (step 3) or higher
                if (newStep >= 3) {
                    // Going back to confirm step or higher - turn green and show checkmark
                    rightColor.value = withTiming("#22c55e");
                    rotation.value = withSpring(125, {
                        damping: 25,
                        stiffness: 120
                    }, () => {
                        rotation.value = 125;
                    });
                    arrowOpacity.value = withTiming(0, {duration: 300});
                    checkOpacity.value = withTiming(1, {duration: 300});
                    rightWidth.value = withSpring(120, {
                        damping: 25,
                        stiffness: 120
                    });
                    rightBorder.value = withTiming("#16a34a");
                }
                
                // Handle right button when going back below confirm step (step 3)
                if (step >= 3 && newStep < 3) {
                    // Coming from confirm step or higher (green) back to normal
                    rotation.value = withSpring(0, {
                        damping: 25,
                        stiffness: 120
                    }, () => {
                        rotation.value = 0;
                    });
                    arrowOpacity.value = withTiming(1, {duration: 300});
                    checkOpacity.value = withTiming(0, {duration: 300});
                    rightWidth.value = withSpring(48, {
                        damping: 25,
                        stiffness: 120
                    });
                    rightBorder.value = withTiming(isDarkColorScheme ? "#4b5563" : "#d1d5db");
                    rightColor.value = withTiming(isDarkColorScheme ? "#1f2937" : "#4b5563");
                }
            }, 150);
        }
    }
    function increment() {
        if (step < STEPS - 1) {
            // Prevent moving from step 0 (FileSelect) if no files have been added
            if (step === 0 && !canProceed) {
                return; // Don't proceed if no files are selected
            }
            
            // Prevent moving from step 1 (Options) if no password is set
            if (step === 1 && !canProceedOptions) {
                return; // Don't proceed if no password is set
            }
            
            // Animate card out
            cardOpacity.value = withTiming(0, { duration: 150 });
            cardTranslateX.value = withTiming(-20, { duration: 150 });
            
            setTimeout(() => {
                const newStep = step + 1;
                setStep(newStep);
                
                // Animate card back in
                cardTranslateX.value = 20;
                cardOpacity.value = withTiming(1, { duration: 150 });
                cardTranslateX.value = withTiming(0, { duration: 150 });
                
                // Handle left button when moving from step 0
                if (step === 0) {
                    leftOpacity.value = withSpring(1);
                    leftColor.value = withTiming(isDarkColorScheme ? "#1f2937" : "#4b5563");
                }
                
                // Handle right button when reaching confirm step (step 3) or higher
                if (newStep >= 3) {
                    // Reached confirm step or beyond - turn green and show checkmark
                    rightColor.value = withTiming("#22c55e");
                    rotation.value = withSpring(125, {
                        damping: 25,
                        stiffness: 120
                    }, () => {
                        rotation.value = 125;
                    });
                    arrowOpacity.value = withTiming(0, {duration: 300});
                    checkOpacity.value = withTiming(1, {duration: 300});
                    rightWidth.value = withSpring(120, {
                        damping: 25,
                        stiffness: 120
                    });
                    rightBorder.value = withTiming("#16a34a");
                }
            }, 150);
        }
    }

    const button = {
        borderWidth: 2,
        borderColor: isDarkColorScheme ? "#4b5563" : "#d1d5db",
        borderRadius: 24
    }
    const leftButton = useAnimatedStyle(() => {
        return {
            opacity: leftOpacity.value, 
            backgroundColor: leftColor.value,
            transform: [{scale: leftScale.value}]
        }
    })
    const rightButton = useAnimatedStyle(() => {
        // Show reduced opacity when on step 0 and can't proceed, or step 1 without password
        const shouldShowDisabled = (step === 0 && !canProceed) || (step === 1 && !canProceedOptions);
        return {
            backgroundColor: rightColor.value, 
            width: rightWidth.value, 
            borderColor: rightBorder.value,
            transform: [{scale: rightScale.value}],
            opacity: shouldShowDisabled ? 0.3 : 1
        }
    })

    const renderCardContent = () => {
        switch(step) {
            case 0:
                return <FileSelect />;
            case 1:
                return <Options />;
            case 2:
                return <Display />;
            case 3:
                return <Confirm />;
            case 4:
                return <Upload onComplete={increment} />;
            case 5:
                return <Results />;
            default:
                return <FileSelect />;
        }
    };

    return (
        <SafeAreaView className="flex-1 justify-center items-center gap-5 bg-background" >
        <Animated.View entering={FadeInUp.damping(50).stiffness(60)}
            exiting={FadeOutDown}
            className="w-full max-w-sm mx-4">
            <Card className="w-full max-w-sm rounded-2xl">
                    <CardHeader className="pb-3.5 flex-row justify-between items-center">
                        <CardTitle className="text-4xl">New Secret</CardTitle>
                        <Image 
                            source={require('~/icons/web/icon.png')} 
                            style={{width: 48, height: 48, borderRadius: 12}}
                            resizeMode="contain"
                        />
                    </CardHeader>
                    
                    <Animated.View 
                        style={[cardContentStyle]}
                        className="min-h-[350px] sm:min-h-[300px]">
                        {renderCardContent()}
                    </Animated.View>
                    
                    <View className="flex-row justify-between items-center p-4">
                        {/* Only show navigation buttons before step 4 (Upload) and step 5 (Results) */}
                        {step < 4 ? (
                            <>
                                <Animated.View className="rounded-full"
                                    style={
                                        [leftButton, {height: 48, width: 48}]
                                }>
                                    <Pressable className="justify-center items-center"
                                        style={
                                            [button, leftButton, {height: 48, width: 48}]
                                        }
                                        disabled={
                                            step === 0
                                        }
                                        onPress={decrement}
                                        onHoverIn={() => {
                                            leftScale.value = withSpring(1.1, {damping: 15, stiffness: 120});
                                        }}
                                        onHoverOut={() => {
                                            leftScale.value = withSpring(1, {damping: 15, stiffness: 120});
                                        }}
                                        onPressIn={() => {
                                            leftScale.value = withSpring(0.9, {damping: 15, stiffness: 120});
                                        }}
                                        onPressOut={() => {
                                            leftScale.value = withSpring(1.1, {damping: 10, stiffness: 120});
                                        }}>
                                        <Ionicon name="arrow-back"
                                            size={24}
                                            color="white"/>
                                    </Pressable>
                                </Animated.View>
                                
                                {/* Progress Dots */}
                                <ProgressDots dotColors={dotColors} dotOpacities={dotOpacities} />
                                
                                <Animated.View  className="rounded-full"
                                    style={
                                        [rightButton, {height: 48}]
                                }>
                                    <Pressable className="justify-center items-center"
                                        style={[button, rightButton, {height: 48}]}
                                        onPress={increment}
                                        disabled={(step === 0 && !canProceed) || (step === 1 && !canProceedOptions)}
                                        onHoverIn={() => {
                                            if (!((step === 0 && !canProceed) || (step === 1 && !canProceedOptions))) {
                                                rightScale.value = withSpring(1.1, {damping: 15, stiffness: 120});
                                            }
                                        }}
                                        onHoverOut={() => {
                                            if (!((step === 0 && !canProceed) || (step === 1 && !canProceedOptions))) {
                                                rightScale.value = withSpring(1, {damping: 15, stiffness: 120});
                                            }
                                        }}
                                        onPressIn={() => {
                                            if (!((step === 0 && !canProceed) || (step === 1 && !canProceedOptions))) {
                                                rightScale.value = withSpring(0.9, {damping: 15, stiffness: 120});
                                            }
                                        }}
                                        onPressOut={() => {
                                            if (!((step === 0 && !canProceed) || (step === 1 && !canProceedOptions))) {
                                                rightScale.value = withSpring(1.1, {damping: 10, stiffness: 120});
                                            }
                                        }}>
                                        <Animated.View style={arrowStyle}>
                                            <Ionicon name="arrow-forward" size={24} color="white"/>
                                        </Animated.View>
                                        <Animated.View style={checkStyle}>
                                            <Ionicon name="checkmark" size={24} color="black"/>
                                        </Animated.View>
                                    </Pressable>
                                </Animated.View>
                            </>
                        ) : (
                            // Empty space to maintain layout when buttons are hidden
                            <View className="flex-1" />
                        )}
                    </View>
                </Card>
            </Animated.View>
        </SafeAreaView>
    )
}