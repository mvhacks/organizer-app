import { AppLoading } from 'expo';
import { Asset } from 'expo-asset';
import * as Font from 'expo-font';
import React from 'react';
import { Platform, StatusBar, StyleSheet, View, Text, AsyncStorage } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { getJSON } from './utils';

import AppNavigator from './navigation/AppNavigator';
import LoginScreen from './screens/LoginScreen';

export default class App extends React.Component {
  state = {
    isReady: false,
    isLoggedIn: undefined
  }

  constructor(props) {
    super(props);
    this.loginCompleted = this.loginCompleted.bind(this);
    this.logout = this.logout.bind(this);
    global.logout = this.logout;
  }

  render() {
    if (!this.state.isReady) {
      return (
        <AppLoading
          startAsync={loadResourcesAsync}
          onError={handleLoadingError}
          onFinish={() => this.setState({ isReady: true })}
        />
      );
    } else {
      return (
        <View style={styles.container}>
          {Platform.OS === 'ios' && <StatusBar barStyle="default" />}
          {this.getMainScreen()}
        </View>
      );
    }
  }

  loginCompleted() {
    this.setState({
      isLoggedIn: true
    });
  }

  async logout() {
    await AsyncStorage.removeItem('mvhacks-token');
    await AsyncStorage.removeItem('google-token');
    this.setState({
      isLoggedIn: false
    });
  }

  componentDidMount() {
    getJSON('/3.0/authenticated/me', true).then(res => {
      this.setState({
        isLoggedIn: res.success
      });
    });
  }
  
  getMainScreen() {
    let { isLoggedIn } = this.state;

    if (isLoggedIn === undefined) {
      return (
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <Text style={{ fontSize: 24 }}>Loading</Text>
        </View>
      );
    }

    if (isLoggedIn === false) {
      return <LoginScreen onLogin={this.loginCompleted} />;
    } else {
      return <AppNavigator />;
    }
  }
}

async function loadResourcesAsync() {
  await Promise.all([
    Asset.loadAsync([
      require('./assets/images/robot-dev.png'),
      require('./assets/images/robot-prod.png'),
    ]),
    Font.loadAsync({
      // This is the font that we are using for our tab bar
      ...Ionicons.font,
      // We include SpaceMono because we use it in HomeScreen.js. Feel free to
      // remove this if you are not using it in your app
      'space-mono': require('./assets/fonts/SpaceMono-Regular.ttf'),
    }),
  ]);
}

function handleLoadingError(error) {
  // In this case, you might want to report the error to your error reporting
  // service, for example Sentry
  console.warn(error);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
