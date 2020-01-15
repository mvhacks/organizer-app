import React, { Component } from 'react';
import { View, Text,Button,StyleSheet,Image,Modal,TextInput,FlatList} from 'react-native';
import {getJSON,postJSON,db} from '../utils';
import {withNavigationFocus} from 'react-navigation';
import { BarCodeScanner } from 'expo-barcode-scanner';
import * as Permissions from 'expo-permissions';
import { Camera } from 'expo-camera';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import S3 from 'aws-sdk/clients/s3';
import uuidv4 from 'uuid/v4';
import {AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY} from 'react-native-dotenv';
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
            picture:"",
            points:null,
            modalVisible: false
        };
      }
    async componentDidMount(){
        this.getPermissionsAsync();
        const { navigation } = this.props;
        if(navigation.getParam('email')){
            await this.setState({email:navigation.getParam('email')});
            this.getUserInfoEmail();
            this.setState({loading:false});

        } else if(navigation.getParam('qrcode')){
            await this.setState({qrcode:navigation.getParam('qrcode'),hasQRCode:true});
            db.collection("users").doc(navigation.getParam('qrcode')).onSnapshot((doc)=>{
                this.setState({points:doc.data().points})
            });
            this.getUserInfoQRCode();
            this.setState({loading:false});
        }else{
            this.setState({ error: true,errorText:"error: no param input"});
        }
    }
    getPermissionsAsync = async () => {
        const { status } = await Permissions.askAsync(Permissions.CAMERA);
        this.setState({ hasCameraPermission: status === 'granted' });
    };
    getUserInfoQRCode = () =>{
        getJSON(`/3.0/authenticated/attendee-info-by-qrcode/${encodeURIComponent(this.state.qrcode)}`,true).then((res)=>{
            if(!res.success){
                this.setState({error:true,errorText:res.error});
            }else{
                if(res.data.email != null){
                    this.setState({email:res.data.email});
                }
                if(res.data.properties.profile_pic_id!=null||res.data.properties.profile_pic_id===""){
                    this.downloadPicture(res.data.properties.profile_pic_id);
                }
                this.setState({userInfo:res.data});
            }
        }).catch((err)=>{
            console.log(err);
        });
    }
    getUserInfoEmail = () =>{
        getJSON(`/3.0/authenticated/attendee-info-by-email/${encodeURIComponent(this.state.email)}`,true).then((res)=>{
            if(!res.success){
                this.setState({error:true,errorText:res.error});
            }else{
                if(res.data.qrcode_id != null||res.data.qrcode_id !==""){
                    ("i made it")
                    this.setState({qrcode:res.data.qrcode_id,hasQRCode:true});
                    db.collection("users").doc(res.data.qrcode_id).onSnapshot((doc)=>{
                        this.setState({points:doc.data().points})
                    });
                }
                if(res.data.properties.profile_pic_id!=null||res.data.properties.profile_pic_id!==""){
                    this.downloadPicture(res.data.properties.profile_pic_id);
                }
                this.setState({userInfo:res.data});
                
            }
        }).catch((err)=>{
            console.log(err);
        });
    }
    downloadPicture = async (id) =>{
        let s3  =new S3({accessKeyId: AWS_ACCESS_KEY_ID,secretAccessKey: AWS_SECRET_ACCESS_KEY});
        let params = {
            Bucket: "mvhacks",
            Key: id,
            Expires: 60 
        }
        s3.getSignedUrl('getObject', params,(err,url)=>{
            if(err){
                console.log(err);
            }else{
                this.setState({picture:url,hasPicture:true})
            }
        });
    }
    handleBarCodeScanned = ({ type, data }) => {
        this.setState({scanned: false});
        postJSON("https://api.mvhacks.io/3.0/authenticated/set-qrcode",{
            "attendee_email": this.state.email,
            "qrcode": data
        },true).then((res)=>{
            if(res.success){
                db.collection("users").doc(data).set({points:"0"});
                db.collection("users").doc(data).onSnapshot((doc)=>{
                    this.setState({points:doc.data().points})
                });
                this.setState({finishprofile:2,hasQRCode:true,qrcode:data});
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
        let s3  =new S3({accessKeyId: AWS_ACCESS_KEY_ID,secretAccessKey: AWS_SECRET_ACCESS_KEY});
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
                    title="Finish Profile"
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
    changeModal = () =>{
        this.setState({modalVisible:!this.state.modalVisible});
    }
    changePoints = (pointsLocal) =>{
        this.setState({points:pointsLocal})
        db.collection("users").doc(this.state.qrcode).set({points:pointsLocal});
    }
    convertProperties = () =>{
        let a = Object.entries(this.state.userInfo.properties);
        let b = []
        for(let i =0;i<a.length;i++){
            let x = a[i];
            b.push({"key":x[0],"value":x[1]});
        }
        console.log(b)
        return b;
    }
    keyExtractor = (item,index) => item.key;
    renderItem = ({item}) => {
        if(item.key!=="profile_pic_id"||item.key!=="dietary_restrictions"){
            return(<View>
                <Text>
                    {item.key}:{item.value}
                </Text>
            </View>
            );
        }else{
            return;
        }
    }
    miscInfo = () =>{
        if(this.state.userInfo.properties){
            return(
                <View style={{flex:2}}>
                    <FlatList
                        keyExtractor={this.keyExtractor}
                        data={this.convertProperties()}
                        renderItem={this.renderItem}
                    />
                </View>
            )
        }
        else{
            return(
                <View style={{flex:1}}>
                    <Text>
                        For some reason you have no properties
                    </Text>
                </View>
            )
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
            return(
            <View style={{flex:1}}>
                <Modal
                    animationType="slide"
                    visible={this.state.modalVisible}>
                    <View style={{ flex: 1, justifyContent:'center'}}>
                        <TextInput style={{flex:1}} onChangeText={text => this.changePoints(text)} value={String(this.state.points)}/>
                        <View style={{flex:1,flexDirection: 'row'}}>
                            <View style={{flex:1}}>
                                <View style={{flex:1,flexDirection: 'row'}}>
                                    <Button style={{flex:1}} onPress={()=>this.changePoints(this.state.points+1)} title="+1" />
                                    <Button style={{flex:1}} onPress={()=>this.changePoints(this.state.points+10)} title="+10" />
                                </View>
                                <View style={{flex:1,flexDirection: 'row'}}>
                                    <Button style={{flex:1}} onPress={()=>this.changePoints(this.state.points+50)} title="+50" />
                                    <Button style={{flex:1}} onPress={()=>this.changePoints(this.state.points+100)} title="+100" />
                                </View>
                            </View>
                            <View style={{flex:1}}>
                                <View style={{flex:1,flexDirection: 'row'}}>
                                    <Button style={{flex:1}} onPress={()=>this.changePoints(this.state.points-1)} title="-1" />
                                    <Button style={{flex:1}} onPress={()=>this.changePoints(this.state.points-10)} title="-10" />
                                </View>
                                <View style={{flex:1,flexDirection: 'row'}}>
                                    <Button style={{flex:1}} onPress={()=>this.changePoints(this.state.points-50)} title="-50" />
                                    <Button style={{flex:1}} onPress={()=>this.changePoints(this.state.points-100)} title="-100" />
                                </View>
                            </View>
                        </View>
                        <Button style={{flex:1}} onPress={this.changeModal} title="Close" />
                    </View>
                </Modal>
                <View style={{flex:1,flexDirection:'row'}}>
                    <Image style={{flex:1}}source={{ uri: this.state.picture }}/>
                    <View style={{flex:1}}>
                        <Text style={{flex:1}}>Name: {this.state.userInfo.first_name} {this.state.userInfo.last_name}</Text>
                        <Text style={{flex:1}}>Email: {this.state.userInfo.email}</Text>
                        <View style={{flex:1}}>
                            <Text style={{flex:1}}>Points: {this.state.points}</Text>
                            <Button style={{flex:1}} onPress={this.changeModal} title="Change Points" />
                        </View>
                    </View>
                </View>
                {this.miscInfo()}
            </View>);
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