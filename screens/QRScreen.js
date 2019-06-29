import * as React from 'react';
import { Text, View, StyleSheet, Button,Alert } from 'react-native';
import Constants from 'expo-constants';
import * as Permissions from 'expo-permissions';
import { BarCodeScanner } from 'expo-barcode-scanner';
import {withNavigation} from 'react-navigation';
import {getJSON} from '../utils';

class QRScreen extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      hasCameraPermission: null,
      scanned: false
    };

  }

  async componentDidMount() {
    this.getPermissionsAsync();
    const { navigation } = this.props;
    this.focusListener = navigation.addListener("didFocus", () => {
      this.setState({scanned:false});
    });
  }
  componentWillUnmount() {
    this.focusListener.remove();
  }


  getPermissionsAsync = async () => {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    this.setState({ hasCameraPermission: status === 'granted' });
  };

  render() {
    const { hasCameraPermission, scanned } = this.state;

    if (hasCameraPermission === null) {
      return <Text>Requesting for camera permission</Text>;
    }
    if (hasCameraPermission === false) {
      return <Text>No access to camera</Text>;
    }
    return (
      <View style={styles.flex}>
        <View
        style={styles.box1}>
          <BarCodeScanner
            onBarCodeScanned={scanned ? undefined:this.handleBarCodeScanned}
            style={StyleSheet.absoluteFillObject}
          />
        </View>
      </View>
    );
  }

  handleBarCodeScanned = ({ type, data }) => {
    this.setState({scanned: true});
    console.log(data);
    getJSON(`/3.0/authenticated/attendee-info-by-qrcode/${encodeURIComponent(data)}`,true).then(res=>{
      if(res.success){
        console.log(res.data);
      }else{
        Alert.alert('Error',res.error,[{text: 'OK', onPress: () => this.setState({scanned:false})}]);
      }
    });
  };
}
const styles = StyleSheet.create({
  flex:{
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  box1: {
    width: '75%',
    paddingBottom: '75%',
  },

});

export default withNavigation(QRScreen);
