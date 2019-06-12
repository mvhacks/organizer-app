import React from 'react';
import {
  View,
  Text
} from 'react-native';
import { getJSON, accentColor } from '../utils';
import { TouchableOpacity } from 'react-native-gesture-handler';


export default class SettingsScreen extends React.Component {
  state = {
    email: 'loading'
  }

  render() {
    return (
      <View style={{
        padding: 20
      }}>
        <Text style={{ fontSize: 18 }}>
          You are signed in with
        </Text>
        <Text
          style={{
            fontSize: 30,
            fontWeight: 'bold'
          }}
        >{this.state.email}</Text>
        <TouchableOpacity
          onPress={global.logout}
          style={{
            backgroundColor: accentColor,
            padding: 10,
            borderRadius: 6,
            marginTop: 20,
            alignItems: 'center'
          }}
        >
          <Text style={{ color: '#fff', fontSize: 20 }}>Logout</Text>
        </TouchableOpacity>
      </View>
    );
  }

  componentDidMount() {
    getJSON('/3.0/authenticated/me', true).then(res => {
      this.setState({
        email: res.data
      });
    });
  }
}

SettingsScreen.navigationOptions = {
  title: 'Settings',
}
