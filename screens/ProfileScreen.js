import React, { Component } from 'react';
import { View, Text,Button,StyleSheet,Image} from 'react-native';
import {getJSON,postJSON} from '../utils';
import {withNavigationFocus} from 'react-navigation';
import { BarCodeScanner } from 'expo-barcode-scanner';
import * as Permissions from 'expo-permissions';
import { Camera } from 'expo-camera';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import S3 from 'aws-sdk/clients/s3';
import uuidv4 from 'uuid/v4';
class ProfileScreen extends Component{
    constructor(props) {
        super(props);
    
        this.state = {
            scanned:true,
            error: false,
            errorText: "",
            loading:true,
            finishprofile:0,
            email:"",
            qrcode:"",
            hasQRCode: false,
            hasCameraPermission: false,
            hasPicture: false,
            userInfo: {},
            picture:""
        };
      }
    async componentDidMount(){
        this.getPermissionsAsync();
        const { navigation } = this.props;
        if(navigation.getParam('email')){
            await this.setState({email:navigation.getParam('email')});
            await this.getUserInfoEmail();
            this.setState({loading:false});
        } else if(navigation.getParam('qrcode')){
            await this.setState({qrcode:navigation.getParam('qrcode')});
        }else{
            this.setState({ error: true,errorText:"error: no param input"});
        }
    }
    getPermissionsAsync = async () => {
        const { status } = await Permissions.askAsync(Permissions.CAMERA);
        this.setState({ hasCameraPermission: status === 'granted' });
    };
    getUserInfoEmail = () =>{
        getJSON(`/3.0/authenticated/attendee-info-by-email/${encodeURIComponent(this.state.email)}`,true).then((res)=>{
            if(!res.success){
                this.setState({error:true,errorText:res.error});
            }else{
                if(res.data.attendee.qrcode_id != null){
                    this.setState({qrcode:res.data.attendee.qrcode_id,hasQRCode:true});
                }
                if(res.data.attendee.properties.profile_pic_id!=null){
                    this.downloadPicture(res.data.attendee.properties.profile_pic_id);
                }
                this.setState({userInfo:res.data});
            }
        }).catch((err)=>{
            console.log(err);
        });
    }
    downloadPicture = async (id) =>{
        console.log("made it here");
        let s3  =new S3({accessKeyId:"AKIA5ZSLQXH57WDBWZPO",secretAccessKey:"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"});
        let params = {
            Bucket: "mvhacks",
            Key: id
        }
        s3.getObject(params,(err,data)=>{
            console.log(err);
            console.log(data);
        });
    }
    handleBarCodeScanned = ({ type, data }) => {
        this.setState({scanned: false});
        postJSON("https://api.mvhacks.io/3.0/authenticated/set-qrcode",{
            "attendee_email": this.state.email,
            "qrcode": data
        },true).then((res)=>{
            if(res.success){
                this.setState({finishprofile:2,hasQRCode:true});
            }else{
                this.setState({error:true,errorText:res.error});
            }
        }).catch((err)=>{
            console.log(err);
        });
      };
    checkQRCode = () =>{
        if(this.state.hasQRCode){
            this.setState({finishprofile:2});
        }else{
            this.setState({finishprofile:1})  
        }
    }
    takePicture = async () =>{
        if (this.camera) {
            let photo = await this.camera.takePictureAsync();
            this.uploadPhoto(photo.uri)
            this.setState({picture:photo.uri,hasPicture:true});
          }
    }
    uploadPhoto = async(uri) =>{
        let s3  =new S3({accessKeyId:"AKIA5ZSLQXH57WDBWZPO",secretAccessKey:"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"});
        let id = uuidv4()+".jpg";
        let response = await fetch(uri);
        let blob = await response.blob();
        let params ={
            Bucket: 'mvhacks',
            Key: id,
            Body: blob,
            ACL: "aws-exec-read",
            ContentType: "image/jpg",
            ServerSideEncryption: "AES256",
        };
        s3.upload(params,(err,data)=>{
            if(err){
                console.log(err);
            }else{
                console.log(data);
                postJSON('/3.0/authenticated/set-profile-picture',{
                    "attendee_email": this.state.email,
                    "profile_pic_id": id
                },true).then((res)=>{
                    if(res.error){
                        this.setState({error:true,errorText:res.error});
                    }
                }).catch((err)=>{
                    console.log(err);
                });
            }
        });
    }
    FinishProfile = () =>{
        if(this.state.finishprofile===0){
            return(
            <View>
                <Text>
                    It would seem that there is no QR code or picture set for this account.
                    QR Code: {this.state.hasQRCode ? "yes":"no"},
                    Picture: {this.state.hasPicture ? "yes":"no"}
                </Text>
                <Button 
                    onPress={()=>this.checkQRCode()}
                    title="Finsh Profile"
                />
            </View>
            );
        }
        else if(this.state.finishprofile===1&&this.state.hasQRCode===false){
            if(this.state.hasCameraPermission===false){
                return(<View><Text>This app does not have camera permissions. Please go into the settings of this device and allow the camera to be used.</Text></View>);
            }else{
                return(
                    <View style={styles.flex}>
                        <View
                        style={styles.box1}>
                        <BarCodeScanner
                            onBarCodeScanned={this.state.scanned&&this.props.isFocused ? this.handleBarCodeScanned:undefined}
                            style={StyleSheet.absoluteFillObject}
                        />
                        </View>
                    </View>
                );
            }
        }else if(this.state.finishprofile===2){
            if(this.state.hasCameraPermission===false){
                return(<View><Text>This app does not have camera permissions. Please go into the settings of this device and allow the camera to be used.</Text></View>);
            }else{
                return(
                    <View style={{flex:1}}>
                        <Camera autoFocus={Camera.Constants.AutoFocus.on} style={{flex:1,flexDirection:"row",alignItems:"flex-end"}} ref={ref => {this.camera = ref;}} autoFocus={Camera.Constants.AutoFocus.on}>
                            <View style={{flex:1}}>
                                <TouchableOpacity onPress={this.takePicture} style={{alignSelf:"center"}}>
                                    <Ionicons name="ios-radio-button-on" size={70} color="white" />
                                </TouchableOpacity>
                            </View>
                        </Camera>
                    </View>
                );
            }
        }
        else{
            return(
            <View>
                <Text>
                    Wow! Don't know how you got here, but hey congrats. Now go tell somebody on the tech team what you just did.
                </Text>
            </View>
            );
        }
    }
    render(){
        if(this.state.loading){
            return(<View><Text>Loading</Text></View>);
        }
        if(this.state.error){
            return(<View><Text>{this.state.errorText}</Text></View>);
        }
        if(this.state.hasQRCode&&this.state.hasPicture){
            return(<View><Image
                style={{width: 50, height: 50}}
                source={{ uri: this.state.picture }}
              /></View>);
        }else{
            return(this.FinishProfile());
        }
    }
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
    }
  
});

export default withNavigationFocus(ProfileScreen);