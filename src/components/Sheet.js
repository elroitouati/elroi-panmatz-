import React from 'react';
import { Modal, View, Pressable, StyleSheet } from 'react-native';
import { colors, radius, space } from '../design/tokens';

// גיליון תחתון וחלון מרכזי — מעטפת אחת לכל הדיאלוגים,
// כך שהרדיוס, הריפוד והכיסוי זהים בכל האפליקציה.
export default function Sheet({ visible, onClose, children, variant = 'center' }) {
  const bottom = variant === 'bottom';
  return (
    <Modal
      transparent
      visible={visible}
      animationType={bottom ? 'slide' : 'fade'}
      onRequestClose={onClose}
    >
      <Pressable
        style={[styles.scrim, bottom ? styles.scrimBottom : styles.scrimCenter]}
        onPress={onClose}
        accessibilityLabel="סגירה"
      >
        <Pressable
          style={[styles.panel, bottom ? styles.panelBottom : styles.panelCenter]}
          onPress={() => {}}
        >
          {bottom ? <View style={styles.handle} /> : null}
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: colors.scrim },
  scrimCenter: { alignItems: 'center', justifyContent: 'center', padding: space[5] },
  scrimBottom: { justifyContent: 'flex-end' },
  panel: {
    backgroundColor: colors.bg,
    borderColor: colors.border,
    borderWidth: 1,
    padding: space[5],
  },
  panelCenter: { width: '100%', maxWidth: 360, borderRadius: radius.lg },
  panelBottom: {
    borderTopStartRadius: radius.lg,
    borderTopEndRadius: radius.lg,
    maxHeight: '90%',
  },
  handle: {
    width: 40, height: 4, borderRadius: radius.pill,
    backgroundColor: colors.surface3,
    alignSelf: 'center', marginBottom: space[4],
  },
});
