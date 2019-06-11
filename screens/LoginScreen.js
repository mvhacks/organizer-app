import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Button
} from 'react-native';
import { Google } from 'expo';

import { postJSON, getJSON } from '../utils.js';

export default class LoginScreen extends React.Component {
  error = false;

  async signInWithGoogle() {
    let res = await Google.logInAsync({
      androidClientId: '191794380792-8olicctoe6vdnk9c9rp1g73aj7rvb8sk.apps.googleusercontent.com',
      iosClientId: '191794380792-cevs0kee52ilj0om28d1kuthcmjbi5p5.apps.googleusercontent.com',
      scopes: ['profile', 'email'],
    });

    if (res.type === 'success') {
      let google_token = res.accessToken;
      let response = await getJSON('/3.0/login', {
        google_token
      });

      if (!response.success) {
        this.error = 'There was an error with MVHacks servers';
      }
    } else {
      this.error = 'There was an error with Google';
    }
  }
  
  render() {
    return (
      <View style={styles.container}>
        <Text>Please login using your MVHacks account</Text>
        {this.error && <Text>There was an error signing in to Google</Text>}
        <Button
          title="Sign in with google"
          color="#841584"
          onPress={this.signInWithGoogle}
        />
      </View>
    )
  }
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: `column`,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
