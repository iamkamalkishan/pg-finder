import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useAuth } from "../context/AuthContext";

// Screens
import { HomeScreen } from "../screens/home/HomeScreen";
import { SearchScreen } from "../screens/search/SearchScreen";
import { ListingDetailScreen } from "../screens/listing/ListingDetailScreen";
import { ChatScreen } from "../screens/chat/ChatScreen";
import { ProfileScreen } from "../screens/profile/ProfileScreen";
import { OnboardingScreen } from "../screens/auth/OnboardingScreen";
import { PhoneAuthScreen } from "../screens/auth/PhoneAuthScreen";
import { OwnerDashboardScreen } from "../screens/owner/OwnerDashboardScreen";
import { AddPGScreen } from "../screens/owner/AddPGScreen";
import { OwnerEnquiriesScreen } from "../screens/owner/OwnerEnquiriesScreen";
import { OwnerAnalyticsScreen } from "../screens/owner/OwnerAnalyticsScreen";
import { OwnerPayoutsScreen } from "../screens/owner/OwnerPayoutsScreen";
import { SOSScreen } from "../screens/safety/SOSScreen";
import { SafetyScoreScreen } from "../screens/safety/SafetyScoreScreen";
import { ReviewScreen } from "../screens/safety/ReviewScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function GirlTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;
          if (route.name === "Home") iconName = focused ? "home-fill" : "home";
          else if (route.name === "Search")
            iconName = focused ? "search-fill" : "search";
          else if (route.name === "Chats")
            iconName = focused ? "chat-fill" : "chat";
          else if (route.name === "Profile")
            iconName = focused ? "person-fill" : "person";
          else iconName = "home";

          // Using simple text icons for now - replace with actual icon library
          return <Text style={{ fontSize: size, color }}>{iconName}</Text>;
        },
        tabBarActiveTintColor: "#E91E63",
        tabBarInactiveTintColor: "#757575",
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Chats" component={ChatScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function OwnerTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;
          if (route.name === "Dashboard")
            iconName = focused ? "dashboard-fill" : "dashboard";
          else if (route.name === "Listings")
            iconName = focused ? "list-fill" : "list";
          else if (route.name === "Enquiries")
            iconName = focused ? "mail-fill" : "mail";
          else if (route.name === "Analytics")
            iconName = focused ? "chart-fill" : "chart";
          else iconName = "dashboard";

          return <Text style={{ fontSize: size, color }}>{iconName}</Text>;
        },
        tabBarActiveTintColor: "#E91E63",
        tabBarInactiveTintColor: "#757575",
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={OwnerDashboardScreen} />
      <Tab.Screen name="Listings" component={AddPGScreen} />
      <Tab.Screen name="Enquiries" component={OwnerEnquiriesScreen} />
      <Tab.Screen name="Analytics" component={OwnerAnalyticsScreen} />
      <Tab.Screen name="Payouts" component={OwnerPayoutsScreen} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen
            name="Loading"
            component={() => (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading...</Text>
              </View>
            )}
          />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="PhoneAuth" component={PhoneAuthScreen} />
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          </>
        ) : user.role === "girl" ? (
          <>
            <Stack.Screen name="GirlTabs" component={GirlTabs} />
            <Stack.Screen
              name="ListingDetail"
              component={ListingDetailScreen}
            />
            <Stack.Screen name="ChatDetail" component={ChatScreen} />
            <Stack.Screen name="SOS" component={SOSScreen} />
            <Stack.Screen name="SafetyScore" component={SafetyScoreScreen} />
            <Stack.Screen name="Review" component={ReviewScreen} />
          </>
        ) : user.role === "owner" ? (
          <>
            <Stack.Screen name="OwnerTabs" component={OwnerTabs} />
            <Stack.Screen name="AddPG" component={AddPGScreen} />
            <Stack.Screen
              name="ListingDetail"
              component={ListingDetailScreen}
            />
            <Stack.Screen name="ChatDetail" component={ChatScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="GirlTabs" component={GirlTabs} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Temporary styles
import { View, Text, StyleSheet } from "react-native";

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 18,
    color: "#757575",
  },
});
