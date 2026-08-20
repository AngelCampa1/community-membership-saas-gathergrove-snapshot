/**
 * Web-compatible BaseViewConfig implementation
 * This provides a minimal view configuration for web browsers
 */

const bubblingEventTypes = {
  topChange: {
    phasedRegistrationNames: {
      captured: 'onChangeCapture',
      bubbled: 'onChange',
    },
  },
  topSelect: {
    phasedRegistrationNames: {
      captured: 'onSelectCapture',
      bubbled: 'onSelect',
    },
  },
  topTouchEnd: {
    phasedRegistrationNames: {
      captured: 'onTouchEndCapture',
      bubbled: 'onTouchEnd',
    },
  },
  topTouchCancel: {
    phasedRegistrationNames: {
      captured: 'onTouchCancelCapture',
      bubbled: 'onTouchCancel',
    },
  },
  topTouchStart: {
    phasedRegistrationNames: {
      captured: 'onTouchStartCapture',
      bubbled: 'onTouchStart',
    },
  },
  topTouchMove: {
    phasedRegistrationNames: {
      captured: 'onTouchMoveCapture',
      bubbled: 'onTouchMove',
    },
  },
  topClick: {
    phasedRegistrationNames: {
      captured: 'onClickCapture',
      bubbled: 'onClick',
    },
  },
};

const directEventTypes = {
  topAccessibilityAction: {
    registrationName: 'onAccessibilityAction',
  },
  topContentSizeChange: {
    registrationName: 'onContentSizeChange',
  },
  topScrollBeginDrag: {
    registrationName: 'onScrollBeginDrag',
  },
  topSelectionChange: {
    registrationName: 'onSelectionChange',
  },
  topMomentumScrollEnd: {
    registrationName: 'onMomentumScrollEnd',
  },
  topMomentumScrollBegin: {
    registrationName: 'onMomentumScrollBegin',
  },
  topScrollEndDrag: {
    registrationName: 'onScrollEndDrag',
  },
  topScroll: {
    registrationName: 'onScroll',
  },
  topLayout: {
    registrationName: 'onLayout',
  },
};

// Simplified validation attributes for web
const validAttributes = {
  // Basic style properties
  backgroundColor: true,
  transform: true,
  opacity: true,
  zIndex: true,
  testID: true,
  nativeID: true,
  
  // Accessibility
  accessibilityLabel: true,
  accessibilityHint: true,
  accessibilityRole: true,
  role: true,
  
  // Layout
  width: true,
  height: true,
  flex: true,
  flexGrow: true,
  flexShrink: true,
  flexBasis: true,
  flexDirection: true,
  flexWrap: true,
  alignSelf: true,
  alignItems: true,
  alignContent: true,
  justifyContent: true,
  overflow: true,
  display: true,
  
  // Margin and padding
  margin: true,
  marginTop: true,
  marginBottom: true,
  marginLeft: true,
  marginRight: true,
  padding: true,
  paddingTop: true,
  paddingBottom: true,
  paddingLeft: true,
  paddingRight: true,
  
  // Borders
  borderWidth: true,
  borderColor: true,
  borderRadius: true,
  borderStyle: true,
  
  // Position
  position: true,
  top: true,
  bottom: true,
  left: true,
  right: true,
  
  // Event handlers
  onLayout: true,
  onTouchStart: true,
  onTouchMove: true,
  onTouchEnd: true,
  onTouchCancel: true,
  onClick: true,
  
  // Style prop
  style: true,
  
  // Interactive properties
  accessible: true,
  pointerEvents: true,
};

const PlatformBaseViewConfigWeb = {
  directEventTypes,
  bubblingEventTypes,
  validAttributes,
};

export default PlatformBaseViewConfigWeb;