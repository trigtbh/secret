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
    withSpring,
    withTiming
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


import FileSelect from '~/app/FileSelect';
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

const STEPS = 2;
const rotationOffset = 180;

export default function Screen() {
    const { isDarkColorScheme } = useColorScheme();
    const [step, setStep] = React.useState(0);
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

    function decrement() {
        if (step > 0) {
            const newStep = step - 1;
            setStep(newStep);
            
            // Handle left button opacity
            if (newStep === 0) {
                leftOpacity.value = withSpring(0.3);
                leftColor.value = withTiming(isDarkColorScheme ? "#1f2937" : "#4b5563");
            }
            
            // Handle right button when going from final step back to previous
            if (step === STEPS - 1) {
                // Coming from final step (green) back to normal
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
        }
    }
    function increment() {
        if (step < STEPS - 1) {
            const newStep = step + 1;
            setStep(newStep);
            
            // Handle left button when moving from step 0
            if (step === 0) {
                leftOpacity.value = withSpring(1);
                leftColor.value = withTiming(isDarkColorScheme ? "#1f2937" : "#4b5563");
            }
            
            // Handle right button when reaching final step
            if (newStep === STEPS - 1) {
                // Reached final step - turn green and show checkmark
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
        return {
            backgroundColor: rightColor.value, 
            width: rightWidth.value, 
            borderColor: rightBorder.value,
            transform: [{scale: rightScale.value}]
        }
    })

    const renderCardContent = () => {
        switch(step) {
            case 0:
                return <FileSelect />;
            // case 1:
            //     return <StepOnePage />;
            // case 2:
            //     return <StepTwoPage />;
            // ... etc
            default:
                return <FileSelect />;
        }
    };

    return (
        <SafeAreaView className="flex-1 justify-center items-center gap-5 bg-secondary/30"> {/* <Text className="text-4xl font-bold border-1 border-red-50">Hello world!</Text> */}
            <Animated.View entering={FadeInUp}
                exiting={FadeOutDown}
                className="w-full max-w-sm">
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
                        key={step}
                        entering={FadeIn.delay(450)}
                        exiting={FadeOut}
                        className="min-h-[300px]">
                        {renderCardContent()}
                    </Animated.View>
                    
                    <View className="flex-row justify-between items-center p-4">
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
                        <Animated.View  className="rounded-full"
                            style={
                                [rightButton, {height: 48}]
                        }>
                            <Pressable className="justify-center items-center"
                                style={[button, rightButton, {height: 48}]}
                                onPress={increment}
                                onHoverIn={() => {
                                    rightScale.value = withSpring(1.1, {damping: 15, stiffness: 120});
                                }}
                                onHoverOut={() => {
                                    rightScale.value = withSpring(1, {damping: 15, stiffness: 120});
                                }}
                                onPressIn={() => {
                                    rightScale.value = withSpring(0.9, {damping: 15, stiffness: 120});
                                }}
                                onPressOut={() => {
                                    rightScale.value = withSpring(1.1, {damping: 10, stiffness: 120});
                                }}>
                                <Animated.View style={arrowStyle}>
                                    <Ionicon name="arrow-forward" size={24} color="white"/>
                                </Animated.View>
                                <Animated.View style={checkStyle}>
                                    <Ionicon name="checkmark" size={24} color="black"/>
                                </Animated.View>
                            </Pressable>
                        </Animated.View>
                    </View>
                </Card>
            </Animated.View>
        </SafeAreaView>
    )
}