import React from 'react';
import { Platform, View, StyleSheet, useWindowDimensions, Text } from 'react-native';

interface MobileDeviceWrapperProps {
  children: React.ReactNode;
}

export const MobileDeviceWrapper: React.FC<MobileDeviceWrapperProps> = ({ children }) => {
  // Only apply device frame on web
  if (Platform.OS !== 'web') return <>{children}</>;

  // Target a realistic iPhone Pro logical size (dp)
  const DEVICE_WIDTH = 393; // iPhone 14/15/16 Pro width (dp)
  const DEVICE_HEIGHT = 852; // iPhone 14/15/16 Pro height (dp)
  const DEVICE_RADIUS = 46; // Screen corner radius

  // Bezel/frame settings around the screen area
  const BEZEL = 18; // thickness around the screen
  const STATUS_BAR = 54; // visual status bar height
  const HOME_AREA = 22; // area reserved for home indicator

  // Outer phone body dimensions (screen + bezel)
  const outerWidth = DEVICE_WIDTH + BEZEL * 2;
  const outerHeight = STATUS_BAR + DEVICE_HEIGHT + HOME_AREA + BEZEL * 2;

  const { width: winW, height: winH } = useWindowDimensions();

  // Fit the whole device into the viewport, with a small margin
  const margin = 24;
  const scale = Math.min(
    (winW - margin) / outerWidth,
    (winH - margin) / outerHeight,
    1
  );

  return (
    <View style={styles.container}>
      {/* Phone body (scaled as a unit) */}
      <View
        style={[
          styles.phoneBody,
          {
            width: outerWidth,
            height: outerHeight,
            borderRadius: DEVICE_RADIUS + BEZEL,
            transform: [{ scale }],
          },
        ]}
      >
        {/* Decorative side highlight for more realism */}
        <View style={styles.phoneBodyInner} />

        {/* Screen area with bezels */}
        <View
          style={[
            styles.mobileFrame,
            {
              padding: BEZEL,
              borderRadius: DEVICE_RADIUS + 8,
            },
          ]}
        >
          {/* Status Bar */}
          <View style={[styles.statusBar, { height: STATUS_BAR }]}>
            <View style={styles.statusBarLeft}>
              <Text style={styles.time}>9:41</Text>
            </View>
            <View style={styles.dynamicIsland} />
            <View style={styles.statusBarRight}>
              <View style={styles.signalBars}>
                <View style={[styles.bar, styles.bar1]} />
                <View style={[styles.bar, styles.bar2]} />
                <View style={[styles.bar, styles.bar3]} />
                <View style={[styles.bar, styles.bar4]} />
              </View>
              <View style={styles.wifiIcon} />
              <View style={styles.batteryIcon}>
                <View style={styles.batteryLevel} />
              </View>
            </View>
          </View>

          {/* App Content */}
          <View
            style={[
              styles.appContainer,
              {
                width: DEVICE_WIDTH,
                height: DEVICE_HEIGHT,
                borderRadius: DEVICE_RADIUS,
              },
            ]}
          >
            {children}
          </View>

          {/* Home Indicator area */}
          <View style={[styles.homeArea, { height: HOME_AREA }]}> 
            <View style={styles.homeIndicator} />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneBody: {
    backgroundColor: '#121214',
    borderRadius: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.35,
    shadowRadius: 40,
    elevation: 30,
    overflow: 'hidden',
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  phoneBodyInner: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 60,
    borderColor: '#2a2a2e',
    borderWidth: 2,
    opacity: 0.8,
  },
  mobileFrame: {
    flex: 1,
    backgroundColor: '#1c1c1e',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  statusBarLeft: {
    flex: 1,
  },
  time: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  dynamicIsland: {
    width: 126,
    height: 37, // mimic Dynamic Island
    backgroundColor: '#000',
    borderRadius: 18.5,
    position: 'absolute',
    left: '50%',
    marginLeft: -63,
  },
  statusBarRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  signalBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginRight: 6,
  },
  bar: {
    width: 3,
    backgroundColor: '#fff',
    marginRight: 2,
  },
  bar1: { height: 4 },
  bar2: { height: 6 },
  bar3: { height: 8 },
  bar4: { height: 10 },
  wifiIcon: {
    width: 15,
    height: 11,
    backgroundColor: '#fff',
    borderRadius: 2,
    marginRight: 6,
  },
  batteryIcon: {
    width: 24,
    height: 12,
    borderWidth: 1,
    borderColor: '#fff',
    borderRadius: 2,
    padding: 1,
  },
  batteryLevel: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 1,
  },
  appContainer: {
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 40,
    overflow: 'hidden',
    // Ensure proper content fitting
    minHeight: 0,
  },
  homeArea: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  homeIndicator: {
    width: 134,
    height: 5,
    backgroundColor: '#000',
    borderRadius: 2.5,
    marginBottom: 6,
  },
});

