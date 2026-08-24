import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors } from '../theme';
import { useAuth } from '../auth/AuthContext';

import { WelcomeScreen } from '../screens/WelcomeScreen';
import { SignInScreen } from '../screens/SignInScreen';
import { SignUpScreen } from '../screens/SignUpScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ClassScreen } from '../screens/ClassScreen';
import { PuzzleScreen } from '../screens/PuzzleScreen';
import { SubscriptionsScreen } from '../screens/SubscriptionsScreen';
import { GameScreen } from '../screens/GameScreen';
import { ShopScreen } from '../screens/ShopScreen';
import { LiveGameScreen } from '../screens/LiveGameScreen';
import { PuzzleSolveScreen } from '../screens/PuzzleSolveScreen';
import { PlayVsComputerScreen } from '../screens/PlayVsComputerScreen';
import { PlayLocalScreen } from '../screens/PlayLocalScreen';
import { AnalyzeScreen } from '../screens/AnalyzeScreen';
import { CoachScreen } from '../screens/CoachScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { LessonScreen } from '../screens/LessonScreen';
import { OpeningsScreen } from '../screens/OpeningsScreen';

export type RootStackParamList = {
  Welcome: undefined;
  SignIn: undefined;
  SignUp: undefined;
  Main: undefined;
  Profile: undefined;
  LiveGame: { id: string };
  PuzzleSolve: { id?: string; puzzle?: import('../data/puzzles').Puzzle };
  PlayVsComputer: undefined;
  PlayLocal: undefined;
  Analyze: undefined;
  Coach: undefined;
  Lesson: { id: string };
  Openings: undefined;
  Plans: undefined;
};

export type TabParamList = {
  Home: undefined;
  Class: undefined;
  Puzzle: undefined;
  Game: undefined;
  Shop: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function TabIcon({ glyph, color }: { glyph: string; color: string }) {
  return <Text style={{ fontSize: 18, color }}>{glyph}</Text>;
}
const icon = (glyph: string) =>
  // eslint-disable-next-line react/display-name
  ({ color }: { color: string }) => <TabIcon glyph={glyph} color={color} />;

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
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: icon('🏠') }} />
      <Tab.Screen name="Class" component={ClassScreen} options={{ tabBarIcon: icon('📚') }} />
      <Tab.Screen name="Puzzle" component={PuzzleScreen} options={{ tabBarIcon: icon('🧩') }} />
      <Tab.Screen name="Game" component={GameScreen} options={{ tabBarIcon: icon('♟️') }} />
      <Tab.Screen name="Shop" component={ShopScreen} options={{ tabBarIcon: icon('🛍️') }} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.ink} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.ink,
        headerShadowVisible: false,
        headerTitle: '',
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      {user ? (
        <>
          <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Analyze" component={AnalyzeScreen} />
          <Stack.Screen name="Coach" component={CoachScreen} />
          <Stack.Screen name="Lesson" component={LessonScreen} />
          <Stack.Screen name="Openings" component={OpeningsScreen} />
          <Stack.Screen name="Plans" component={SubscriptionsScreen} options={{ title: 'Plans' }} />
          <Stack.Screen name="LiveGame" component={LiveGameScreen} options={{ headerShown: false }} />
          <Stack.Screen name="PuzzleSolve" component={PuzzleSolveScreen} options={{ headerShown: false }} />
          <Stack.Screen name="PlayVsComputer" component={PlayVsComputerScreen} options={{ headerShown: false }} />
          <Stack.Screen name="PlayLocal" component={PlayLocalScreen} options={{ headerShown: false }} />
        </>
      ) : (
        <>
          <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
          <Stack.Screen name="SignIn" component={SignInScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
