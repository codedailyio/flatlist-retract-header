import React, { Component } from "react";
import {
  Animated,
  Image,
  Platform,
  StyleSheet,
  View,
  Text,
  ListView,
  FlatList,
  ImageBackground,
  TouchableOpacity,
  StatusBar,
} from "react-native";

import { Entypo } from "@expo/vector-icons";

import data from "./data";

const STATUS_BAR_HEIGHT = Platform.select({ ios: 20, android: StatusBar.currentHeight });
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

export default class App extends Component {
  state = {
    scrollAnim: new Animated.Value(0),
    offsetAnim: new Animated.Value(0),
    hiddenAnimation: new Animated.Value(0),
    headerHeight: 0,
    textHeight: 0,
  };

  _clampedScrollValue = 0;
  _offsetValue = 0;
  _scrollValue = 0;

  componentDidMount() {
    this.state.scrollAnim.addListener(({ value }) => {
      const diff = value - this._scrollValue;
      this._scrollValue = value;
      this._clampedScrollValue = Math.min(
        Math.max(this._clampedScrollValue + diff, 0),
        this.getHeaderHeight(),
      );
    });
    this.state.offsetAnim.addListener(({ value }) => {
      this._offsetValue = value;
    });
  }

  componentWillUnmount() {
    this.state.scrollAnim.removeAllListeners();
    this.state.offsetAnim.removeAllListeners();
  }

  _onScrollEndDrag = () => {
    this._scrollEndTimer = setTimeout(this._onMomentumScrollEnd, 250);
  };

  _onMomentumScrollBegin = () => {
    clearTimeout(this._scrollEndTimer);
  };

  _onMomentumScrollEnd = () => {
    const NAVBAR_HEIGHT = this.getHeaderHeight();
    const HEADER_HEIGHT = this.state.headerHeight;

    const toValue =
      this._scrollValue > HEADER_HEIGHT && this._clampedScrollValue > NAVBAR_HEIGHT / 2
        ? this._offsetValue + HEADER_HEIGHT
        : this._offsetValue - HEADER_HEIGHT;

    Animated.timing(this.state.offsetAnim, {
      toValue,
      duration: 350,
      useNativeDriver: true,
    }).start();
  };
  keyExtractor = (item, index) => index;

  _renderRow = ({ item }) => {
    return (
      <ImageBackground style={styles.row} source={{ uri: item.image }} resizeMode="cover">
        <Text style={styles.rowText}>{item.title}</Text>
      </ImageBackground>
    );
  };

  onHeaderLayout = e => {
    this.setState({
      headerHeight: e.nativeEvent.layout.height,
    });
    this.handleShowList()
  };

  onHeaderTextLayout = e => {
    this.setState({
      textHeight: e.nativeEvent.layout.height,
    });
    this.handleShowList()
  };

  handleShowList = () => {
    if (this.state.headerHeight !== 0 && this.state.textHeight !== 0) {
      this.state.hiddenAnimation.setValue(1);
    }
  };

  getHeaderHeight = () => {
    const { headerHeight, textHeight } = this.state;
    return headerHeight - textHeight - STATUS_BAR_HEIGHT;
  };

  render() {
    const { headerHeight, textHeight, offsetAnim, scrollAnim, hiddenAnimation } = this.state;
    const HEADER_HEIGHT = this.getHeaderHeight() < 0 ? 1 : this.getHeaderHeight();

    const clampedScroll = Animated.diffClamp(
      Animated.add(
        scrollAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
          extrapolateLeft: "clamp",
        }),
        offsetAnim,
      ),
      0,
      HEADER_HEIGHT,
    );

    const navbarTranslate = clampedScroll.interpolate({
      inputRange: [0, HEADER_HEIGHT],
      outputRange: [0, -HEADER_HEIGHT],
      extrapolate: "clamp",
    });
    const navbarOpacity = clampedScroll.interpolate({
      inputRange: [0, HEADER_HEIGHT],
      outputRange: [1, 0],
      extrapolate: "clamp",
    });

    return (
      <Animated.View style={styles.fill}>
        <AnimatedFlatList
          contentContainerStyle={{ paddingTop: HEADER_HEIGHT }}
          data={data}
          style={{ opacity: hiddenAnimation }}
          renderItem={this._renderRow}
          keyExtractor={this.keyExtractor}
          scrollEventThrottle={1}
          onMomentumScrollBegin={this._onMomentumScrollBegin}
          onMomentumScrollEnd={this._onMomentumScrollEnd}
          onScrollEndDrag={this._onScrollEndDrag}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: this.state.scrollAnim } } }],
            { useNativeDriver: true },
          )}
        />
        <Animated.View
          style={[styles.navbar, { transform: [{ translateY: navbarTranslate }] }]}
          onLayout={this.onHeaderLayout}
        >
          <Animated.View
            style={{
              opacity: navbarOpacity,
              flexDirection: "row",
              flex: 1,
              justifyContent: "space-around",
            }}
          >
            <TouchableOpacity>
              <Entypo name="circle" size={50} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity>
              <Entypo name="circle" size={50} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity>
              <Entypo name="circle" size={50} color="#000" />
            </TouchableOpacity>
          </Animated.View>
          <Text style={[styles.title]} onLayout={this.onHeaderTextLayout}>
            {data.length} Results
          </Text>
        </Animated.View>
      </Animated.View>
    );
  }
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  navbar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderBottomColor: "#dedede",
    borderBottomWidth: 1,
    paddingTop: STATUS_BAR_HEIGHT,
  },

  title: {
    color: "#333333",
    textAlign: "center",
  },
  row: {
    height: 300,
    width: null,
    marginBottom: 1,
    padding: 16,
    backgroundColor: "transparent",
  },
  rowText: {
    color: "white",
    fontSize: 18,
  },
});
