import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Button,
} from 'react-native';
import {Google} from "expo";
export default class SignInScreen extends React.Component {
  static navigationOptions = {
    header: null,
  };
  state = {
    token: ""
  };
  signInWithGoogleAsync = async () => {
    try {
      const result = await Expo.Google.logInAsync({
        androidClientId: "685316187274-auurp8c9dam83f9s1oncr1h9hdd5hgkq.apps.googleusercontent.com",
        iosClientId: "685316187274-pkifd6gj4jaludh0tjuteu4klvi93s6q.apps.googleusercontent.com",
        scopes: ['profile', 'email'],
      });

      if (result.type === 'success') {
        this.setState({token: result.accessToken});
        this.getUserInfo(this.state.token);
      } else {
        return { cancelled: true };
      }
    } catch (e) {
      return { error: true };
    }
  }
  getUserInfo = async (accessToken) => {
    await fetch('https://www.googleapis.com/userinfo/v2/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    }).then((response)=>response.json()).then((response)=>{
      if(response.email.includes("@mvhacks.io")){
        this.props.navigation.navigate('App');
      }
    });
  }
  render() {
    return (
      <View style={styles.container}>
        <Text>Please login using your MVHacks account</Text>
        <Button
          onPress={this.signInWithGoogleAsync}
          title="Login with Google"
          color="#841584"
          accessibilityLabel="Learn more about this purple button"
        />
      </View>
    );
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
