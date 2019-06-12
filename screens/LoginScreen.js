import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  AsyncStorage
} from 'react-native';
import { Google } from 'expo';

import { postJSON, getJSON } from '../utils';
import { TouchableOpacity } from 'react-native-gesture-handler';

export default class LoginScreen extends React.Component {
  state = {
    error: false
  }

  constructor(props) {
    super(props);
    this.signInWithGoogle = this.signInWithGoogle.bind(this);
  }

  async signInWithGoogle() {
    let error = false;

    let res = await Google.logInAsync({
      androidClientId: '191794380792-8olicctoe6vdnk9c9rp1g73aj7rvb8sk.apps.googleusercontent.com',
      iosClientId: '191794380792-cevs0kee52ilj0om28d1kuthcmjbi5p5.apps.googleusercontent.com',
      scopes: ['profile', 'email'],
    });

    if (res.type === 'success') {
      let google_token = res.accessToken;

      try {
        let response = await postJSON('/3.0/login', {
          google_token
        });
        
        if (response.success) {
          await AsyncStorage.setItem('token', response.data.token);
        } else {
          error = 'There was an error with MVHacks servers — received bad result (' + response.error + ')';
        }
      } catch (e) {
        console.log(e);
        error = 'There was an error with MVHacks servers: couldn\'t perform request';
      }

    } else {
      error = 'There was an error with Google';
    }

    this.setState({ error });
  }
  
  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Login using your MVHacks account</Text>
        {this.state.error && <Text style={{ color: '#ff0000', fontSize: 20}}>{this.state.error}</Text>}
        <TouchableOpacity
          onPress={this.signInWithGoogle}
          style={{
            backgroundColor: '#ff0000',
            padding: 10,
            borderRadius: 6,
            marginTop: 20,
            alignItems: 'center'
          }}
        >
          <Text
            style={{
              fontSize: 20,
              color: '#fff',
            }}
          >Sign in with Google</Text>
        </TouchableOpacity>
      </View>
    )
  }
}
const styles = StyleSheet.create({
  container: {
    marginLeft: 10,
    marginRight: 10,
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    fontWeight: 'bold',
    fontSize: 40,
    marginTop: 50
  }
});
