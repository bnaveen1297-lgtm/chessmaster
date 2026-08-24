import React from 'react';
import { Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors } from '../theme';

import { WelcomeScreen } from '../screens/WelcomeScreen';
import { SignInScreen } from '../screens/SignInScreen';
import { SignUpScreen } from '../screens/SignUpScreen';
import { ClassScreen } from '../screens/ClassScreen';
import { PuzzleScreen } from '../screens/PuzzleScreen';
import { SubscriptionsScreen } from '../screens/SubscriptionsScreen';
import { GameScreen } from '../screens/GameScreen';
import { ShopScreen } from '../screens/ShopScreen';
import { LiveGameScreen } from '../screens/LiveGameScreen';
import { PuzzleSolveScreen } from '../screens/PuzzleSolveScreen';
import { AnalyzeScreen } from '../screens/AnalyzeScreen';
import { CoachScreen } from '../screens/CoachScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

export type RootStackParamList = {
  Welcome: undefined;
  SignIn: undefined;
  SignUp: undefined;
  Main: undefined;
  Profile: undefined;
  LiveGame: { id: string };
  PuzzleSolve: { id: string };
  Analyze: undefined;
  Coach: undefined;
};

export type TabParamList = {
  Class: undefined;
  Puzzle: undefined;
  Plans: undefined;
  Game: undefined;
  Shop: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const icon = (glyph: string) => ({ color }: { color: string }) =>
  <Text style={{ fontSize: 18, color }}>{glyph}</Text>;

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.border,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen name="Class" component={ClassScreen} options={{ tabBarIcon: icon('📚') }} />
      <Tab.Screen name="Puzzle" component={PuzzleScreen} options={{ tabBarIcon: icon('🧩') }} />
      <Tab.Screen name="Game" component={GameScreen} options={{ tabBarIcon: icon('♟️') }} />
      <Tab.Screen name="Plans" component={SubscriptionsScreen} options={{ tabBarLabel: 'Plans', tabBarIcon: icon('⭐') }} />
      <Tab.Screen name="Shop" component={ShopScreen} options={{ tabBarIcon: icon('🛍️') }} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.ink,
        headerShadowVisible: false,
        headerTitle: '',
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Analyze" component={AnalyzeScreen} />
      <Stack.Screen name="Coach" component={CoachScreen} />
      <Stack.Screen name="LiveGame" component={LiveGameScreen} options={{ headerShown: false }} />
      <Stack.Screen name="PuzzleSolve" component={PuzzleSolveScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
