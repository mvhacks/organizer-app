import * as React from 'react';
import { Text, View, StyleSheet,Alert } from 'react-native';
import * as Permissions from 'expo-permissions';
import { BarCodeScanner } from 'expo-barcode-scanner';
import {withNavigationFocus} from 'react-navigation';
import {getJSON} from '../utils';

class QRScreen extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      hasCameraPermission: null,
      scanned: true
    };

  }

  async componentDidMount() {
    this.getPermissionsAsync();
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
            onBarCodeScanned={scanned&&this.props.isFocused ? this.handleBarCodeScanned:undefined}
            style={StyleSheet.absoluteFillObject}
          />
        </View>
      </View>
    );
  }

  handleBarCodeScanned = ({ type, data }) => {
    const {navigate} = this.props.navigation;
    this.setState({scanned: false});
    console.log(this.props.isFocused);
    // console.log(data);
    getJSON(`/3.0/authenticated/attendee-info-by-qrcode/${encodeURIComponent(data)}`,true).then(res=>{
      if(res.success){
        navigate('Profile',{qrcode:data});
        this.setState({scanned:true})
      }else{
        Alert.alert('Error',res.error,[{text: 'OK', onPress: () => this.setState({scanned:true})}]);
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

export default withNavigationFocus(QRScreen);
