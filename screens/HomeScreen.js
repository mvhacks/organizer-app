import React, { Component } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { ListItem, SearchBar } from 'react-native-elements';
import { postJSON, getJSON } from '../utils';

class HomeScreen extends Component {

  constructor(props) {
    super(props);

    this.state = {
      loading: false,
      data: [],
      error: null,
    };

    this.arrayholder = [];
  }


  componentDidMount() {
    this.makeRemoteRequest();
  }

  makeRemoteRequest = () => {

    this.setState({ loading: true });

    getJSON('/3.0/authenticated/all-attendees', true).then(data => {

      var newData = data.data.attendees.splice(0);
      newData.sort((a, b) => (a.last_name > b.last_name) ? 1 : (a.last_name === b.last_name) ? ((a.first_name > b.first_name) ? 1 : -1) : -1);

      this.setState({
        data: newData,
        error: data.error || null,
        loading: false,
        refreshing: false,
      });

      this.arrayholder = newData;
    });

  };

  renderSeparator = () => {
    return (
      <View
        style={{
          height: 1,
          width: '86%',
          backgroundColor: '#CED0CE',
          marginLeft: '14%',
        }}
      />
    );
  };

  searchFilterFunction = text => {
    this.setState({
      value: text,
    });

    const newData = this.arrayholder.filter(item => {
      const itemData = `${item.first_name.toUpperCase()} ${item.last_name.toUpperCase()} ${item.email.toUpperCase()}`;
      const textData = text.toUpperCase();

      return itemData.indexOf(textData) > -1;
    });
    this.setState({
      data: newData,
    });
  };

  renderHeader = () => {
    return (
      <SearchBar
        placeholder="Type Here..."
        lightTheme
        round
        onChangeText={text => this.searchFilterFunction(text)}
        autoCorrect={false}
        value={this.state.value}
      />
    );
  };

  _onRefresh = () => {
    this.setState({ refreshing: true });
    this.makeRemoteRequest();
    this.setState({ refreshing: false });
  }

  render() {
    if (this.state.loading) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator />
        </View>
      );
    }
    return (
      <View style={{ flex: 1 }}>
        <FlatList
          data={this.state.data}
          refreshControl={
            <RefreshControl
              refreshing={this.state.refreshing}
              onRefresh={this._onRefresh}
            />
          }
          renderItem={({ item }) => (
            <ListItem
              //leftAvatar={{ source: { uri: item.picture.thumbnail } }}
              title={`${item.first_name} ${item.last_name}`}
              subtitle={item.email}
            />
          )}
          keyExtractor={item => item.email}
          ItemSeparatorComponent={this.renderSeparator}
          ListHeaderComponent={this.renderHeader}
        />
      </View>
    );
  }
}

export default HomeScreen;